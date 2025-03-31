/**
 * RPG Maker MV Conditional Logic Analyzer
 * 
 * This module analyzes conditional logic in RPG Maker MV data files.
 * It extracts conditions, decision trees, and state transitions.
 */

const fs = require('fs-extra');
const path = require('path');
const { parseJson } = require('../../core');

/**
 * Analyze conditional logic in an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {Object} options - Options for analysis
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeConditionalLogic(projectPath, options = {}) {
  const {
    includeFiles = ['States.json', 'CommonEvents.json', 'Map*.json'],
    excludeFiles = [],
    includeTypes = ['placeholder_state', 'custom_state_turn', 'conditional_branch']
  } = options;

  // Validate project path
  const dataPath = path.join(projectPath, 'data');
  if (!await fs.pathExists(dataPath)) {
    throw new Error(`Invalid RPG Maker MV project path: ${projectPath}`);
  }

  // Initialize results
  const results = {
    conditions: [],
    decisionTrees: [],
    stateTransitions: [],
    variableUsage: {},
    switchUsage: {},
    commonPatterns: {}
  };

  // Get all matching files
  const files = await getMatchingFiles(dataPath, includeFiles, excludeFiles);

  // Process each file
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const data = parseJson(content);
      const fileName = path.basename(file);

      // Extract conditional logic based on file type
      if (fileName === 'States.json') {
        extractStateConditionalLogic(data, results);
      } else if (fileName === 'CommonEvents.json') {
        extractCommonEventConditionalLogic(data, results);
      } else if (fileName.startsWith('Map')) {
        extractMapConditionalLogic(data, results, fileName);
      }
    } catch (error) {
      console.error(`Error processing file ${file}: ${error.message}`);
    }
  }

  // Analyze conditions
  analyzeConditions(results);
  
  // Build decision trees
  buildDecisionTrees(results);
  
  // Analyze state transitions
  analyzeStateTransitions(results);

  return results;
}

/**
 * Get matching files from a directory
 * @param {string} dataPath - Path to the data directory
 * @param {string[]} includePatterns - Patterns to include
 * @param {string[]} excludePatterns - Patterns to exclude
 * @returns {Promise<string[]>} - Matching file paths
 */
async function getMatchingFiles(dataPath, includePatterns, excludePatterns) {
  const matchingFiles = [];

  // Process each include pattern
  for (const pattern of includePatterns) {
    const files = await globPromise(pattern, {
      cwd: dataPath,
      nodir: true,
      ignore: excludePatterns
    });

    // Add full paths
    for (const file of files) {
      matchingFiles.push(path.join(dataPath, file));
    }
  }

  return matchingFiles;
}

/**
 * Promise-based glob function
 * @param {string} pattern - Glob pattern
 * @param {Object} options - Options
 * @returns {Promise<string[]>} - Matching files
 */
function globPromise(pattern, options) {
  const glob = require('glob');
  return new Promise((resolve, reject) => {
    glob(pattern, options, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

/**
 * Extract conditional logic from States.json
 * @param {Object} data - Parsed JSON data
 * @param {Object} results - Results object to update
 */
function extractStateConditionalLogic(data, results) {
  if (!Array.isArray(data)) return;

  for (const state of data) {
    if (!state || !state.note) continue;

    // Extract placeholder state patterns
    const placeholderStateRegex = /<placeholder state>([\s\S]*?)<\/placeholder state>/g;
    let match;
    while ((match = placeholderStateRegex.exec(state.note)) !== null) {
      const content = match[1].trim();
      const conditions = parseConditionalLogic(content);

      results.conditions.push({
        type: 'placeholder_state',
        content,
        conditions,
        source: {
          id: state.id,
          name: state.name,
          type: 'state'
        }
      });

      // Add state transition
      if (conditions.length > 0) {
        results.stateTransitions.push({
          fromState: state.id,
          conditions: conditions,
          possibleStates: extractPossibleStates(content)
        });
      }
    }

    // Extract custom state turn patterns
    const customStateTurnRegex = /<Custom State (\d+) Turn>([\s\S]*?)<\/Custom State \1 Turn>/g;
    while ((match = customStateTurnRegex.exec(state.note)) !== null) {
      const stateId = match[1];
      const content = match[2].trim();
      const conditions = parseConditionalLogic(content);

      results.conditions.push({
        type: 'custom_state_turn',
        stateId,
        content,
        conditions,
        source: {
          id: state.id,
          name: state.name,
          type: 'state'
        }
      });
    }
  }
}

/**
 * Extract conditional logic from CommonEvents.json
 * @param {Object} data - Parsed JSON data
 * @param {Object} results - Results object to update
 */
function extractCommonEventConditionalLogic(data, results) {
  if (!Array.isArray(data)) return;

  for (const event of data) {
    if (!event || !event.list) continue;

    // Extract conditional branches
    extractEventCommands(event.list, results, {
      id: event.id,
      name: event.name,
      type: 'common_event'
    });
  }
}

/**
 * Extract conditional logic from Map files
 * @param {Object} data - Parsed JSON data
 * @param {Object} results - Results object to update
 * @param {string} fileName - File name
 */
function extractMapConditionalLogic(data, results, fileName) {
  if (!data || !data.events) return;

  // Extract map ID from file name
  const mapIdMatch = fileName.match(/Map(\d+)\.json/);
  const mapId = mapIdMatch ? parseInt(mapIdMatch[1]) : 0;

  // Process each event
  for (const event of data.events) {
    if (!event) continue;

    // Process each page
    if (event.pages && Array.isArray(event.pages)) {
      for (let pageIndex = 0; pageIndex < event.pages.length; pageIndex++) {
        const page = event.pages[pageIndex];
        if (!page || !page.list) continue;

        // Extract conditional branches
        extractEventCommands(page.list, results, {
          id: event.id,
          name: event.name || `Event ${event.id}`,
          type: 'map_event',
          mapId,
          page: pageIndex + 1
        });

        // Extract page conditions
        if (page.conditions) {
          extractPageConditions(page.conditions, results, {
            id: event.id,
            name: event.name || `Event ${event.id}`,
            type: 'map_event',
            mapId,
            page: pageIndex + 1
          });
        }
      }
    }
  }
}

/**
 * Extract conditional logic from event commands
 * @param {Object[]} commands - Event commands
 * @param {Object} results - Results object to update
 * @param {Object} source - Source information
 * @param {number} depth - Current depth in the command tree
 * @param {Object} parent - Parent command
 */
function extractEventCommands(commands, results, source, depth = 0, parent = null) {
  if (!Array.isArray(commands)) return;

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    if (!command) continue;

    // Process conditional branch (code 111)
    if (command.code === 111) {
      const condition = parseEventCondition(command);
      
      // Add to conditions
      results.conditions.push({
        type: 'conditional_branch',
        condition,
        source,
        depth,
        parent: parent ? { code: parent.code, parameters: parent.parameters } : null
      });

      // Track variable and switch usage
      trackVariableSwitchUsage(condition, results);

      // Find the end of this conditional branch
      let endIndex = findConditionalEnd(commands, i);
      
      // Extract commands inside this branch
      if (endIndex > i + 1) {
        const branchCommands = commands.slice(i + 1, endIndex);
        extractEventCommands(branchCommands, results, source, depth + 1, command);
      }

      // Skip to the end of this branch
      i = endIndex;
    }
    // Process else branch (code 411)
    else if (command.code === 411 && parent && parent.code === 111) {
      // Find the end of this else branch
      let endIndex = findElseEnd(commands, i);
      
      // Extract commands inside this branch
      if (endIndex > i + 1) {
        const branchCommands = commands.slice(i + 1, endIndex);
        extractEventCommands(branchCommands, results, source, depth + 1, command);
      }

      // Skip to the end of this branch
      i = endIndex;
    }
    // Process other commands
    else {
      // Recursively process command lists in other commands
      if (command.parameters) {
        for (const param of command.parameters) {
          if (Array.isArray(param) && param.length > 0 && param[0] && typeof param[0] === 'object' && param[0].code) {
            extractEventCommands(param, results, source, depth + 1, command);
          }
        }
      }
    }
  }
}

/**
 * Extract page conditions
 * @param {Object} conditions - Page conditions
 * @param {Object} results - Results object to update
 * @param {Object} source - Source information
 */
function extractPageConditions(conditions, results, source) {
  const pageCondition = {
    type: 'page_condition',
    conditions: [],
    source
  };

  // Switch condition
  if (conditions.switch1Valid) {
    pageCondition.conditions.push({
      type: 'switch',
      switchId: conditions.switch1Id,
      value: true
    });

    // Track switch usage
    if (!results.switchUsage[conditions.switch1Id]) {
      results.switchUsage[conditions.switch1Id] = { count: 0, sources: [] };
    }
    results.switchUsage[conditions.switch1Id].count++;
    results.switchUsage[conditions.switch1Id].sources.push(source);
  }

  // Second switch condition
  if (conditions.switch2Valid) {
    pageCondition.conditions.push({
      type: 'switch',
      switchId: conditions.switch2Id,
      value: true
    });

    // Track switch usage
    if (!results.switchUsage[conditions.switch2Id]) {
      results.switchUsage[conditions.switch2Id] = { count: 0, sources: [] };
    }
    results.switchUsage[conditions.switch2Id].count++;
    results.switchUsage[conditions.switch2Id].sources.push(source);
  }

  // Variable condition
  if (conditions.variableValid) {
    pageCondition.conditions.push({
      type: 'variable',
      variableId: conditions.variableId,
      value: conditions.variableValue,
      operator: '>='
    });

    // Track variable usage
    if (!results.variableUsage[conditions.variableId]) {
      results.variableUsage[conditions.variableId] = { count: 0, sources: [] };
    }
    results.variableUsage[conditions.variableId].count++;
    results.variableUsage[conditions.variableId].sources.push(source);
  }

  // Self switch condition
  if (conditions.selfSwitchValid) {
    pageCondition.conditions.push({
      type: 'self_switch',
      switchId: conditions.selfSwitchCh,
      value: true
    });
  }

  // Item condition
  if (conditions.itemValid) {
    pageCondition.conditions.push({
      type: 'item',
      itemId: conditions.itemId,
      value: true
    });
  }

  // Actor condition
  if (conditions.actorValid) {
    pageCondition.conditions.push({
      type: 'actor',
      actorId: conditions.actorId,
      value: true
    });
  }

  // Add to conditions if not empty
  if (pageCondition.conditions.length > 0) {
    results.conditions.push(pageCondition);
  }
}

/**
 * Find the end of a conditional branch
 * @param {Object[]} commands - Event commands
 * @param {number} startIndex - Start index
 * @returns {number} - End index
 */
function findConditionalEnd(commands, startIndex) {
  let depth = 0;
  
  for (let i = startIndex + 1; i < commands.length; i++) {
    const command = commands[i];
    
    if (command.code === 111) {
      // Nested conditional branch
      depth++;
    } else if (command.code === 411 && depth === 0) {
      // Else branch at the same level
      continue;
    } else if (command.code === 412) {
      // End of conditional branch
      if (depth === 0) {
        return i;
      } else {
        depth--;
      }
    }
  }
  
  return commands.length - 1;
}

/**
 * Find the end of an else branch
 * @param {Object[]} commands - Event commands
 * @param {number} startIndex - Start index
 * @returns {number} - End index
 */
function findElseEnd(commands, startIndex) {
  for (let i = startIndex + 1; i < commands.length; i++) {
    const command = commands[i];
    
    if (command.code === 412) {
      // End of conditional branch
      return i;
    }
  }
  
  return commands.length - 1;
}

/**
 * Parse conditional logic from content
 * @param {string} content - Content to parse
 * @returns {Object[]} - Parsed conditions
 */
function parseConditionalLogic(content) {
  const conditions = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Parse if statements
    if (line.startsWith('if') || line.startsWith('else if')) {
      const condition = parseIfStatement(line);
      
      if (condition) {
        conditions.push(condition);
        
        // Find the end of this if block
        let blockEnd = findBlockEnd(lines, i);
        
        // Add the block content
        condition.block = lines.slice(i + 1, blockEnd).map(l => l.trim()).join('\n');
        
        // Skip to the end of this block
        i = blockEnd;
      }
    }
    // Parse else statements
    else if (line.startsWith('else')) {
      const condition = {
        type: 'else',
        condition: true
      };
      
      conditions.push(condition);
      
      // Find the end of this else block
      let blockEnd = findBlockEnd(lines, i);
      
      // Add the block content
      condition.block = lines.slice(i + 1, blockEnd).map(l => l.trim()).join('\n');
      
      // Skip to the end of this block
      i = blockEnd;
    }
  }

  return conditions;
}

/**
 * Parse an if statement
 * @param {string} line - Line to parse
 * @returns {Object|null} - Parsed condition
 */
function parseIfStatement(line) {
  // Extract the condition part
  const match = line.match(/if\s*\((.*)\)/);
  if (!match) return null;
  
  const conditionStr = match[1].trim();
  
  // Parse the condition
  return {
    type: line.startsWith('if') ? 'if' : 'else_if',
    condition: conditionStr
  };
}

/**
 * Find the end of a code block
 * @param {string[]} lines - Lines of code
 * @param {number} startIndex - Start index
 * @returns {number} - End index
 */
function findBlockEnd(lines, startIndex) {
  let depth = 0;
  let inBlock = false;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('{')) {
      depth++;
      inBlock = true;
    }
    
    if (line.includes('}')) {
      depth--;
      
      if (depth === 0 && inBlock) {
        return i;
      }
    }
    
    // Handle single-line blocks without braces
    if (inBlock === false && i > startIndex && 
        !line.startsWith('else') && 
        (line.length > 0 || i === lines.length - 1)) {
      return i;
    }
  }
  
  return lines.length - 1;
}

/**
 * Parse an event condition
 * @param {Object} command - Event command
 * @returns {Object} - Parsed condition
 */
function parseEventCondition(command) {
  if (!command.parameters || command.parameters.length === 0) {
    return { type: 'unknown' };
  }

  const conditionType = command.parameters[0];
  
  switch (conditionType) {
    case 0: // Switch
      return {
        type: 'switch',
        switchId: command.parameters[1],
        value: command.parameters[2] === 0 // 0 = ON, 1 = OFF
      };
    
    case 1: // Variable
      return {
        type: 'variable',
        variableId: command.parameters[1],
        value: command.parameters[3],
        operator: parseOperator(command.parameters[2])
      };
    
    case 2: // Self Switch
      return {
        type: 'self_switch',
        switchId: command.parameters[1],
        value: command.parameters[2] === 0 // 0 = ON, 1 = OFF
      };
    
    case 3: // Timer
      return {
        type: 'timer',
        value: command.parameters[2],
        operator: parseOperator(command.parameters[1])
      };
    
    case 4: // Actor
      return {
        type: 'actor',
        actorId: command.parameters[1],
        subType: command.parameters[2],
        value: command.parameters[3]
      };
    
    case 5: // Enemy
      return {
        type: 'enemy',
        enemyIndex: command.parameters[1],
        subType: command.parameters[2],
        value: command.parameters[3]
      };
    
    case 6: // Character
      return {
        type: 'character',
        characterId: command.parameters[1],
        subType: command.parameters[2],
        value: command.parameters[3]
      };
    
    case 7: // Gold
      return {
        type: 'gold',
        value: command.parameters[2],
        operator: parseOperator(command.parameters[1])
      };
    
    case 8: // Item
      return {
        type: 'item',
        itemId: command.parameters[1],
        value: true
      };
    
    case 9: // Weapon
      return {
        type: 'weapon',
        weaponId: command.parameters[1],
        value: true
      };
    
    case 10: // Armor
      return {
        type: 'armor',
        armorId: command.parameters[1],
        value: true
      };
    
    case 11: // Button
      return {
        type: 'button',
        buttonId: command.parameters[1],
        value: true
      };
    
    case 12: // Script
      return {
        type: 'script',
        script: command.parameters[1]
      };
    
    case 13: // Vehicle
      return {
        type: 'vehicle',
        vehicleType: command.parameters[1],
        value: true
      };
    
    default:
      return {
        type: 'unknown',
        parameters: command.parameters
      };
  }
}

/**
 * Parse an operator
 * @param {number} operatorId - Operator ID
 * @returns {string} - Operator string
 */
function parseOperator(operatorId) {
  switch (operatorId) {
    case 0: return '==';
    case 1: return '>=';
    case 2: return '<=';
    case 3: return '>';
    case 4: return '<';
    case 5: return '!=';
    default: return '==';
  }
}

/**
 * Extract possible states from content
 * @param {string} content - Content to parse
 * @returns {number[]} - Possible state IDs
 */
function extractPossibleStates(content) {
  const states = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Look for state IDs (numbers at the end of lines)
    const stateMatch = trimmedLine.match(/(\d+);?\s*$/);
    if (stateMatch) {
      const stateId = parseInt(stateMatch[1]);
      if (!isNaN(stateId) && !states.includes(stateId)) {
        states.push(stateId);
      }
    }
  }
  
  return states;
}

/**
 * Track variable and switch usage
 * @param {Object} condition - Condition object
 * @param {Object} results - Results object to update
 */
function trackVariableSwitchUsage(condition, results) {
  if (condition.type === 'variable') {
    const variableId = condition.variableId;
    
    if (!results.variableUsage[variableId]) {
      results.variableUsage[variableId] = { count: 0, sources: [] };
    }
    
    results.variableUsage[variableId].count++;
    results.variableUsage[variableId].sources.push(condition.source);
  }
  else if (condition.type === 'switch') {
    const switchId = condition.switchId;
    
    if (!results.switchUsage[switchId]) {
      results.switchUsage[switchId] = { count: 0, sources: [] };
    }
    
    results.switchUsage[switchId].count++;
    results.switchUsage[switchId].sources.push(condition.source);
  }
}

/**
 * Analyze conditions
 * @param {Object} results - Results object to update
 */
function analyzeConditions(results) {
  const conditions = results.conditions;
  const patterns = {};
  
  // Group conditions by type
  const conditionsByType = {};
  for (const condition of conditions) {
    const type = condition.type;
    
    if (!conditionsByType[type]) {
      conditionsByType[type] = [];
    }
    
    conditionsByType[type].push(condition);
  }
  
  // Analyze each type
  for (const [type, typeConditions] of Object.entries(conditionsByType)) {
    patterns[type] = findCommonPatterns(typeConditions);
  }
  
  results.commonPatterns = patterns;
}

/**
 * Find common patterns in conditions
 * @param {Object[]} conditions - Conditions
 * @returns {Object} - Common patterns
 */
function findCommonPatterns(conditions) {
  const patterns = {};
  
  // Count condition types
  for (const condition of conditions) {
    if (condition.condition && typeof condition.condition === 'object') {
      const type = condition.condition.type;
      
      if (!patterns[type]) {
        patterns[type] = { count: 0, examples: [] };
      }
      
      patterns[type].count++;
      
      // Add example if we don't have many yet
      if (patterns[type].examples.length < 5) {
        patterns[type].examples.push(condition);
      }
    }
  }
  
  return patterns;
}

/**
 * Build decision trees
 * @param {Object} results - Results object to update
 */
function buildDecisionTrees(results) {
  const conditions = results.conditions;
  const trees = [];
  
  // Group conditions by source
  const conditionsBySource = {};
  for (const condition of conditions) {
    if (!condition.source) continue;
    
    const sourceKey = `${condition.source.type}-${condition.source.id}`;
    
    if (!conditionsBySource[sourceKey]) {
      conditionsBySource[sourceKey] = [];
    }
    
    conditionsBySource[sourceKey].push(condition);
  }
  
  // Build a tree for each source
  for (const [sourceKey, sourceConditions] of Object.entries(conditionsBySource)) {
    // Sort by depth
    sourceConditions.sort((a, b) => (a.depth || 0) - (b.depth || 0));
    
    // Build tree
    const tree = {
      source: sourceConditions[0].source,
      nodes: buildTreeNodes(sourceConditions)
    };
    
    trees.push(tree);
  }
  
  results.decisionTrees = trees;
}

/**
 * Build tree nodes
 * @param {Object[]} conditions - Conditions
 * @param {number} depth - Current depth
 * @param {Object} parent - Parent node
 * @returns {Object[]} - Tree nodes
 */
function buildTreeNodes(conditions, depth = 0, parent = null) {
  const nodes = [];
  
  // Get conditions at this depth
  const depthConditions = conditions.filter(c => (c.depth || 0) === depth && 
                                           (!parent || c.parent === parent));
  
  for (const condition of depthConditions) {
    const node = {
      condition: condition.condition,
      children: buildTreeNodes(conditions, depth + 1, condition)
    };
    
    nodes.push(node);
  }
  
  return nodes;
}

/**
 * Analyze state transitions
 * @param {Object} results - Results object to update
 */
function analyzeStateTransitions(results) {
  const transitions = results.stateTransitions;
  
  // Group transitions by from state
  const transitionsByState = {};
  for (const transition of transitions) {
    const fromState = transition.fromState;
    
    if (!transitionsByState[fromState]) {
      transitionsByState[fromState] = [];
    }
    
    transitionsByState[fromState].push(transition);
  }
  
  // Update transitions with grouped data
  results.stateTransitions = transitionsByState;
}

/**
 * Generate a visual representation of a decision tree
 * @param {Object} tree - Decision tree
 * @returns {string} - Visual representation
 */
function visualizeDecisionTree(tree) {
  let visualization = `Decision Tree for ${tree.source.type} ${tree.source.name} (ID: ${tree.source.id})\n\n`;
  
  // Recursively visualize nodes
  function visualizeNode(node, depth = 0) {
    const indent = '  '.repeat(depth);
    let nodeText = '';
    
    // Add condition
    if (node.condition) {
      if (typeof node.condition === 'object') {
        nodeText += `${indent}IF ${JSON.stringify(node.condition)}\n`;
      } else {
        nodeText += `${indent}IF ${node.condition}\n`;
      }
    }
    
    // Add children
    if (node.children && node.children.length > 0) {
      nodeText += `${indent}THEN\n`;
      
      for (const child of node.children) {
        nodeText += visualizeNode(child, depth + 1);
      }
      
      if (depth > 0) {
        nodeText += `${indent}END\n`;
      }
    } else {
      nodeText += `${indent}THEN [Action]\n`;
      
      if (depth > 0) {
        nodeText += `${indent}END\n`;
      }
    }
    
    return nodeText;
  }
  
  // Visualize each root node
  for (const node of tree.nodes) {
    visualization += visualizeNode(node);
    visualization += '\n';
  }
  
  return visualization;
}

/**
 * Generate a flowchart for a decision tree
 * @param {Object} tree - Decision tree
 * @returns {string} - Mermaid flowchart
 */
function generateFlowchart(tree) {
  let flowchart = 'flowchart TD\n';
  let nodeId = 0;
  
  // Recursively generate nodes
  function generateNode(node, parentId = null) {
    const currentId = `node${nodeId++}`;
    
    // Add node
    if (node.condition) {
      if (typeof node.condition === 'object') {
        flowchart += `  ${currentId}["${JSON.stringify(node.condition).replace(/"/g, "'")}"]\n`;
      } else {
        flowchart += `  ${currentId}["${node.condition}"]\n`;
      }
    } else {
      flowchart += `  ${currentId}[Action]\n`;
    }
    
    // Link to parent
    if (parentId !== null) {
      flowchart += `  ${parentId} --> ${currentId}\n`;
    }
    
    // Process children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        generateNode(child, currentId);
      }
    } else {
      const actionId = `action${nodeId++}`;
      flowchart += `  ${actionId}([Action])\n`;
      flowchart += `  ${currentId} --> ${actionId}\n`;
    }
    
    return currentId;
  }
  
  // Generate each root node
  for (const node of tree.nodes) {
    generateNode(node);
  }
  
  return flowchart;
}

module.exports = {
  analyzeConditionalLogic,
  extractStateConditionalLogic,
  extractCommonEventConditionalLogic,
  extractMapConditionalLogic,
  parseConditionalLogic,
  visualizeDecisionTree,
  generateFlowchart
};
