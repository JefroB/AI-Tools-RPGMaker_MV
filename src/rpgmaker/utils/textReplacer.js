/**
 * RPG Maker MV Text Replacer
 * 
 * This module provides utilities for finding and replacing text across RPG Maker MV data files.
 * It helps with making global text changes, fixing terminology, or updating lore elements.
 */

const fs = require('fs-extra');
const path = require('path');
const { parseJson } = require('../../core');

/**
 * Search for text patterns across all game data files
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {string|RegExp} searchPattern - Text pattern to search for (string or regex)
 * @param {Object} options - Search options
 * @param {boolean} options.caseSensitive - Whether the search is case-sensitive (default: false)
 * @param {Array<string>} options.fileTypes - File types to search in (default: all JSON files)
 * @param {boolean} options.includeCommonEvents - Whether to search in CommonEvents.json (default: true)
 * @param {boolean} options.includeMapEvents - Whether to search in Map*.json files (default: true)
 * @param {boolean} options.includeSystem - Whether to search in System.json (default: true)
 * @returns {Promise<Object>} - Search results
 */
async function searchText(projectPath, searchPattern, options = {}) {
  const {
    caseSensitive = false,
    fileTypes = ['json'],
    includeCommonEvents = true,
    includeMapEvents = true,
    includeSystem = true
  } = options;

  // Validate project path
  const dataPath = path.join(projectPath, 'data');
  if (!await fs.pathExists(dataPath)) {
    throw new Error(`Invalid RPG Maker MV project path: ${projectPath}`);
  }

  // Convert string pattern to RegExp if needed
  const pattern = searchPattern instanceof RegExp 
    ? searchPattern 
    : new RegExp(searchPattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), caseSensitive ? 'g' : 'gi');

  // Initialize results
  const results = {
    pattern: searchPattern.toString(),
    totalMatches: 0,
    matchesByFile: {}
  };

  // Get all data files
  const files = await fs.readdir(dataPath);
  const dataFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase().substring(1);
    return fileTypes.includes(ext) && 
           (includeCommonEvents || file !== 'CommonEvents.json') &&
           (includeMapEvents || !file.startsWith('Map')) &&
           (includeSystem || file !== 'System.json');
  });

  // Search each file
  for (const file of dataFiles) {
    const filePath = path.join(dataPath, file);
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    try {
      const data = parseJson(fileContent);
      const fileMatches = searchInObject(data, pattern);
      
      if (fileMatches.length > 0) {
        results.matchesByFile[file] = fileMatches;
        results.totalMatches += fileMatches.length;
      }
    } catch (error) {
      console.error(`Error parsing ${file}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Replace text across all game data files
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {string|RegExp} searchPattern - Text pattern to search for (string or regex)
 * @param {string} replacement - Text to replace with
 * @param {Object} options - Replace options
 * @param {boolean} options.caseSensitive - Whether the search is case-sensitive (default: false)
 * @param {Array<string>} options.fileTypes - File types to search in (default: all JSON files)
 * @param {boolean} options.includeCommonEvents - Whether to replace in CommonEvents.json (default: true)
 * @param {boolean} options.includeMapEvents - Whether to replace in Map*.json files (default: true)
 * @param {boolean} options.includeSystem - Whether to replace in System.json (default: true)
 * @param {boolean} options.createBackup - Whether to create backup files (default: true)
 * @returns {Promise<Object>} - Replacement results
 */
async function replaceText(projectPath, searchPattern, replacement, options = {}) {
  const {
    caseSensitive = false,
    fileTypes = ['json'],
    includeCommonEvents = true,
    includeMapEvents = true,
    includeSystem = true,
    createBackup = true
  } = options;

  // Validate project path
  const dataPath = path.join(projectPath, 'data');
  if (!await fs.pathExists(dataPath)) {
    throw new Error(`Invalid RPG Maker MV project path: ${projectPath}`);
  }

  // Convert string pattern to RegExp if needed
  const pattern = searchPattern instanceof RegExp 
    ? searchPattern 
    : new RegExp(searchPattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), caseSensitive ? 'g' : 'gi');

  // Initialize results
  const results = {
    pattern: searchPattern.toString(),
    replacement: replacement,
    totalReplacements: 0,
    replacementsByFile: {}
  };

  // Get all data files
  const files = await fs.readdir(dataPath);
  const dataFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase().substring(1);
    return fileTypes.includes(ext) && 
           (includeCommonEvents || file !== 'CommonEvents.json') &&
           (includeMapEvents || !file.startsWith('Map')) &&
           (includeSystem || file !== 'System.json');
  });

  // Process each file
  for (const file of dataFiles) {
    const filePath = path.join(dataPath, file);
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    try {
      const data = parseJson(fileContent);
      const { object: updatedData, count } = replaceInObject(data, pattern, replacement);
      
      if (count > 0) {
        // Create backup if needed
        if (createBackup) {
          const backupPath = path.join(dataPath, `${file}.bak`);
          await fs.writeFile(backupPath, fileContent);
        }
        
        // Write updated file
        await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));
        
        results.replacementsByFile[file] = count;
        results.totalReplacements += count;
      }
    } catch (error) {
      console.error(`Error processing ${file}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Search for text in an object recursively
 * @param {Object} obj - Object to search in
 * @param {RegExp} pattern - Pattern to search for
 * @param {string} path - Current path in the object (for internal use)
 * @returns {Array} - Array of matches with paths
 */
function searchInObject(obj, pattern, path = '') {
  const matches = [];
  
  if (!obj || typeof obj !== 'object') {
    return matches;
  }
  
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    
    const currentPath = path ? `${path}.${key}` : key;
    const value = obj[key];
    
    if (typeof value === 'string') {
      // Check if the string matches the pattern
      const stringMatches = [...value.matchAll(pattern)];
      if (stringMatches.length > 0) {
        matches.push({
          path: currentPath,
          value: value,
          matches: stringMatches.map(match => ({
            text: match[0],
            index: match.index
          }))
        });
      }
    } else if (Array.isArray(value)) {
      // Search in array elements
      for (let i = 0; i < value.length; i++) {
        const arrayPath = `${currentPath}[${i}]`;
        if (typeof value[i] === 'string') {
          const stringMatches = [...value[i].matchAll(pattern)];
          if (stringMatches.length > 0) {
            matches.push({
              path: arrayPath,
              value: value[i],
              matches: stringMatches.map(match => ({
                text: match[0],
                index: match.index
              }))
            });
          }
        } else if (typeof value[i] === 'object' && value[i] !== null) {
          matches.push(...searchInObject(value[i], pattern, arrayPath));
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      // Search in nested objects
      matches.push(...searchInObject(value, pattern, currentPath));
    }
  }
  
  return matches;
}

/**
 * Replace text in an object recursively
 * @param {Object} obj - Object to replace in
 * @param {RegExp} pattern - Pattern to search for
 * @param {string} replacement - Text to replace with
 * @returns {Object} - Updated object and replacement count
 */
function replaceInObject(obj, pattern, replacement) {
  let count = 0;
  
  if (!obj || typeof obj !== 'object') {
    return { object: obj, count };
  }
  
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    
    const value = obj[key];
    
    if (typeof value === 'string') {
      // Replace in string
      const newValue = value.replace(pattern, replacement);
      if (newValue !== value) {
        result[key] = newValue;
        count += (value.match(pattern) || []).length;
      }
    } else if (Array.isArray(value)) {
      // Replace in array elements
      result[key] = [...value];
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] === 'string') {
          const newValue = value[i].replace(pattern, replacement);
          if (newValue !== value[i]) {
            result[key][i] = newValue;
            count += (value[i].match(pattern) || []).length;
          }
        } else if (typeof value[i] === 'object' && value[i] !== null) {
          const { object: updatedObj, count: nestedCount } = replaceInObject(value[i], pattern, replacement);
          if (nestedCount > 0) {
            result[key][i] = updatedObj;
            count += nestedCount;
          }
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      // Replace in nested objects
      const { object: updatedObj, count: nestedCount } = replaceInObject(value, pattern, replacement);
      if (nestedCount > 0) {
        result[key] = updatedObj;
        count += nestedCount;
      }
    }
  }
  
  return { object: result, count };
}

/**
 * Generate a report of text replacements
 * @param {Object} results - Results from replaceText
 * @returns {string} - Formatted report
 */
function generateReplacementReport(results) {
  let report = `# Text Replacement Report\n\n`;
  
  report += `## Summary\n\n`;
  report += `- Search Pattern: ${results.pattern}\n`;
  report += `- Replacement: ${results.replacement}\n`;
  report += `- Total Replacements: ${results.totalReplacements}\n`;
  report += `- Files Modified: ${Object.keys(results.replacementsByFile).length}\n\n`;
  
  report += `## Details\n\n`;
  for (const [file, count] of Object.entries(results.replacementsByFile)) {
    report += `- ${file}: ${count} replacements\n`;
  }
  
  return report;
}

/**
 * Fix common terminology issues in RPG Maker MV projects
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {Object} terminology - Map of terms to replace
 * @param {boolean} createBackup - Whether to create backup files
 * @returns {Promise<Object>} - Results of all replacements
 */
async function fixTerminology(projectPath, terminology, createBackup = true) {
  const results = {
    totalReplacements: 0,
    replacementsByTerm: {}
  };
  
  for (const [searchTerm, replacement] of Object.entries(terminology)) {
    const termResults = await replaceText(
      projectPath,
      searchTerm,
      replacement,
      { createBackup }
    );
    
    results.replacementsByTerm[searchTerm] = {
      replacement,
      count: termResults.totalReplacements,
      files: Object.keys(termResults.replacementsByFile)
    };
    
    results.totalReplacements += termResults.totalReplacements;
  }
  
  return results;
}

/**
 * Update world lore elements across all game data files
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {Object} loreElements - Map of lore elements to update
 * @param {boolean} createBackup - Whether to create backup files
 * @returns {Promise<Object>} - Results of all replacements
 */
async function updateLore(projectPath, loreElements, createBackup = true) {
  return fixTerminology(projectPath, loreElements, createBackup);
}

module.exports = {
  searchText,
  replaceText,
  generateReplacementReport,
  fixTerminology,
  updateLore
};
