/**
 * RPG Maker MV JavaScript Pattern Extractor
 * 
 * This module extracts JavaScript patterns from RPG Maker MV data files.
 * It identifies common patterns in battle animations, conditional logic, custom evaluations, and game tags.
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { parseJson } = require('../../core');

/**
 * Extract JavaScript patterns from an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {Object} options - Options for extraction
 * @returns {Promise<Object>} - Extracted patterns
 */
async function extractPatterns(projectPath, options = {}) {
  const {
    includeFiles = ['*.json'],
    excludeFiles = [],
    recursive = true
  } = options;

  // Validate project path
  const dataPath = path.join(projectPath, 'data');
  if (!await fs.pathExists(dataPath)) {
    throw new Error(`Invalid RPG Maker MV project path: ${projectPath}`);
  }

  // Get all JSON files
  const pattern = recursive ? '**/*.json' : '*.json';
  const files = glob.sync(pattern, {
    cwd: dataPath,
    nodir: true,
    ignore: excludeFiles
  });

  // Initialize results
  const results = {
    battleAnimationPatterns: [],
    conditionalLogicPatterns: [],
    customEvalPatterns: [],
    gameTagPatterns: []
  };

  // Process each file
  for (const file of files) {
    const filePath = path.join(dataPath, file);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = parseJson(content);

      // Extract patterns based on file type
      if (file.startsWith('Skills')) {
        extractBattleAnimationPatterns(data, results);
        extractCustomEvalPatterns(data, results);
        extractGameTagPatterns(data, results);
      } else if (file.startsWith('States')) {
        extractConditionalLogicPatterns(data, results);
        extractGameTagPatterns(data, results);
      } else if (file.startsWith('Items')) {
        extractBattleAnimationPatterns(data, results);
        extractGameTagPatterns(data, results);
      } else if (file.startsWith('Actors') || file.startsWith('Classes') || 
                file.startsWith('Weapons') || file.startsWith('Armors')) {
        extractGameTagPatterns(data, results);
      } else if (file.startsWith('CommonEvents')) {
        extractConditionalLogicPatterns(data, results);
      } else if (file.startsWith('Map')) {
        extractConditionalLogicPatterns(data, results);
      }
    } catch (error) {
      console.error(`Error processing file ${file}: ${error.message}`);
    }
  }

  // Deduplicate patterns
  results.battleAnimationPatterns = deduplicatePatterns(results.battleAnimationPatterns);
  results.conditionalLogicPatterns = deduplicatePatterns(results.conditionalLogicPatterns);
  results.customEvalPatterns = deduplicatePatterns(results.customEvalPatterns);
  results.gameTagPatterns = deduplicatePatterns(results.gameTagPatterns);

  return results;
}

/**
 * Extract battle animation patterns from data
 * @param {Object} data - Parsed JSON data
 * @param {Object} results - Results object to update
 */
function extractBattleAnimationPatterns(data, results) {
  if (!Array.isArray(data)) return;

  for (const item of data) {
    if (!item || !item.note) continue;

    // Extract setup action patterns
    const setupActionRegex = /<setup action>([\s\S]*?)<\/setup action>/g;
    let match;
    while ((match = setupActionRegex.exec(item.note)) !== null) {
      results.battleAnimationPatterns.push({
        type: 'setup_action',
        content: match[1].trim(),
        source: {
          id: item.id,
          name: item.name,
          type: 'skill'
        }
      });
    }

    // Extract target action patterns
    const targetActionRegex = /<target action>([\s\S]*?)<\/target action>/g;
    while ((match = targetActionRegex.exec(item.note)) !== null) {
      results.battleAnimationPatterns.push({
        type: 'target_action',
        content: match[1].trim(),
        source: {
          id: item.id,
          name: item.name,
          type: 'skill'
        }
      });
    }

    // Extract whole action patterns
    const wholeActionRegex = /<whole action>([\s\S]*?)<\/whole action>/g;
    while ((match = wholeActionRegex.exec(item.note)) !== null) {
      results.battleAnimationPatterns.push({
        type: 'whole_action',
        content: match[1].trim(),
        source: {
          id: item.id,
          name: item.name,
          type: 'skill'
        }
      });
    }

    // Extract follow action patterns
    const followActionRegex = /<follow action>([\s\S]*?)<\/follow action>/g;
    while ((match = followActionRegex.exec(item.note)) !== null) {
      results.battleAnimationPatterns.push({
        type: 'follow_action',
        content: match[1].trim(),
        source: {
          id: item.id,
          name: item.name,
          type: 'skill'
        }
      });
    }

    // Extract finish action patterns
    const finishActionRegex = /<finish action>([\s\S]*?)<\/finish action>/g;
    while ((match = finishActionRegex.exec(item.note)) !== null) {
      results.battleAnimationPatterns.push({
        type: 'finish_action',
        content: match[1].trim(),
        source: {
          id: item.id,
          name: item.name,
          type: 'skill'
        }
      });
    }
  }
}

/**
 * Extract conditional logic patterns from data
 * @param {Object} data - Parsed JSON data
 * @param {Object} results - Results object to update
 */
function extractConditionalLogicPatterns(data, results) {
  if (!Array.isArray(data)) return;

  for (const item of data) {
    if (!item || !item.note) continue;

    // Extract placeholder state patterns
    const placeholderStateRegex = /<placeholder state>([\s\S]*?)<\/placeholder state>/g;
    let match;
    while ((match = placeholderStateRegex.exec(item.note)) !== null) {
      results.conditionalLogicPatterns.push({
        type: 'placeholder_state',
        content: match[1].trim(),
        source: {
          id: item.id,
          name: item.name,
          type: 'state'
        }
      });
    }

    // Extract custom state turn patterns
    const customStateTurnRegex = /<Custom State (\d+) Turn>([\s\S]*?)<\/Custom State \1 Turn>/g;
    while ((match = customStateTurnRegex.exec(item.note)) !== null) {
      results.conditionalLogicPatterns.push({
        type: 'custom_state_turn',
        stateId: match[1],
        content: match[2].trim(),
        source: {
          id: item.id,
          name: item.name,
          type: 'state'
        }
      });
    }

    // Extract conditional branch patterns from event commands
    if (item.list && Array.isArray(item.list)) {
      for (const command of item.list) {
        if (command.code === 111 && command.parameters && command.parameters.length > 0) {
          // Code 111 is conditional branch
          results.conditionalLogicPatterns.push({
            type: 'conditional_branch',
            condition: command.parameters[0],
            source: {
              id: item.id,
              name: item.name,
              type: 'event'
            }
          });
        }
      }
    }
  }
}

/**
 * Extract custom evaluation patterns from data
 * @param {Object} data - Parsed JSON data
 * @param {Object} results - Results object to update
 */
function extractCustomEvalPatterns(data, results) {
  if (!Array.isArray(data)) return;

  for (const item of data) {
    if (!item || !item.note) continue;

    // Extract custom show eval patterns
    const customShowEvalRegex = /<Custom Show Eval>([\s\S]*?)<\/Custom Show Eval>/g;
    let match;
    while ((match = customShowEvalRegex.exec(item.note)) !== null) {
      results.customEvalPatterns.push({
        type: 'custom_show_eval',
        content: match[1].trim(),
        source: {
          id: item.id,
          name: item.name,
          type: 'skill'
        }
      });
    }

    // Extract custom replace attack patterns
    const customReplaceAttackRegex = /<Custom Replace Attack>([\s\S]*?)<\/Custom Replace Attack>/g;
    while ((match = customReplaceAttackRegex.exec(item.note)) !== null) {
      results.customEvalPatterns.push({
        type: 'custom_replace_attack',
        content: match[1].trim(),
        source: {
          id: item.id,
          name: item.name,
          type: 'skill'
        }
      });
    }
  }
}

/**
 * Extract game tag patterns from data
 * @param {Object} data - Parsed JSON data
 * @param {Object} results - Results object to update
 */
function extractGameTagPatterns(data, results) {
  if (!Array.isArray(data)) return;

  for (const item of data) {
    if (!item || !item.note) continue;

    // Extract JP Gain patterns
    const jpGainRegex = /<JP Gain: ([^>]+)>/g;
    let match;
    while ((match = jpGainRegex.exec(item.note)) !== null) {
      results.gameTagPatterns.push({
        type: 'jp_gain',
        value: match[1].trim(),
        source: {
          id: item.id,
          name: item.name,
          type: getItemType(item)
        }
      });
    }

    // Extract Party Limit Gauge patterns
    const partyLimitGaugeRegex = /<Ally Party Limit Gauge: ([^>]+)>/g;
    while ((match = partyLimitGaugeRegex.exec(item.note)) !== null) {
      results.gameTagPatterns.push({
        type: 'party_limit_gauge',
        value: match[1].trim(),
        source: {
          id: item.id,
          name: item.name,
          type: getItemType(item)
        }
      });
    }

    // Extract Party Limit Cost patterns
    const partyLimitCostRegex = /<Party Limit Cost: ([^>]+)>/g;
    while ((match = partyLimitCostRegex.exec(item.note)) !== null) {
      results.gameTagPatterns.push({
        type: 'party_limit_cost',
        value: match[1].trim(),
        source: {
          id: item.id,
          name: item.name,
          type: getItemType(item)
        }
      });
    }

    // Extract Target Barrier patterns
    const targetBarrierRegex = /<Target Barrier: ([^>]+)>/g;
    while ((match = targetBarrierRegex.exec(item.note)) !== null) {
      results.gameTagPatterns.push({
        type: 'target_barrier',
        value: match[1].trim(),
        source: {
          id: item.id,
          name: item.name,
          type: getItemType(item)
        }
      });
    }

    // Extract State Animation patterns
    const stateAnimationRegex = /<State Animation: ([^>]+)>/g;
    while ((match = stateAnimationRegex.exec(item.note)) !== null) {
      results.gameTagPatterns.push({
        type: 'state_animation',
        value: match[1].trim(),
        source: {
          id: item.id,
          name: item.name,
          type: getItemType(item)
        }
      });
    }

    // Extract Reapply Add Turns patterns
    const reapplyAddTurnsRegex = /<Reapply Add Turns>/g;
    while ((match = reapplyAddTurnsRegex.exec(item.note)) !== null) {
      results.gameTagPatterns.push({
        type: 'reapply_add_turns',
        value: true,
        source: {
          id: item.id,
          name: item.name,
          type: getItemType(item)
        }
      });
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
  if (item.hasOwnProperty('classId')) return 'actor';
  if (item.hasOwnProperty('maxTurns')) return 'state';
  if (item.hasOwnProperty('list')) return 'event';
  return 'unknown';
}

/**
 * Deduplicate patterns based on content
 * @param {Object[]} patterns - Array of patterns
 * @returns {Object[]} - Deduplicated patterns
 */
function deduplicatePatterns(patterns) {
  const uniquePatterns = [];
  const contentSet = new Set();

  for (const pattern of patterns) {
    const key = `${pattern.type}:${pattern.content}`;
    if (!contentSet.has(key)) {
      contentSet.add(key);
      uniquePatterns.push(pattern);
    } else {
      // If pattern already exists, add source to existing pattern
      const existingPattern = uniquePatterns.find(p => 
        `${p.type}:${p.content}` === key
      );
      
      if (existingPattern && !existingPattern.sources) {
        existingPattern.sources = [existingPattern.source];
        delete existingPattern.source;
      }
      
      if (existingPattern && existingPattern.sources) {
        existingPattern.sources.push(pattern.source);
      }
    }
  }

  return uniquePatterns;
}

/**
 * Analyze patterns to identify common structures and relationships
 * @param {Object} patterns - Extracted patterns
 * @returns {Object} - Analysis results
 */
function analyzePatterns(patterns) {
  const results = {
    battleAnimations: {
      commonCommands: findCommonCommands(patterns.battleAnimationPatterns),
      commandFrequency: calculateCommandFrequency(patterns.battleAnimationPatterns),
      commonStructures: findCommonStructures(patterns.battleAnimationPatterns)
    },
    conditionalLogic: {
      commonConditions: findCommonConditions(patterns.conditionalLogicPatterns),
      conditionFrequency: calculateConditionFrequency(patterns.conditionalLogicPatterns),
      commonStructures: findCommonStructures(patterns.conditionalLogicPatterns)
    },
    customEvals: {
      commonVariables: findCommonVariables(patterns.customEvalPatterns),
      variableFrequency: calculateVariableFrequency(patterns.customEvalPatterns),
      commonStructures: findCommonStructures(patterns.customEvalPatterns)
    },
    gameTags: {
      tagFrequency: calculateTagFrequency(patterns.gameTagPatterns),
      valueDistribution: calculateValueDistribution(patterns.gameTagPatterns)
    }
  };

  return results;
}

/**
 * Find common commands in battle animation patterns
 * @param {Object[]} patterns - Battle animation patterns
 * @returns {Object} - Common commands
 */
function findCommonCommands(patterns) {
  const commands = {};

  for (const pattern of patterns) {
    const lines = pattern.content.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        commands[trimmedLine] = (commands[trimmedLine] || 0) + 1;
      }
    }
  }

  return Object.entries(commands)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [command, count]) => {
      obj[command] = count;
      return obj;
    }, {});
}

/**
 * Calculate command frequency in battle animation patterns
 * @param {Object[]} patterns - Battle animation patterns
 * @returns {Object} - Command frequency
 */
function calculateCommandFrequency(patterns) {
  const frequency = {};

  for (const pattern of patterns) {
    const lines = pattern.content.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        const command = trimmedLine.split(':')[0].trim();
        frequency[command] = (frequency[command] || 0) + 1;
      }
    }
  }

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [command, count]) => {
      obj[command] = count;
      return obj;
    }, {});
}

/**
 * Find common structures in patterns
 * @param {Object[]} patterns - Patterns
 * @returns {Object[]} - Common structures
 */
function findCommonStructures(patterns) {
  const structures = [];
  const patternsByType = {};

  // Group patterns by type
  for (const pattern of patterns) {
    if (!patternsByType[pattern.type]) {
      patternsByType[pattern.type] = [];
    }
    patternsByType[pattern.type].push(pattern);
  }

  // Find common structures in each type
  for (const [type, typePatterns] of Object.entries(patternsByType)) {
    if (typePatterns.length < 2) continue;

    // Find common sequences of lines
    const sequences = findCommonSequences(typePatterns.map(p => p.content.split('\n').map(l => l.trim())));
    
    for (const sequence of sequences) {
      if (sequence.length > 1) {
        structures.push({
          type,
          sequence,
          frequency: countPatternsWithSequence(typePatterns, sequence)
        });
      }
    }
  }

  return structures.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Find common conditions in conditional logic patterns
 * @param {Object[]} patterns - Conditional logic patterns
 * @returns {Object} - Common conditions
 */
function findCommonConditions(patterns) {
  const conditions = {};

  for (const pattern of patterns) {
    if (pattern.condition) {
      const condition = JSON.stringify(pattern.condition);
      conditions[condition] = (conditions[condition] || 0) + 1;
    } else if (pattern.content) {
      const lines = pattern.content.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('if') || trimmedLine.startsWith('else if')) {
          conditions[trimmedLine] = (conditions[trimmedLine] || 0) + 1;
        }
      }
    }
  }

  return Object.entries(conditions)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [condition, count]) => {
      obj[condition] = count;
      return obj;
    }, {});
}

/**
 * Calculate condition frequency in conditional logic patterns
 * @param {Object[]} patterns - Conditional logic patterns
 * @returns {Object} - Condition frequency
 */
function calculateConditionFrequency(patterns) {
  const frequency = {};

  for (const pattern of patterns) {
    if (pattern.content) {
      const lines = pattern.content.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('if') || trimmedLine.startsWith('else if')) {
          // Extract condition type
          const match = trimmedLine.match(/if\s*\(\s*([^.)\s]+)/);
          if (match) {
            const conditionType = match[1];
            frequency[conditionType] = (frequency[conditionType] || 0) + 1;
          }
        }
      }
    }
  }

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [condition, count]) => {
      obj[condition] = count;
      return obj;
    }, {});
}

/**
 * Find common variables in custom eval patterns
 * @param {Object[]} patterns - Custom eval patterns
 * @returns {Object} - Common variables
 */
function findCommonVariables(patterns) {
  const variables = {};

  for (const pattern of patterns) {
    if (pattern.content) {
      const lines = pattern.content.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('var ')) {
          const varName = trimmedLine.split(' ')[1].split('=')[0].trim();
          variables[varName] = (variables[varName] || 0) + 1;
        }
      }
    }
  }

  return Object.entries(variables)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [variable, count]) => {
      obj[variable] = count;
      return obj;
    }, {});
}

/**
 * Calculate variable frequency in custom eval patterns
 * @param {Object[]} patterns - Custom eval patterns
 * @returns {Object} - Variable frequency
 */
function calculateVariableFrequency(patterns) {
  const frequency = {};

  for (const pattern of patterns) {
    if (pattern.content) {
      // Extract all variable references
      const variableRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
      let match;
      while ((match = variableRegex.exec(pattern.content)) !== null) {
        const variable = match[1];
        // Skip JavaScript keywords
        if (!isJavaScriptKeyword(variable)) {
          frequency[variable] = (frequency[variable] || 0) + 1;
        }
      }
    }
  }

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [variable, count]) => {
      obj[variable] = count;
      return obj;
    }, {});
}

/**
 * Calculate tag frequency in game tag patterns
 * @param {Object[]} patterns - Game tag patterns
 * @returns {Object} - Tag frequency
 */
function calculateTagFrequency(patterns) {
  const frequency = {};

  for (const pattern of patterns) {
    frequency[pattern.type] = (frequency[pattern.type] || 0) + 1;
  }

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [tag, count]) => {
      obj[tag] = count;
      return obj;
    }, {});
}

/**
 * Calculate value distribution in game tag patterns
 * @param {Object[]} patterns - Game tag patterns
 * @returns {Object} - Value distribution
 */
function calculateValueDistribution(patterns) {
  const distribution = {};

  for (const pattern of patterns) {
    if (!distribution[pattern.type]) {
      distribution[pattern.type] = {};
    }
    
    const value = String(pattern.value);
    distribution[pattern.type][value] = (distribution[pattern.type][value] || 0) + 1;
  }

  // Sort values by frequency
  for (const type in distribution) {
    distribution[type] = Object.entries(distribution[type])
      .sort((a, b) => b[1] - a[1])
      .reduce((obj, [value, count]) => {
        obj[value] = count;
        return obj;
      }, {});
  }

  return distribution;
}

/**
 * Find common sequences of lines in patterns
 * @param {string[][]} contentArrays - Arrays of content lines
 * @returns {string[][]} - Common sequences
 */
function findCommonSequences(contentArrays) {
  if (contentArrays.length < 2) return [];

  const sequences = [];
  const minLength = 2; // Minimum sequence length to consider

  for (let i = 0; i < contentArrays.length - 1; i++) {
    const content1 = contentArrays[i];
    
    for (let j = i + 1; j < contentArrays.length; j++) {
      const content2 = contentArrays[j];
      
      // Find common sequences
      const common = findLongestCommonSubsequence(content1, content2);
      
      if (common.length >= minLength) {
        sequences.push(common);
      }
    }
  }

  return sequences;
}

/**
 * Find the longest common subsequence of lines
 * @param {string[]} arr1 - First array of lines
 * @param {string[]} arr2 - Second array of lines
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
 * Count patterns that contain a sequence
 * @param {Object[]} patterns - Patterns
 * @param {string[]} sequence - Sequence of lines
 * @returns {number} - Number of patterns with sequence
 */
function countPatternsWithSequence(patterns, sequence) {
  let count = 0;
  
  for (const pattern of patterns) {
    const lines = pattern.content.split('\n').map(l => l.trim());
    if (containsSubsequence(lines, sequence)) {
      count++;
    }
  }
  
  return count;
}

/**
 * Check if an array contains a subsequence
 * @param {string[]} arr - Array to check
 * @param {string[]} subseq - Subsequence to find
 * @returns {boolean} - Whether the array contains the subsequence
 */
function containsSubsequence(arr, subseq) {
  if (subseq.length === 0) return true;
  if (arr.length < subseq.length) return false;
  
  for (let i = 0; i <= arr.length - subseq.length; i++) {
    let found = true;
    for (let j = 0; j < subseq.length; j++) {
      if (arr[i + j] !== subseq[j]) {
        found = false;
        break;
      }
    }
    if (found) return true;
  }
  
  return false;
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

module.exports = {
  extractPatterns,
  analyzePatterns,
  extractBattleAnimationPatterns,
  extractConditionalLogicPatterns,
  extractCustomEvalPatterns,
  extractGameTagPatterns
};
