/**
 * RPG Maker MV JavaScript Relationship Mapper
 * 
 * This module maps relationships between JavaScript and game elements in RPG Maker MV data files.
 * It identifies which scripts affect which game mechanics and builds dependency graphs.
 */

const fs = require('fs-extra');
const path = require('path');
const { parseJson } = require('../../core');

/**
 * Map relationships between JavaScript and game elements
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {Object} analysisResults - Previous analysis results
 * @returns {Promise<Object>} - Relationship mapping
 */
async function mapJavaScriptRelationships(projectPath, analysisResults = null) {
  // If no analysis results provided, load system data
  if (!analysisResults) {
    analysisResults = {
      projectName: path.basename(projectPath)
    };
    
    // Load system data
    const systemPath = path.join(projectPath, 'data', 'System.json');
    if (await fs.pathExists(systemPath)) {
      const systemData = parseJson(await fs.readFile(systemPath, 'utf8'));
      if (systemData && systemData.gameTitle) {
        analysisResults.projectName = systemData.gameTitle;
      }
    }
  }

  // Initialize results
  const results = {
    dependencies: {
      scriptToMechanic: {},
      mechanicToScript: {},
      scriptToScript: {}
    },
    affectedMechanics: {
      byScriptType: {},
      byMechanicType: {}
    },
    graph: {
      nodes: [],
      edges: []
    }
  };

  // Map relationships
  await mapBattleAnimationRelationships(projectPath, analysisResults, results);
  await mapConditionalLogicRelationships(projectPath, analysisResults, results);
  await mapCustomEvalRelationships(projectPath, analysisResults, results);
  await mapGameTagRelationships(projectPath, analysisResults, results);
  
  // Build dependency graph
  buildDependencyGraph(results);

  return results;
}

/**
 * Map battle animation relationships
 * @param {string} projectPath - Path to the project
 * @param {Object} analysisResults - Analysis results
 * @param {Object} results - Results object to update
 */
async function mapBattleAnimationRelationships(projectPath, analysisResults, results) {
  // Skip if no battle animations in analysis results
  if (!analysisResults.battleAnimations || !analysisResults.battleAnimations.animations) {
    return;
  }
  
  const animations = analysisResults.battleAnimations.animations;
  
  // Load Skills.json to get skill information
  const skillsPath = path.join(projectPath, 'data', 'Skills.json');
  if (!await fs.pathExists(skillsPath)) {
    return;
  }
  
  try {
    const skills = parseJson(await fs.readFile(skillsPath, 'utf8'));
    
    // Map relationships for each animation
    for (const animation of animations) {
      const source = animation.source;
      if (source.file !== 'Skills.json' || !source.id) continue;
      
      const skill = skills.find(s => s && s.id === source.id);
      if (!skill) continue;
      
      // Map animation to skill mechanics
      mapAnimationToSkillMechanics(animation, skill, results);
    }
  } catch (error) {
    console.error(`Error mapping battle animation relationships: ${error.message}`);
  }
}

/**
 * Map animation to skill mechanics
 * @param {Object} animation - Animation object
 * @param {Object} skill - Skill object
 * @param {Object} results - Results object to update
 */
function mapAnimationToSkillMechanics(animation, skill, results) {
  const scriptId = `${animation.type}_${animation.source.id}`;
  const mechanicTypes = [];
  
  // Map to damage type
  if (skill.damage && skill.damage.type) {
    const damageType = getDamageTypeName(skill.damage.type);
    mechanicTypes.push(`damage_${damageType}`);
  }
  
  // Map to element
  if (skill.damage && skill.damage.elementId) {
    mechanicTypes.push(`element_${skill.damage.elementId}`);
  }
  
  // Map to scope
  if (skill.scope) {
    mechanicTypes.push(`scope_${skill.scope}`);
  }
  
  // Map to hit type
  if (skill.hitType) {
    mechanicTypes.push(`hit_type_${skill.hitType}`);
  }
  
  // Map to occasion
  if (skill.occasion) {
    mechanicTypes.push(`occasion_${skill.occasion}`);
  }
  
  // Add to dependencies
  for (const mechanicType of mechanicTypes) {
    addDependency(results, scriptId, mechanicType, 'script_to_mechanic');
  }
  
  // Add to affected mechanics
  if (!results.affectedMechanics.byScriptType[animation.type]) {
    results.affectedMechanics.byScriptType[animation.type] = {};
  }
  
  for (const mechanicType of mechanicTypes) {
    if (!results.affectedMechanics.byScriptType[animation.type][mechanicType]) {
      results.affectedMechanics.byScriptType[animation.type][mechanicType] = 0;
    }
    
    results.affectedMechanics.byScriptType[animation.type][mechanicType]++;
  }
}

/**
 * Map conditional logic relationships
 * @param {string} projectPath - Path to the project
 * @param {Object} analysisResults - Analysis results
 * @param {Object} results - Results object to update
 */
async function mapConditionalLogicRelationships(projectPath, analysisResults, results) {
  // Skip if no conditional logic in analysis results
  if (!analysisResults.conditionalLogic || !analysisResults.conditionalLogic.conditions) {
    return;
  }
  
  const conditions = analysisResults.conditionalLogic.conditions;
  
  // Map relationships for each condition
  for (const condition of conditions) {
    const scriptId = `${condition.type}_${condition.source.id}`;
    const mechanicTypes = [];
    
    // Map to condition type
    if (condition.condition && condition.condition.type) {
      mechanicTypes.push(`condition_${condition.condition.type}`);
    }
    
    // Map to source type
    if (condition.source && condition.source.type) {
      mechanicTypes.push(`source_${condition.source.type}`);
    }
    
    // Add to dependencies
    for (const mechanicType of mechanicTypes) {
      addDependency(results, scriptId, mechanicType, 'script_to_mechanic');
    }
    
    // Add to affected mechanics
    if (!results.affectedMechanics.byScriptType[condition.type]) {
      results.affectedMechanics.byScriptType[condition.type] = {};
    }
    
    for (const mechanicType of mechanicTypes) {
      if (!results.affectedMechanics.byScriptType[condition.type][mechanicType]) {
        results.affectedMechanics.byScriptType[condition.type][mechanicType] = 0;
      }
      
      results.affectedMechanics.byScriptType[condition.type][mechanicType]++;
    }
  }
  
  // Map state transitions
  if (analysisResults.conditionalLogic.stateTransitions) {
    mapStateTransitions(analysisResults.conditionalLogic.stateTransitions, results);
  }
}

/**
 * Map state transitions
 * @param {Object} stateTransitions - State transitions
 * @param {Object} results - Results object to update
 */
function mapStateTransitions(stateTransitions, results) {
  for (const [fromState, transitions] of Object.entries(stateTransitions)) {
    for (const transition of transitions) {
      const scriptId = `state_transition_${fromState}`;
      
      // Map to possible states
      if (transition.possibleStates) {
        for (const toState of transition.possibleStates) {
          const mechanicType = `state_${toState}`;
          addDependency(results, scriptId, mechanicType, 'script_to_mechanic');
        }
      }
    }
  }
}

/**
 * Map custom eval relationships
 * @param {string} projectPath - Path to the project
 * @param {Object} analysisResults - Analysis results
 * @param {Object} results - Results object to update
 */
async function mapCustomEvalRelationships(projectPath, analysisResults, results) {
  // Skip if no custom evals in analysis results
  if (!analysisResults.customEvals || !analysisResults.customEvals.evaluations) {
    return;
  }
  
  const evaluations = analysisResults.customEvals.evaluations;
  
  // Map relationships for each evaluation
  for (const evaluation of evaluations) {
    const scriptId = `${evaluation.type}_${evaluation.source.id}`;
    const mechanicTypes = [];
    
    // Map to source type
    if (evaluation.source && evaluation.source.itemType) {
      mechanicTypes.push(`item_${evaluation.source.itemType}`);
    }
    
    // Map to dependencies
    if (evaluation.ast) {
      // Map variable dependencies
      for (const variable of evaluation.ast.variables) {
        mechanicTypes.push(`variable_${variable.name}`);
      }
      
      // Map function dependencies
      for (const func of evaluation.ast.functions) {
        mechanicTypes.push(`function_${func.name}`);
      }
      
      // Map conditional dependencies
      for (const conditional of evaluation.ast.conditionals) {
        mechanicTypes.push(`conditional_${conditional.type}`);
      }
    }
    
    // Add to dependencies
    for (const mechanicType of mechanicTypes) {
      addDependency(results, scriptId, mechanicType, 'script_to_mechanic');
    }
    
    // Add to affected mechanics
    if (!results.affectedMechanics.byScriptType[evaluation.type]) {
      results.affectedMechanics.byScriptType[evaluation.type] = {};
    }
    
    for (const mechanicType of mechanicTypes) {
      if (!results.affectedMechanics.byScriptType[evaluation.type][mechanicType]) {
        results.affectedMechanics.byScriptType[evaluation.type][mechanicType] = 0;
      }
      
      results.affectedMechanics.byScriptType[evaluation.type][mechanicType]++;
    }
  }
  
  // Map object dependencies
  if (analysisResults.customEvals.dependencies && analysisResults.customEvals.dependencies.objects) {
    mapObjectDependencies(analysisResults.customEvals.dependencies.objects, results);
  }
}

/**
 * Map object dependencies
 * @param {Object} objectDependencies - Object dependencies
 * @param {Object} results - Results object to update
 */
function mapObjectDependencies(objectDependencies, results) {
  for (const [object, info] of Object.entries(objectDependencies)) {
    // Skip objects with low usage
    if (info.count < 2) continue;
    
    const mechanicType = `object_${object}`;
    
    // Add to affected mechanics
    if (!results.affectedMechanics.byMechanicType[mechanicType]) {
      results.affectedMechanics.byMechanicType[mechanicType] = {};
    }
    
    // Map to sources
    for (const source of info.sources) {
      const scriptId = `${source.file}_${source.id}`;
      
      addDependency(results, scriptId, mechanicType, 'script_to_mechanic');
      
      if (!results.affectedMechanics.byMechanicType[mechanicType][source.itemType]) {
        results.affectedMechanics.byMechanicType[mechanicType][source.itemType] = 0;
      }
      
      results.affectedMechanics.byMechanicType[mechanicType][source.itemType]++;
    }
  }
}

/**
 * Map game tag relationships
 * @param {string} projectPath - Path to the project
 * @param {Object} analysisResults - Analysis results
 * @param {Object} results - Results object to update
 */
async function mapGameTagRelationships(projectPath, analysisResults, results) {
  // Skip if no game tags in analysis results
  if (!analysisResults.gameTags || !analysisResults.gameTags.tags) {
    return;
  }
  
  const tags = analysisResults.gameTags.tags;
  
  // Map relationships for each tag
  for (const tag of tags) {
    // Skip tags without JavaScript
    if (!tag.hasJavaScript) continue;
    
    const scriptId = `tag_${tag.type}_${tag.source.id}`;
    const mechanicTypes = [];
    
    // Map to tag type
    mechanicTypes.push(`tag_${tag.type}`);
    
    // Map to source type
    if (tag.source && tag.source.itemType) {
      mechanicTypes.push(`item_${tag.source.itemType}`);
    }
    
    // Add to dependencies
    for (const mechanicType of mechanicTypes) {
      addDependency(results, scriptId, mechanicType, 'script_to_mechanic');
    }
    
    // Add to affected mechanics
    if (!results.affectedMechanics.byScriptType['tag']) {
      results.affectedMechanics.byScriptType['tag'] = {};
    }
    
    for (const mechanicType of mechanicTypes) {
      if (!results.affectedMechanics.byScriptType['tag'][mechanicType]) {
        results.affectedMechanics.byScriptType['tag'][mechanicType] = 0;
      }
      
      results.affectedMechanics.byScriptType['tag'][mechanicType]++;
    }
  }
  
  // Map tag value distribution
  if (analysisResults.gameTags.valueDistribution) {
    mapTagValueDistribution(analysisResults.gameTags.valueDistribution, results);
  }
}

/**
 * Map tag value distribution
 * @param {Object} valueDistribution - Value distribution
 * @param {Object} results - Results object to update
 */
function mapTagValueDistribution(valueDistribution, results) {
  for (const [tagType, distribution] of Object.entries(valueDistribution)) {
    // Skip tags without JavaScript
    if (!distribution.hasJavaScript) continue;
    
    const mechanicType = `tag_${tagType}`;
    
    // Add to affected mechanics
    if (!results.affectedMechanics.byMechanicType[mechanicType]) {
      results.affectedMechanics.byMechanicType[mechanicType] = {
        hasJavaScript: distribution.hasJavaScript
      };
    } else {
      results.affectedMechanics.byMechanicType[mechanicType].hasJavaScript = distribution.hasJavaScript;
    }
  }
}

/**
 * Add a dependency
 * @param {Object} results - Results object to update
 * @param {string} from - From ID
 * @param {string} to - To ID
 * @param {string} type - Dependency type
 */
function addDependency(results, from, to, type) {
  // Determine dependency map
  let dependencyMap;
  if (type === 'script_to_mechanic') {
    dependencyMap = results.dependencies.scriptToMechanic;
    
    // Also add to mechanic to script map
    if (!results.dependencies.mechanicToScript[to]) {
      results.dependencies.mechanicToScript[to] = {};
    }
    
    results.dependencies.mechanicToScript[to][from] = true;
  } else if (type === 'script_to_script') {
    dependencyMap = results.dependencies.scriptToScript;
  } else {
    return;
  }
  
  // Add dependency
  if (!dependencyMap[from]) {
    dependencyMap[from] = {};
  }
  
  dependencyMap[from][to] = true;
}

/**
 * Build dependency graph
 * @param {Object} results - Results object to update
 */
function buildDependencyGraph(results) {
  const nodes = new Set();
  const edges = [];
  
  // Add script to mechanic dependencies
  for (const [scriptId, mechanics] of Object.entries(results.dependencies.scriptToMechanic)) {
    nodes.add(scriptId);
    
    for (const mechanicId of Object.keys(mechanics)) {
      nodes.add(mechanicId);
      edges.push({ from: scriptId, to: mechanicId, type: 'script_to_mechanic' });
    }
  }
  
  // Add script to script dependencies
  for (const [scriptId1, scripts] of Object.entries(results.dependencies.scriptToScript)) {
    nodes.add(scriptId1);
    
    for (const scriptId2 of Object.keys(scripts)) {
      nodes.add(scriptId2);
      edges.push({ from: scriptId1, to: scriptId2, type: 'script_to_script' });
    }
  }
  
  // Update graph
  results.graph.nodes = Array.from(nodes);
  results.graph.edges = edges;
}

/**
 * Get damage type name
 * @param {number} type - Damage type
 * @returns {string} - Damage type name
 */
function getDamageTypeName(type) {
  switch (type) {
    case 1: return 'hp_damage';
    case 2: return 'mp_damage';
    case 3: return 'hp_recovery';
    case 4: return 'mp_recovery';
    case 5: return 'hp_drain';
    case 6: return 'mp_drain';
    default: return 'none';
  }
}

/**
 * Generate a dependency graph visualization
 * @param {Object} results - Relationship mapping results
 * @returns {string} - Mermaid graph
 */
function generateDependencyGraph(results) {
  let graph = 'graph TD\n';
  const addedNodes = new Set();
  
  // Add nodes
  for (const node of results.graph.nodes) {
    // Skip if already added
    if (addedNodes.has(node)) continue;
    
    // Add node
    if (node.startsWith('tag_')) {
      graph += `  ${node}["Tag: ${node.substring(4)}"]\n`;
    } else if (node.startsWith('item_')) {
      graph += `  ${node}["Item: ${node.substring(5)}"]\n`;
    } else if (node.startsWith('function_')) {
      graph += `  ${node}["Function: ${node.substring(9)}"]\n`;
    } else if (node.startsWith('variable_')) {
      graph += `  ${node}["Variable: ${node.substring(9)}"]\n`;
    } else if (node.startsWith('conditional_')) {
      graph += `  ${node}["Conditional: ${node.substring(12)}"]\n`;
    } else if (node.startsWith('object_')) {
      graph += `  ${node}["Object: ${node.substring(7)}"]\n`;
    } else if (node.startsWith('state_')) {
      graph += `  ${node}["State: ${node.substring(6)}"]\n`;
    } else if (node.startsWith('damage_')) {
      graph += `  ${node}["Damage: ${node.substring(7)}"]\n`;
    } else if (node.startsWith('element_')) {
      graph += `  ${node}["Element: ${node.substring(8)}"]\n`;
    } else if (node.startsWith('scope_')) {
      graph += `  ${node}["Scope: ${node.substring(6)}"]\n`;
    } else if (node.startsWith('hit_type_')) {
      graph += `  ${node}["Hit Type: ${node.substring(9)}"]\n`;
    } else if (node.startsWith('occasion_')) {
      graph += `  ${node}["Occasion: ${node.substring(9)}"]\n`;
    } else if (node.startsWith('condition_')) {
      graph += `  ${node}["Condition: ${node.substring(10)}"]\n`;
    } else if (node.startsWith('source_')) {
      graph += `  ${node}["Source: ${node.substring(7)}"]\n`;
    } else {
      graph += `  ${node}["${node}"]\n`;
    }
    
    addedNodes.add(node);
  }
  
  // Add edges
  for (const edge of results.graph.edges) {
    if (edge.type === 'script_to_mechanic') {
      graph += `  ${edge.from} --> ${edge.to}\n`;
    } else if (edge.type === 'script_to_script') {
      graph += `  ${edge.from} -.-> ${edge.to}\n`;
    }
  }
  
  return graph;
}

/**
 * Generate a relationship matrix
 * @param {Object} results - Relationship mapping results
 * @returns {Object} - Relationship matrix
 */
function generateRelationshipMatrix(results) {
  const matrix = {
    scriptTypes: [],
    mechanicTypes: [],
    data: []
  };
  
  // Get script types
  for (const scriptType in results.affectedMechanics.byScriptType) {
    matrix.scriptTypes.push(scriptType);
  }
  
  // Get mechanic types
  for (const scriptType in results.affectedMechanics.byScriptType) {
    for (const mechanicType in results.affectedMechanics.byScriptType[scriptType]) {
      if (!matrix.mechanicTypes.includes(mechanicType)) {
        matrix.mechanicTypes.push(mechanicType);
      }
    }
  }
  
  // Sort types
  matrix.scriptTypes.sort();
  matrix.mechanicTypes.sort();
  
  // Build matrix data
  for (const scriptType of matrix.scriptTypes) {
    const row = [];
    
    for (const mechanicType of matrix.mechanicTypes) {
      const count = results.affectedMechanics.byScriptType[scriptType][mechanicType] || 0;
      row.push(count);
    }
    
    matrix.data.push(row);
  }
  
  return matrix;
}

module.exports = {
  mapJavaScriptRelationships,
  generateDependencyGraph,
  generateRelationshipMatrix
};
