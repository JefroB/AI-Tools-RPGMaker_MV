/**
 * RPG Maker MV Battle Animation Analyzer
 * 
 * This module analyzes battle animation scripts in RPG Maker MV data files.
 * It extracts animation commands, parameters, and relationships to game mechanics.
 */

const fs = require('fs-extra');
const path = require('path');
const { parseJson } = require('../../core');

/**
 * Analyze battle animations in an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {Object} options - Options for analysis
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeBattleAnimations(projectPath, options = {}) {
  const {
    includeFiles = ['Skills.json', 'Items.json'],
    excludeFiles = [],
    includeAnimationTypes = ['setup_action', 'target_action', 'whole_action', 'follow_action', 'finish_action']
  } = options;

  // Validate project path
  const dataPath = path.join(projectPath, 'data');
  if (!await fs.pathExists(dataPath)) {
    throw new Error(`Invalid RPG Maker MV project path: ${projectPath}`);
  }

  // Initialize results
  const results = {
    animations: [],
    commands: {},
    parameters: {},
    sequences: [],
    relationships: {}
  };

  // Process each file
  for (const file of includeFiles) {
    if (excludeFiles.includes(file)) continue;

    const filePath = path.join(dataPath, file);
    if (!await fs.pathExists(filePath)) continue;

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = parseJson(content);

      // Extract animations
      const animations = extractAnimations(data, file, includeAnimationTypes);
      results.animations.push(...animations);
    } catch (error) {
      console.error(`Error processing file ${file}: ${error.message}`);
    }
  }

  // Analyze animations
  results.commands = analyzeCommands(results.animations);
  results.parameters = analyzeParameters(results.animations);
  results.sequences = analyzeSequences(results.animations);
  results.relationships = analyzeRelationships(results.animations, projectPath);

  return results;
}

/**
 * Extract animations from data
 * @param {Object} data - Parsed JSON data
 * @param {string} sourceFile - Source file name
 * @param {string[]} includeAnimationTypes - Animation types to include
 * @returns {Object[]} - Extracted animations
 */
function extractAnimations(data, sourceFile, includeAnimationTypes) {
  const animations = [];

  if (!Array.isArray(data)) return animations;

  for (const item of data) {
    if (!item || !item.note) continue;

    // Extract animations based on type
    for (const type of includeAnimationTypes) {
      const regex = new RegExp(`<${type}>(([\\s\\S]*?))<\\/${type}>`, 'g');
      let match;
      while ((match = regex.exec(item.note)) !== null) {
        const content = match[1].trim();
        const commands = parseAnimationCommands(content);

        animations.push({
          type,
          content,
          commands,
          source: {
            file: sourceFile,
            id: item.id,
            name: item.name,
            itemType: getItemType(item)
          }
        });
      }
    }
  }

  return animations;
}

/**
 * Parse animation commands from content
 * @param {string} content - Animation content
 * @returns {Object[]} - Parsed commands
 */
function parseAnimationCommands(content) {
  const commands = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Parse command and parameters
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex !== -1) {
      const command = trimmedLine.substring(0, colonIndex).trim();
      const params = trimmedLine.substring(colonIndex + 1).trim();
      commands.push({
        command,
        params: parseCommandParameters(params)
      });
    } else {
      commands.push({
        command: trimmedLine,
        params: []
      });
    }
  }

  return commands;
}

/**
 * Parse command parameters
 * @param {string} paramsString - Parameters string
 * @returns {string[]} - Parsed parameters
 */
function parseCommandParameters(paramsString) {
  const params = [];
  const parts = paramsString.split(',');

  for (const part of parts) {
    params.push(part.trim());
  }

  return params;
}

/**
 * Get the type of an item based on its properties
 * @param {Object} item - Item object
 * @returns {string} - Item type
 */
function getItemType(item) {
  if (item.hasOwnProperty('stypeId')) return 'skill';
  if (item.hasOwnProperty('itypeId')) return 'item';
  if (item.hasOwnProperty('wtypeId')) return 'weapon';
  if (item.hasOwnProperty('atypeId')) return 'armor';
  return 'unknown';
}

/**
 * Analyze commands in animations
 * @param {Object[]} animations - Animations
 * @returns {Object} - Command analysis
 */
function analyzeCommands(animations) {
  const commandFrequency = {};
  const commandsByType = {};
  const commandSequences = {};

  for (const animation of animations) {
    const type = animation.type;
    
    // Initialize type if not exists
    if (!commandsByType[type]) {
      commandsByType[type] = {};
    }

    // Track command sequences
    const sequence = animation.commands.map(c => c.command).join(' -> ');
    commandSequences[sequence] = (commandSequences[sequence] || 0) + 1;

    // Analyze commands
    for (const cmd of animation.commands) {
      const command = cmd.command;
      
      // Update global frequency
      commandFrequency[command] = (commandFrequency[command] || 0) + 1;
      
      // Update type-specific frequency
      commandsByType[type][command] = (commandsByType[type][command] || 0) + 1;
    }
  }

  // Sort command sequences by frequency
  const sortedSequences = Object.entries(commandSequences)
    .filter(([_, count]) => count > 1) // Only include sequences that appear more than once
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [sequence, count]) => {
      obj[sequence] = count;
      return obj;
    }, {});

  return {
    frequency: commandFrequency,
    byType: commandsByType,
    sequences: sortedSequences
  };
}

/**
 * Analyze parameters in animations
 * @param {Object[]} animations - Animations
 * @returns {Object} - Parameter analysis
 */
function analyzeParameters(animations) {
  const parametersByCommand = {};

  for (const animation of animations) {
    for (const cmd of animation.commands) {
      const command = cmd.command;
      const params = cmd.params;
      
      // Initialize command if not exists
      if (!parametersByCommand[command]) {
        parametersByCommand[command] = {
          count: 0,
          paramCount: {},
          paramValues: {}
        };
      }
      
      // Update command count
      parametersByCommand[command].count++;
      
      // Update parameter count
      const paramCount = params.length;
      parametersByCommand[command].paramCount[paramCount] = 
        (parametersByCommand[command].paramCount[paramCount] || 0) + 1;
      
      // Update parameter values
      for (let i = 0; i < params.length; i++) {
        if (!parametersByCommand[command].paramValues[i]) {
          parametersByCommand[command].paramValues[i] = {};
        }
        
        const value = params[i];
        parametersByCommand[command].paramValues[i][value] = 
          (parametersByCommand[command].paramValues[i][value] || 0) + 1;
      }
    }
  }

  return parametersByCommand;
}

/**
 * Analyze sequences in animations
 * @param {Object[]} animations - Animations
 * @returns {Object[]} - Sequence analysis
 */
function analyzeSequences(animations) {
  const sequences = [];
  const sequenceMap = {};

  // Group animations by type
  const animationsByType = {};
  for (const animation of animations) {
    const type = animation.type;
    if (!animationsByType[type]) {
      animationsByType[type] = [];
    }
    animationsByType[type].push(animation);
  }

  // Find common sequences for each type
  for (const [type, typeAnimations] of Object.entries(animationsByType)) {
    if (typeAnimations.length < 2) continue;

    // Find common sequences
    for (let i = 0; i < typeAnimations.length - 1; i++) {
      const animation1 = typeAnimations[i];
      const commands1 = animation1.commands.map(c => c.command);
      
      for (let j = i + 1; j < typeAnimations.length; j++) {
        const animation2 = typeAnimations[j];
        const commands2 = animation2.commands.map(c => c.command);
        
        // Find longest common subsequence
        const lcs = findLongestCommonSubsequence(commands1, commands2);
        
        if (lcs.length >= 2) { // Only consider sequences of at least 2 commands
          const sequenceKey = lcs.join(' -> ');
          
          if (!sequenceMap[sequenceKey]) {
            sequenceMap[sequenceKey] = {
              type,
              commands: lcs,
              count: 0,
              sources: []
            };
          }
          
          // Update sequence
          sequenceMap[sequenceKey].count++;
          
          // Add sources if not already included
          const source1 = JSON.stringify(animation1.source);
          const source2 = JSON.stringify(animation2.source);
          
          if (!sequenceMap[sequenceKey].sources.includes(source1)) {
            sequenceMap[sequenceKey].sources.push(source1);
          }
          
          if (!sequenceMap[sequenceKey].sources.includes(source2)) {
            sequenceMap[sequenceKey].sources.push(source2);
          }
        }
      }
    }
  }

  // Convert map to array and sort by count
  for (const sequence of Object.values(sequenceMap)) {
    // Convert source strings back to objects
    sequence.sources = sequence.sources.map(s => JSON.parse(s));
    sequences.push(sequence);
  }

  return sequences.sort((a, b) => b.count - a.count);
}

/**
 * Find the longest common subsequence
 * @param {string[]} arr1 - First array
 * @param {string[]} arr2 - Second array
 * @returns {string[]} - Longest common subsequence
 */
function findLongestCommonSubsequence(arr1, arr2) {
  const dp = Array(arr1.length + 1).fill().map(() => Array(arr2.length + 1).fill(0));
  let maxLength = 0;
  let endIndex = 0;

  for (let i = 1; i <= arr1.length; i++) {
    for (let j = 1; j <= arr2.length; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        if (dp[i][j] > maxLength) {
          maxLength = dp[i][j];
          endIndex = i - 1;
        }
      }
    }
  }

  return arr1.slice(endIndex - maxLength + 1, endIndex + 1);
}

/**
 * Analyze relationships between animations and game mechanics
 * @param {Object[]} animations - Animations
 * @param {string} projectPath - Path to the project
 * @returns {Object} - Relationship analysis
 */
async function analyzeRelationships(animations, projectPath) {
  const relationships = {
    bySkillType: {},
    byDamageType: {},
    byElement: {},
    byScope: {}
  };

  // Load Skills.json to get skill information
  const skillsPath = path.join(projectPath, 'data', 'Skills.json');
  if (!await fs.pathExists(skillsPath)) {
    return relationships;
  }

  try {
    const content = await fs.readFile(skillsPath, 'utf8');
    const skills = parseJson(content);

    // Group animations by skill
    for (const animation of animations) {
      const source = animation.source;
      if (source.file !== 'Skills.json' || !source.id) continue;

      const skill = skills.find(s => s && s.id === source.id);
      if (!skill) continue;

      // Group by skill type
      const stypeId = skill.stypeId;
      if (!relationships.bySkillType[stypeId]) {
        relationships.bySkillType[stypeId] = [];
      }
      relationships.bySkillType[stypeId].push(animation);

      // Group by damage type
      const damageType = skill.damage ? skill.damage.type : 0;
      if (!relationships.byDamageType[damageType]) {
        relationships.byDamageType[damageType] = [];
      }
      relationships.byDamageType[damageType].push(animation);

      // Group by element
      const elementId = skill.damage ? skill.damage.elementId : 0;
      if (!relationships.byElement[elementId]) {
        relationships.byElement[elementId] = [];
      }
      relationships.byElement[elementId].push(animation);

      // Group by scope
      const scope = skill.scope;
      if (!relationships.byScope[scope]) {
        relationships.byScope[scope] = [];
      }
      relationships.byScope[scope].push(animation);
    }

    // Calculate common commands for each group
    for (const stypeId in relationships.bySkillType) {
      relationships.bySkillType[stypeId] = {
        animations: relationships.bySkillType[stypeId],
        commonCommands: findCommonCommands(relationships.bySkillType[stypeId])
      };
    }

    for (const damageType in relationships.byDamageType) {
      relationships.byDamageType[damageType] = {
        animations: relationships.byDamageType[damageType],
        commonCommands: findCommonCommands(relationships.byDamageType[damageType])
      };
    }

    for (const elementId in relationships.byElement) {
      relationships.byElement[elementId] = {
        animations: relationships.byElement[elementId],
        commonCommands: findCommonCommands(relationships.byElement[elementId])
      };
    }

    for (const scope in relationships.byScope) {
      relationships.byScope[scope] = {
        animations: relationships.byScope[scope],
        commonCommands: findCommonCommands(relationships.byScope[scope])
      };
    }
  } catch (error) {
    console.error(`Error analyzing relationships: ${error.message}`);
  }

  return relationships;
}

/**
 * Find common commands in animations
 * @param {Object[]} animations - Animations
 * @returns {Object} - Common commands
 */
function findCommonCommands(animations) {
  const commandCounts = {};
  const totalAnimations = animations.length;

  // Count commands
  for (const animation of animations) {
    const commandSet = new Set();
    
    for (const cmd of animation.commands) {
      commandSet.add(cmd.command);
    }
    
    for (const command of commandSet) {
      commandCounts[command] = (commandCounts[command] || 0) + 1;
    }
  }

  // Calculate frequency
  const commonCommands = {};
  for (const [command, count] of Object.entries(commandCounts)) {
    const frequency = count / totalAnimations;
    if (frequency >= 0.5) { // Only include commands that appear in at least 50% of animations
      commonCommands[command] = frequency;
    }
  }

  return commonCommands;
}

/**
 * Generate a visual representation of a battle animation
 * @param {Object} animation - Animation object
 * @returns {string} - Visual representation
 */
function visualizeAnimation(animation) {
  let visualization = `Animation Type: ${animation.type}\n`;
  visualization += `Source: ${animation.source.file} - ${animation.source.name} (ID: ${animation.source.id})\n\n`;
  
  visualization += "Commands:\n";
  for (const cmd of animation.commands) {
    visualization += `- ${cmd.command}`;
    if (cmd.params.length > 0) {
      visualization += `: ${cmd.params.join(', ')}`;
    }
    visualization += '\n';
  }
  
  return visualization;
}

/**
 * Generate a sequence diagram for a battle animation
 * @param {Object} animation - Animation object
 * @returns {string} - Mermaid sequence diagram
 */
function generateSequenceDiagram(animation) {
  let diagram = 'sequenceDiagram\n';
  diagram += '    participant User\n';
  diagram += '    participant Target\n';
  diagram += '    participant Camera\n';
  diagram += '    participant Animation\n';
  
  for (const cmd of animation.commands) {
    const command = cmd.command;
    const params = cmd.params;
    
    if (command.includes('user')) {
      diagram += '    User->>User: ';
    } else if (command.includes('target')) {
      diagram += '    User->>Target: ';
    } else if (command.includes('camera') || command.includes('zoom')) {
      diagram += '    User->>Camera: ';
    } else if (command.includes('animation')) {
      diagram += '    User->>Animation: ';
    } else if (command.includes('wait')) {
      diagram += '    Note over User,Target: ';
    } else {
      diagram += '    Note over User,Target: ';
    }
    
    diagram += `${command}`;
    if (params.length > 0) {
      diagram += ` (${params.join(', ')})`;
    }
    diagram += '\n';
  }
  
  return diagram;
}

module.exports = {
  analyzeBattleAnimations,
  extractAnimations,
  parseAnimationCommands,
  analyzeCommands,
  analyzeParameters,
  analyzeSequences,
  analyzeRelationships,
  visualizeAnimation,
  generateSequenceDiagram
};
