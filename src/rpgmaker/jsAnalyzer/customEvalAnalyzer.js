/**
 * RPG Maker MV Custom Evaluation Analyzer
 * 
 * This module analyzes custom evaluation scripts in RPG Maker MV data files.
 * It extracts evaluations, dependencies, and conditions.
 */

const fs = require('fs-extra');
const path = require('path');
const { parseJson } = require('../../core');

/**
 * Analyze custom evaluations in an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {Object} options - Options for analysis
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeCustomEvals(projectPath, options = {}) {
  const {
    includeFiles = ['Skills.json', 'Items.json', 'Weapons.json', 'Armors.json'],
    excludeFiles = [],
    includeTypes = ['custom_show_eval', 'custom_replace_attack', 'custom_eval']
  } = options;

  // Validate project path
  const dataPath = path.join(projectPath, 'data');
  if (!await fs.pathExists(dataPath)) {
    throw new Error(`Invalid RPG Maker MV project path: ${projectPath}`);
  }

  // Initialize results
  const results = {
    evaluations: [],
    dependencies: {
      variables: {},
      switches: {},
      parameters: {},
      functions: {},
      objects: {}
    },
    conditions: [],
    patterns: {},
    statistics: {
      totalEvals: 0,
      byType: {},
      complexityScores: []
    }
  };

  // Process each file
  for (const file of includeFiles) {
    if (excludeFiles.includes(file)) continue;

    const filePath = path.join(dataPath, file);
    if (!await fs.pathExists(filePath)) continue;

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = parseJson(content);
      
      // Extract evaluations
      extractCustomEvals(data, file, includeTypes, results);
    } catch (error) {
      console.error(`Error processing file ${file}: ${error.message}`);
    }
  }

  // Analyze evaluations
  analyzeEvaluations(results);
  
  // Extract dependencies
  extractDependencies(results);
  
  // Extract conditions
  extractConditions(results);
  
  // Calculate statistics
  calculateStatistics(results);

  return results;
}

/**
 * Extract custom evaluations from data
 * @param {Object} data - Parsed JSON data
 * @param {string} sourceFile - Source file name
 * @param {string[]} includeTypes - Evaluation types to include
 * @param {Object} results - Results object to update
 */
function extractCustomEvals(data, sourceFile, includeTypes, results) {
  if (!Array.isArray(data)) return;

  for (const item of data) {
    if (!item || !item.note) continue;

    // Extract custom show eval patterns
    if (includeTypes.includes('custom_show_eval')) {
      const customShowEvalRegex = /<Custom Show Eval>([\s\S]*?)<\/Custom Show Eval>/g;
      let match;
      while ((match = customShowEvalRegex.exec(item.note)) !== null) {
        const content = match[1].trim();
        
        results.evaluations.push({
          type: 'custom_show_eval',
          content,
          ast: null, // Will be populated during analysis
          source: {
            file: sourceFile,
            id: item.id,
            name: item.name,
            itemType: getItemType(item)
          }
        });
        
        results.statistics.totalEvals++;
        results.statistics.byType['custom_show_eval'] = 
          (results.statistics.byType['custom_show_eval'] || 0) + 1;
      }
    }

    // Extract custom replace attack patterns
    if (includeTypes.includes('custom_replace_attack')) {
      const customReplaceAttackRegex = /<Custom Replace Attack>([\s\S]*?)<\/Custom Replace Attack>/g;
      let match;
      while ((match = customReplaceAttackRegex.exec(item.note)) !== null) {
        const content = match[1].trim();
        
        results.evaluations.push({
          type: 'custom_replace_attack',
          content,
          ast: null, // Will be populated during analysis
          source: {
            file: sourceFile,
            id: item.id,
            name: item.name,
            itemType: getItemType(item)
          }
        });
        
        results.statistics.totalEvals++;
        results.statistics.byType['custom_replace_attack'] = 
          (results.statistics.byType['custom_replace_attack'] || 0) + 1;
      }
    }

    // Extract custom eval patterns
    if (includeTypes.includes('custom_eval')) {
      const customEvalRegex = /<Custom Eval>([\s\S]*?)<\/Custom Eval>/g;
      let match;
      while ((match = customEvalRegex.exec(item.note)) !== null) {
        const content = match[1].trim();
        
        results.evaluations.push({
          type: 'custom_eval',
          content,
          ast: null, // Will be populated during analysis
          source: {
            file: sourceFile,
            id: item.id,
            name: item.name,
            itemType: getItemType(item)
          }
        });
        
        results.statistics.totalEvals++;
        results.statistics.byType['custom_eval'] = 
          (results.statistics.byType['custom_eval'] || 0) + 1;
      }
    }
  }
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
 * Analyze evaluations
 * @param {Object} results - Results object to update
 */
function analyzeEvaluations(results) {
  const evaluations = results.evaluations;
  
  // Group evaluations by type
  const evalsByType = {};
  for (const evaluation of evaluations) {
    const type = evaluation.type;
    
    if (!evalsByType[type]) {
      evalsByType[type] = [];
    }
    
    evalsByType[type].push(evaluation);
  }
  
  // Analyze each type
  for (const [type, typeEvals] of Object.entries(evalsByType)) {
    results.patterns[type] = findCommonPatterns(typeEvals);
  }
  
  // Parse ASTs for each evaluation
  for (const evaluation of evaluations) {
    try {
      evaluation.ast = parseJavaScript(evaluation.content);
    } catch (error) {
      console.error(`Error parsing JavaScript: ${error.message}`);
    }
  }
}

/**
 * Parse JavaScript code
 * @param {string} code - JavaScript code
 * @returns {Object|null} - AST or null if parsing fails
 */
function parseJavaScript(code) {
  try {
    // Simple AST representation
    return {
      variables: extractVariables(code),
      functions: extractFunctions(code),
      conditionals: extractConditionals(code),
      assignments: extractAssignments(code),
      returns: extractReturns(code)
    };
  } catch (error) {
    console.error(`Error parsing JavaScript: ${error.message}`);
    return null;
  }
}

/**
 * Extract variables from code
 * @param {string} code - JavaScript code
 * @returns {Object[]} - Extracted variables
 */
function extractVariables(code) {
  const variables = [];
  const varRegex = /\b(var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:=\s*([^;]+))?/g;
  
  let match;
  while ((match = varRegex.exec(code)) !== null) {
    variables.push({
      type: match[1], // var, let, or const
      name: match[2],
      initialValue: match[3] ? match[3].trim() : null
    });
  }
  
  return variables;
}

/**
 * Extract functions from code
 * @param {string} code - JavaScript code
 * @returns {Object[]} - Extracted functions
 */
function extractFunctions(code) {
  const functions = [];
  
  // Regular function declarations
  const funcRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)/g;
  
  let match;
  while ((match = funcRegex.exec(code)) !== null) {
    functions.push({
      type: 'function',
      name: match[1],
      parameters: match[2].split(',').map(p => p.trim()).filter(p => p)
    });
  }
  
  // Arrow functions
  const arrowRegex = /(?:const|let|var)?\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:\(([^)]*)\)|([a-zA-Z_$][a-zA-Z0-9_$]*))\s*=>/g;
  
  while ((match = arrowRegex.exec(code)) !== null) {
    functions.push({
      type: 'arrow',
      name: match[1],
      parameters: match[2] ? match[2].split(',').map(p => p.trim()).filter(p => p) : 
                  (match[3] ? [match[3]] : [])
    });
  }
  
  return functions;
}

/**
 * Extract conditionals from code
 * @param {string} code - JavaScript code
 * @returns {Object[]} - Extracted conditionals
 */
function extractConditionals(code) {
  const conditionals = [];
  
  // If statements
  const ifRegex = /if\s*\(([^)]+)\)/g;
  
  let match;
  while ((match = ifRegex.exec(code)) !== null) {
    conditionals.push({
      type: 'if',
      condition: match[1].trim()
    });
  }
  
  // Ternary operators
  const ternaryRegex = /([^?]+)\?([^:]+):([^;]+)/g;
  
  while ((match = ternaryRegex.exec(code)) !== null) {
    conditionals.push({
      type: 'ternary',
      condition: match[1].trim(),
      trueBranch: match[2].trim(),
      falseBranch: match[3].trim()
    });
  }
  
  return conditionals;
}

/**
 * Extract assignments from code
 * @param {string} code - JavaScript code
 * @returns {Object[]} - Extracted assignments
 */
function extractAssignments(code) {
  const assignments = [];
  const assignRegex = /([a-zA-Z_$][a-zA-Z0-9_$.[\]]+)\s*=\s*([^;]+)/g;
  
  let match;
  while ((match = assignRegex.exec(code)) !== null) {
    // Skip variable declarations
    if (!/\b(var|let|const)\s+/.test(match[0])) {
      assignments.push({
        target: match[1].trim(),
        value: match[2].trim()
      });
    }
  }
  
  return assignments;
}

/**
 * Extract return statements from code
 * @param {string} code - JavaScript code
 * @returns {Object[]} - Extracted returns
 */
function extractReturns(code) {
  const returns = [];
  const returnRegex = /return\s+([^;]+)/g;
  
  let match;
  while ((match = returnRegex.exec(code)) !== null) {
    returns.push({
      value: match[1].trim()
    });
  }
  
  return returns;
}

/**
 * Find common patterns in evaluations
 * @param {Object[]} evaluations - Evaluations
 * @returns {Object} - Common patterns
 */
function findCommonPatterns(evaluations) {
  const patterns = {
    variables: {},
    functions: {},
    conditionals: {},
    assignments: {},
    returns: {}
  };
  
  // Count variable patterns
  for (const evaluation of evaluations) {
    if (!evaluation.ast) continue;
    
    // Count variable declarations
    for (const variable of evaluation.ast.variables) {
      const key = `${variable.type} ${variable.name}`;
      patterns.variables[key] = (patterns.variables[key] || 0) + 1;
    }
    
    // Count function declarations
    for (const func of evaluation.ast.functions) {
      const key = `${func.type} ${func.name}(${func.parameters.join(', ')})`;
      patterns.functions[key] = (patterns.functions[key] || 0) + 1;
    }
    
    // Count conditional patterns
    for (const conditional of evaluation.ast.conditionals) {
      const key = conditional.type === 'if' ? 
        `if(${conditional.condition})` : 
        `${conditional.condition} ? ... : ...`;
      patterns.conditionals[key] = (patterns.conditionals[key] || 0) + 1;
    }
    
    // Count assignment patterns
    for (const assignment of evaluation.ast.assignments) {
      const key = `${assignment.target} = ...`;
      patterns.assignments[key] = (patterns.assignments[key] || 0) + 1;
    }
    
    // Count return patterns
    for (const ret of evaluation.ast.returns) {
      const key = `return ${ret.value}`;
      patterns.returns[key] = (patterns.returns[key] || 0) + 1;
    }
  }
  
  // Sort patterns by frequency
  return {
    variables: sortPatternsByFrequency(patterns.variables),
    functions: sortPatternsByFrequency(patterns.functions),
    conditionals: sortPatternsByFrequency(patterns.conditionals),
    assignments: sortPatternsByFrequency(patterns.assignments),
    returns: sortPatternsByFrequency(patterns.returns)
  };
}

/**
 * Sort patterns by frequency
 * @param {Object} patterns - Patterns object
 * @returns {Object} - Sorted patterns
 */
function sortPatternsByFrequency(patterns) {
  return Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [pattern, count]) => {
      obj[pattern] = count;
      return obj;
    }, {});
}

/**
 * Extract dependencies from evaluations
 * @param {Object} results - Results object to update
 */
function extractDependencies(results) {
  const evaluations = results.evaluations;
  
  for (const evaluation of evaluations) {
    if (!evaluation.ast) continue;
    
    // Extract variable dependencies
    for (const variable of evaluation.ast.variables) {
      if (!results.dependencies.variables[variable.name]) {
        results.dependencies.variables[variable.name] = {
          count: 0,
          sources: []
        };
      }
      
      results.dependencies.variables[variable.name].count++;
      results.dependencies.variables[variable.name].sources.push(evaluation.source);
    }
    
    // Extract function dependencies
    for (const func of evaluation.ast.functions) {
      if (!results.dependencies.functions[func.name]) {
        results.dependencies.functions[func.name] = {
          count: 0,
          sources: []
        };
      }
      
      results.dependencies.functions[func.name].count++;
      results.dependencies.functions[func.name].sources.push(evaluation.source);
    }
    
    // Extract parameter dependencies
    for (const func of evaluation.ast.functions) {
      for (const param of func.parameters) {
        if (!results.dependencies.parameters[param]) {
          results.dependencies.parameters[param] = {
            count: 0,
            sources: []
          };
        }
        
        results.dependencies.parameters[param].count++;
        results.dependencies.parameters[param].sources.push(evaluation.source);
      }
    }
    
    // Extract object dependencies
    const objectRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\.[a-zA-Z_$][a-zA-Z0-9_$]*/g;
    let match;
    while ((match = objectRegex.exec(evaluation.content)) !== null) {
      const object = match[1];
      
      if (!results.dependencies.objects[object]) {
        results.dependencies.objects[object] = {
          count: 0,
          sources: []
        };
      }
      
      results.dependencies.objects[object].count++;
      results.dependencies.objects[object].sources.push(evaluation.source);
    }
  }
  
  // Sort dependencies by count
  results.dependencies.variables = sortDependenciesByCount(results.dependencies.variables);
  results.dependencies.functions = sortDependenciesByCount(results.dependencies.functions);
  results.dependencies.parameters = sortDependenciesByCount(results.dependencies.parameters);
  results.dependencies.objects = sortDependenciesByCount(results.dependencies.objects);
}

/**
 * Sort dependencies by count
 * @param {Object} dependencies - Dependencies object
 * @returns {Object} - Sorted dependencies
 */
function sortDependenciesByCount(dependencies) {
  const entries = Object.entries(dependencies);
  entries.sort((a, b) => b[1].count - a[1].count);
  
  const sorted = {};
  for (const [key, value] of entries) {
    sorted[key] = value;
  }
  
  return sorted;
}

/**
 * Extract conditions from evaluations
 * @param {Object} results - Results object to update
 */
function extractConditions(results) {
  const evaluations = results.evaluations;
  
  for (const evaluation of evaluations) {
    if (!evaluation.ast) continue;
    
    // Extract conditions from conditionals
    for (const conditional of evaluation.ast.conditionals) {
      results.conditions.push({
        type: conditional.type,
        condition: conditional.condition,
        source: evaluation.source,
        evaluationType: evaluation.type
      });
    }
  }
}

/**
 * Calculate statistics for evaluations
 * @param {Object} results - Results object to update
 */
function calculateStatistics(results) {
  const evaluations = results.evaluations;
  
  for (const evaluation of evaluations) {
    if (!evaluation.ast) continue;
    
    // Calculate complexity score
    const complexityScore = calculateComplexityScore(evaluation);
    
    results.statistics.complexityScores.push({
      score: complexityScore,
      source: evaluation.source,
      type: evaluation.type
    });
  }
  
  // Sort complexity scores
  results.statistics.complexityScores.sort((a, b) => b.score - a.score);
}

/**
 * Calculate complexity score for an evaluation
 * @param {Object} evaluation - Evaluation object
 * @returns {number} - Complexity score
 */
function calculateComplexityScore(evaluation) {
  if (!evaluation.ast) return 0;
  
  let score = 0;
  
  // Add points for variables
  score += evaluation.ast.variables.length * 1;
  
  // Add points for functions
  score += evaluation.ast.functions.length * 2;
  
  // Add points for conditionals
  score += evaluation.ast.conditionals.length * 3;
  
  // Add points for assignments
  score += evaluation.ast.assignments.length * 1;
  
  // Add points for returns
  score += evaluation.ast.returns.length * 1;
  
  // Add points for lines of code
  score += evaluation.content.split('\n').length * 0.5;
  
  return score;
}

/**
 * Generate a visual representation of an evaluation
 * @param {Object} evaluation - Evaluation object
 * @returns {string} - Visual representation
 */
function visualizeEvaluation(evaluation) {
  let visualization = `Evaluation Type: ${evaluation.type}\n`;
  visualization += `Source: ${evaluation.source.file} - ${evaluation.source.name} (ID: ${evaluation.source.id})\n\n`;
  
  visualization += "Code:\n```javascript\n";
  visualization += evaluation.content;
  visualization += "\n```\n\n";
  
  if (evaluation.ast) {
    visualization += "Variables:\n";
    for (const variable of evaluation.ast.variables) {
      visualization += `- ${variable.type} ${variable.name}`;
      if (variable.initialValue) {
        visualization += ` = ${variable.initialValue}`;
      }
      visualization += '\n';
    }
    
    visualization += "\nFunctions:\n";
    for (const func of evaluation.ast.functions) {
      visualization += `- ${func.type === 'function' ? 'function' : 'arrow'} ${func.name}(${func.parameters.join(', ')})\n`;
    }
    
    visualization += "\nConditionals:\n";
    for (const conditional of evaluation.ast.conditionals) {
      if (conditional.type === 'if') {
        visualization += `- if(${conditional.condition})\n`;
      } else {
        visualization += `- ${conditional.condition} ? ${conditional.trueBranch} : ${conditional.falseBranch}\n`;
      }
    }
    
    visualization += "\nAssignments:\n";
    for (const assignment of evaluation.ast.assignments) {
      visualization += `- ${assignment.target} = ${assignment.value}\n`;
    }
    
    visualization += "\nReturns:\n";
    for (const ret of evaluation.ast.returns) {
      visualization += `- return ${ret.value}\n`;
    }
  }
  
  return visualization;
}

/**
 * Generate a dependency graph for evaluations
 * @param {Object} results - Analysis results
 * @returns {string} - Mermaid graph
 */
function generateDependencyGraph(results) {
  let graph = 'graph TD\n';
  const nodes = new Set();
  const edges = new Set();
  
  // Add object dependencies
  for (const [object, info] of Object.entries(results.dependencies.objects)) {
    if (info.count < 2) continue; // Only include frequently used objects
    
    const objectId = `obj_${object}`;
    nodes.add(`  ${objectId}["${object}"]`);
    
    // Add edges to sources
    for (const source of info.sources) {
      const sourceId = `src_${source.file}_${source.id}`;
      nodes.add(`  ${sourceId}["${source.name} (${source.file})"]`);
      edges.add(`  ${objectId} --> ${sourceId}`);
    }
  }
  
  // Add function dependencies
  for (const [func, info] of Object.entries(results.dependencies.functions)) {
    if (info.count < 2) continue; // Only include frequently used functions
    
    const funcId = `func_${func}`;
    nodes.add(`  ${funcId}["${func}()"]`);
    
    // Add edges to sources
    for (const source of info.sources) {
      const sourceId = `src_${source.file}_${source.id}`;
      nodes.add(`  ${sourceId}["${source.name} (${source.file})"]`);
      edges.add(`  ${funcId} --> ${sourceId}`);
    }
  }
  
  // Add nodes and edges to graph
  graph += Array.from(nodes).join('\n') + '\n';
  graph += Array.from(edges).join('\n') + '\n';
  
  return graph;
}

module.exports = {
  analyzeCustomEvals,
  extractCustomEvals,
  parseJavaScript,
  extractVariables,
  extractFunctions,
  extractConditionals,
  extractAssignments,
  extractReturns,
  visualizeEvaluation,
  generateDependencyGraph
};
