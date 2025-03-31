/**
 * RPG Maker MV Game Tag Analyzer
 * 
 * This module analyzes game tags in RPG Maker MV data files.
 * It extracts tags, values, and relationships.
 */

const fs = require('fs-extra');
const path = require('path');
const { parseJson } = require('../../core');

/**
 * Analyze game tags in an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {Object} options - Options for analysis
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeGameTags(projectPath, options = {}) {
  const {
    includeFiles = ['Skills.json', 'Items.json', 'States.json', 'Weapons.json', 'Armors.json', 'Actors.json', 'Classes.json'],
    excludeFiles = [],
    includeTagTypes = []
  } = options;

  // Validate project path
  const dataPath = path.join(projectPath, 'data');
  if (!await fs.pathExists(dataPath)) {
    throw new Error(`Invalid RPG Maker MV project path: ${projectPath}`);
  }

  // Initialize results
  const results = {
    tags: [],
    tagsByType: {},
    valueDistribution: {},
    relationships: {
      byItemType: {},
      byTagType: {}
    },
    statistics: {
      totalTags: 0,
      byItemType: {},
      byTagType: {}
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
      
      // Extract tags
      extractGameTags(data, file, includeTagTypes, results);
    } catch (error) {
      console.error(`Error processing file ${file}: ${error.message}`);
    }
  }

  // Analyze tags
  analyzeTagValues(results);
  
  // Analyze relationships
  analyzeRelationships(results);
  
  // Calculate statistics
  calculateStatistics(results);

  return results;
}

/**
 * Extract game tags from data
 * @param {Object} data - Parsed JSON data
 * @param {string} sourceFile - Source file name
 * @param {string[]} includeTagTypes - Tag types to include
 * @param {Object} results - Results object to update
 */
function extractGameTags(data, sourceFile, includeTagTypes, results) {
  if (!Array.isArray(data)) return;

  for (const item of data) {
    if (!item || !item.note) continue;

    // Extract all tags
    const tagRegex = /<([^>:]+)(?::?\s*([^>]*))?>/g;
    let match;
    
    while ((match = tagRegex.exec(item.note)) !== null) {
      const tagType = match[1].trim();
      const tagValue = match[2] ? match[2].trim() : null;
      
      // Skip if not in includeTagTypes (if specified)
      if (includeTagTypes.length > 0 && !includeTagTypes.includes(tagType)) {
        continue;
      }
      
      // Add to tags
      const tag = {
        type: tagType,
        value: tagValue,
        source: {
          file: sourceFile,
          id: item.id,
          name: item.name,
          itemType: getItemType(item, sourceFile)
        },
        hasJavaScript: hasJavaScript(tagValue)
      };
      
      results.tags.push(tag);
      
      // Add to tagsByType
      if (!results.tagsByType[tagType]) {
        results.tagsByType[tagType] = [];
      }
      
      results.tagsByType[tagType].push(tag);
      
      // Update statistics
      results.statistics.totalTags++;
      
      const itemType = tag.source.itemType;
      results.statistics.byItemType[itemType] = (results.statistics.byItemType[itemType] || 0) + 1;
      
      results.statistics.byTagType[tagType] = (results.statistics.byTagType[tagType] || 0) + 1;
    }
  }
}

/**
 * Get the type of an item based on its properties and source file
 * @param {Object} item - Item object
 * @param {string} sourceFile - Source file name
 * @returns {string} - Item type
 */
function getItemType(item, sourceFile) {
  if (sourceFile === 'Skills.json') return 'skill';
  if (sourceFile === 'Items.json') return 'item';
  if (sourceFile === 'States.json') return 'state';
  if (sourceFile === 'Weapons.json') return 'weapon';
  if (sourceFile === 'Armors.json') return 'armor';
  if (sourceFile === 'Actors.json') return 'actor';
  if (sourceFile === 'Classes.json') return 'class';
  
  // Fallback to property-based detection
  if (item.hasOwnProperty('stypeId')) return 'skill';
  if (item.hasOwnProperty('itypeId')) return 'item';
  if (item.hasOwnProperty('maxTurns')) return 'state';
  if (item.hasOwnProperty('wtypeId')) return 'weapon';
  if (item.hasOwnProperty('atypeId')) return 'armor';
  if (item.hasOwnProperty('classId')) return 'actor';
  if (item.hasOwnProperty('learnings')) return 'class';
  
  return 'unknown';
}

/**
 * Check if a tag value contains JavaScript
 * @param {string} value - Tag value
 * @returns {boolean} - Whether the value contains JavaScript
 */
function hasJavaScript(value) {
  if (!value) return false;
  
  // Check for JavaScript operators and keywords
  const jsPatterns = [
    /\+\s*\d/, // Addition
    /\-\s*\d/, // Subtraction
    /\*\s*\d/, // Multiplication
    /\/\s*\d/, // Division
    /\%\s*\d/, // Modulo
    /Math\./, // Math functions
    /\bif\b/, // if keyword
    /\belse\b/, // else keyword
    /\bfor\b/, // for keyword
    /\bwhile\b/, // while keyword
    /\bfunction\b/, // function keyword
    /\breturn\b/, // return keyword
    /\bvar\b/, // var keyword
    /\blet\b/, // let keyword
    /\bconst\b/, // const keyword
    /\bnew\b/, // new keyword
    /\btrue\b/, // true keyword
    /\bfalse\b/, // false keyword
    /\bnull\b/, // null keyword
    /\bundefined\b/, // undefined keyword
    /\bthis\b/, // this keyword
    /\[\]/, // array literal
    /\{\}/, // object literal
    /\(\)/, // function call
    /\=\>/, // arrow function
    /\$[a-zA-Z]/ // RPG Maker global variables
  ];
  
  return jsPatterns.some(pattern => pattern.test(value));
}

/**
 * Analyze tag values
 * @param {Object} results - Results object to update
 */
function analyzeTagValues(results) {
  const tagsByType = results.tagsByType;
  
  for (const [tagType, tags] of Object.entries(tagsByType)) {
    // Initialize value distribution for this tag type
    results.valueDistribution[tagType] = {
      values: {},
      hasJavaScript: 0,
      noValue: 0
    };
    
    // Analyze values
    for (const tag of tags) {
      if (tag.value === null) {
        results.valueDistribution[tagType].noValue++;
        continue;
      }
      
      if (tag.hasJavaScript) {
        results.valueDistribution[tagType].hasJavaScript++;
      }
      
      // Count value occurrences
      if (!results.valueDistribution[tagType].values[tag.value]) {
        results.valueDistribution[tagType].values[tag.value] = 0;
      }
      
      results.valueDistribution[tagType].values[tag.value]++;
    }
    
    // Sort values by frequency
    results.valueDistribution[tagType].values = sortObjectByValues(results.valueDistribution[tagType].values);
  }
}

/**
 * Sort an object by its values
 * @param {Object} obj - Object to sort
 * @returns {Object} - Sorted object
 */
function sortObjectByValues(obj) {
  const entries = Object.entries(obj);
  entries.sort((a, b) => b[1] - a[1]);
  
  const sorted = {};
  for (const [key, value] of entries) {
    sorted[key] = value;
  }
  
  return sorted;
}

/**
 * Analyze relationships between tags
 * @param {Object} results - Results object to update
 */
function analyzeRelationships(results) {
  const tags = results.tags;
  
  // Group tags by item type
  for (const tag of tags) {
    const itemType = tag.source.itemType;
    
    if (!results.relationships.byItemType[itemType]) {
      results.relationships.byItemType[itemType] = {};
    }
    
    if (!results.relationships.byItemType[itemType][tag.type]) {
      results.relationships.byItemType[itemType][tag.type] = 0;
    }
    
    results.relationships.byItemType[itemType][tag.type]++;
  }
  
  // Group tags by tag type
  for (const tag of tags) {
    const tagType = tag.type;
    
    if (!results.relationships.byTagType[tagType]) {
      results.relationships.byTagType[tagType] = {};
    }
    
    const itemType = tag.source.itemType;
    
    if (!results.relationships.byTagType[tagType][itemType]) {
      results.relationships.byTagType[tagType][itemType] = 0;
    }
    
    results.relationships.byTagType[tagType][itemType]++;
  }
  
  // Sort relationships
  for (const itemType in results.relationships.byItemType) {
    results.relationships.byItemType[itemType] = sortObjectByValues(results.relationships.byItemType[itemType]);
  }
  
  for (const tagType in results.relationships.byTagType) {
    results.relationships.byTagType[tagType] = sortObjectByValues(results.relationships.byTagType[tagType]);
  }
}

/**
 * Calculate statistics for tags
 * @param {Object} results - Results object to update
 */
function calculateStatistics(results) {
  // Sort statistics
  results.statistics.byItemType = sortObjectByValues(results.statistics.byItemType);
  results.statistics.byTagType = sortObjectByValues(results.statistics.byTagType);
  
  // Calculate JavaScript usage
  results.statistics.javascriptUsage = {
    total: 0,
    byTagType: {}
  };
  
  for (const [tagType, distribution] of Object.entries(results.valueDistribution)) {
    results.statistics.javascriptUsage.total += distribution.hasJavaScript;
    results.statistics.javascriptUsage.byTagType[tagType] = distribution.hasJavaScript;
  }
  
  // Sort JavaScript usage by tag type
  results.statistics.javascriptUsage.byTagType = sortObjectByValues(results.statistics.javascriptUsage.byTagType);
}

/**
 * Analyze JavaScript in tag values
 * @param {Object} results - Results object to update
 * @returns {Object} - JavaScript analysis
 */
function analyzeJavaScript(results) {
  const jsAnalysis = {
    expressions: {},
    functions: {},
    variables: {}
  };
  
  // Analyze tags with JavaScript
  for (const tag of results.tags) {
    if (!tag.hasJavaScript || !tag.value) continue;
    
    // Analyze expressions
    analyzeExpressions(tag.value, jsAnalysis);
    
    // Analyze functions
    analyzeFunctions(tag.value, jsAnalysis);
    
    // Analyze variables
    analyzeVariables(tag.value, jsAnalysis);
  }
  
  // Sort analysis results
  jsAnalysis.expressions = sortObjectByValues(jsAnalysis.expressions);
  jsAnalysis.functions = sortObjectByValues(jsAnalysis.functions);
  jsAnalysis.variables = sortObjectByValues(jsAnalysis.variables);
  
  return jsAnalysis;
}

/**
 * Analyze expressions in JavaScript
 * @param {string} code - JavaScript code
 * @param {Object} analysis - Analysis object to update
 */
function analyzeExpressions(code, analysis) {
  // Math expressions
  const mathRegex = /(Math\.[a-zA-Z]+\([^)]*\))/g;
  let match;
  
  while ((match = mathRegex.exec(code)) !== null) {
    const expr = match[1];
    
    if (!analysis.expressions[expr]) {
      analysis.expressions[expr] = 0;
    }
    
    analysis.expressions[expr]++;
  }
  
  // Arithmetic expressions
  const arithmeticRegex = /(\d+\s*[\+\-\*\/\%]\s*\d+)/g;
  
  while ((match = arithmeticRegex.exec(code)) !== null) {
    const expr = match[1];
    
    if (!analysis.expressions[expr]) {
      analysis.expressions[expr] = 0;
    }
    
    analysis.expressions[expr]++;
  }
}

/**
 * Analyze functions in JavaScript
 * @param {string} code - JavaScript code
 * @param {Object} analysis - Analysis object to update
 */
function analyzeFunctions(code, analysis) {
  // Function calls
  const funcRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
  let match;
  
  while ((match = funcRegex.exec(code)) !== null) {
    const func = match[1];
    
    // Skip Math object methods (already covered in expressions)
    if (func === 'Math') continue;
    
    if (!analysis.functions[func]) {
      analysis.functions[func] = 0;
    }
    
    analysis.functions[func]++;
  }
}

/**
 * Analyze variables in JavaScript
 * @param {string} code - JavaScript code
 * @param {Object} analysis - Analysis object to update
 */
function analyzeVariables(code, analysis) {
  // Variables
  const varRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
  let match;
  
  while ((match = varRegex.exec(code)) !== null) {
    const variable = match[1];
    
    // Skip JavaScript keywords and function names
    if (isJavaScriptKeyword(variable) || 
        variable === 'Math' || 
        analysis.functions[variable]) {
      continue;
    }
    
    if (!analysis.variables[variable]) {
      analysis.variables[variable] = 0;
    }
    
    analysis.variables[variable]++;
  }
}

/**
 * Check if a string is a JavaScript keyword
 * @param {string} str - String to check
 * @returns {boolean} - Whether the string is a JavaScript keyword
 */
function isJavaScriptKeyword(str) {
  const keywords = [
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete',
    'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in',
    'instanceof', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
    'var', 'void', 'while', 'with', 'yield', 'true', 'false', 'null', 'undefined'
  ];
  
  return keywords.includes(str);
}

/**
 * Generate a visual representation of tag statistics
 * @param {Object} results - Analysis results
 * @returns {string} - Visual representation
 */
function visualizeTagStatistics(results) {
  let visualization = `Game Tag Statistics\n`;
  visualization += `=================\n\n`;
  
  visualization += `Total Tags: ${results.statistics.totalTags}\n\n`;
  
  visualization += `Tags by Item Type:\n`;
  for (const [itemType, count] of Object.entries(results.statistics.byItemType)) {
    visualization += `- ${itemType}: ${count}\n`;
  }
  
  visualization += `\nTags by Tag Type:\n`;
  for (const [tagType, count] of Object.entries(results.statistics.byTagType)) {
    visualization += `- ${tagType}: ${count}\n`;
  }
  
  visualization += `\nJavaScript Usage:\n`;
  visualization += `- Total: ${results.statistics.javascriptUsage.total}\n`;
  
  visualization += `\nJavaScript by Tag Type:\n`;
  for (const [tagType, count] of Object.entries(results.statistics.javascriptUsage.byTagType)) {
    if (count > 0) {
      visualization += `- ${tagType}: ${count}\n`;
    }
  }
  
  return visualization;
}

/**
 * Generate a tag distribution chart
 * @param {Object} results - Analysis results
 * @returns {string} - Mermaid chart
 */
function generateTagDistributionChart(results) {
  let chart = 'pie\n';
  chart += '    title Tag Distribution by Type\n';
  
  for (const [tagType, count] of Object.entries(results.statistics.byTagType)) {
    if (count > 0) {
      chart += `    "${tagType}" : ${count}\n`;
    }
  }
  
  return chart;
}

/**
 * Generate a JavaScript usage chart
 * @param {Object} results - Analysis results
 * @returns {string} - Mermaid chart
 */
function generateJavaScriptUsageChart(results) {
  let chart = 'pie\n';
  chart += '    title JavaScript Usage in Tags\n';
  
  const jsCount = results.statistics.javascriptUsage.total;
  const nonJsCount = results.statistics.totalTags - jsCount;
  
  chart += `    "JavaScript" : ${jsCount}\n`;
  chart += `    "No JavaScript" : ${nonJsCount}\n`;
  
  return chart;
}

module.exports = {
  analyzeGameTags,
  extractGameTags,
  analyzeTagValues,
  analyzeRelationships,
  analyzeJavaScript,
  visualizeTagStatistics,
  generateTagDistributionChart,
  generateJavaScriptUsageChart
};
