/**
 * RPG Maker MV Data Fixer
 * 
 * This module provides utilities for fixing broken JSON files in RPG Maker MV projects.
 * It includes several approaches with increasing levels of sophistication:
 * - Basic: Simple regex-based fixes for common issues
 * - Intermediate: More comprehensive regex-based fixes
 * - Advanced: Enhanced regex-based fixes with multiple passes
 * - Manual: Character-by-character parsing and reconstruction
 */

const fs = require('fs-extra');
const path = require('path');
const { parseJson, stringifyJson } = require('../../core');

/**
 * Fix JSON content using the basic approach
 * @param {string} content - JSON content
 * @returns {Object} - Result of fixing
 */
const fixJsonBasic = (content) => {
  let issues = 0;
  let fixedContent = content;
  
  // Remove any HTML content at the beginning of the file
  const jsonStartIndex = content.search(/[\[\{]/);
  if (jsonStartIndex > 0) {
    fixedContent = content.substring(jsonStartIndex);
    issues++;
  }
  
  // Fix missing commas between properties
  fixedContent = fixedContent.replace(/"([a-zA-Z0-9_]+)":([^,\s\}\]]*)\s*"([a-zA-Z0-9_]+)":/g, (match, prop1, value, prop2) => {
    issues++;
    return `"${prop1}":${value},"${prop2}":`;
  });
  
  return {
    content: fixedContent,
    issues,
    approach: 'basic'
  };
};

/**
 * Fix JSON content using the intermediate approach
 * @param {string} content - JSON content
 * @returns {Object} - Result of fixing
 */
const fixJsonIntermediate = (content) => {
  let issues = 0;
  let fixedContent = content;
  
  // Remove any HTML content at the beginning of the file
  const jsonStartIndex = content.search(/[\[\{]/);
  if (jsonStartIndex > 0) {
    fixedContent = content.substring(jsonStartIndex);
    issues++;
  }
  
  // Fix missing commas between properties
  fixedContent = fixedContent.replace(/"([a-zA-Z0-9_]+)":([^,\s\}\]]*)\s*"([a-zA-Z0-9_]+)":/g, (match, prop1, value, prop2) => {
    issues++;
    return `"${prop1}":${value},"${prop2}":`;
  });
  
  // Fix missing commas in arrays
  fixedContent = fixedContent.replace(/\}\s*\{/g, (match) => {
    issues++;
    return '},{';
  });
  
  // Fix missing commas after closing brackets in arrays
  fixedContent = fixedContent.replace(/\]\s*"([a-zA-Z0-9_]+)":/g, (match, prop) => {
    issues++;
    return `],"${prop}":`;
  });
  
  // Fix missing commas after closing braces in arrays
  fixedContent = fixedContent.replace(/\}\s*"([a-zA-Z0-9_]+)":/g, (match, prop) => {
    issues++;
    return `},"${prop}":`;
  });
  
  return {
    content: fixedContent,
    issues,
    approach: 'intermediate'
  };
};

/**
 * Fix JSON content using the advanced approach
 * @param {string} content - JSON content
 * @returns {Object} - Result of fixing
 */
const fixJsonAdvanced = (content) => {
  let issues = 0;
  let fixedContent = content;
  
  // Remove any HTML content at the beginning of the file
  const jsonStartIndex = content.search(/[\[\{]/);
  if (jsonStartIndex > 0) {
    fixedContent = content.substring(jsonStartIndex);
    issues++;
  }
  
  // Enhanced approach: Insert commas between all properties
  // This regex looks for patterns like "property1":value"property2": and adds a comma
  // It's more aggressive than the previous version
  let prevContent;
  do {
    prevContent = fixedContent;
    
    // Fix missing commas between properties
    fixedContent = fixedContent.replace(/"([a-zA-Z0-9_]+)":\s*([^,\s\}\]]*)\s*"([a-zA-Z0-9_]+)":/g, (match, prop1, value, prop2) => {
      issues++;
      return `"${prop1}":${value},"${prop2}":`;
    });
    
    // Fix missing commas in arrays
    fixedContent = fixedContent.replace(/\}\s*\{/g, (match) => {
      issues++;
      return '},{';
    });
    
    // Fix missing commas after closing brackets in arrays
    fixedContent = fixedContent.replace(/\]\s*"([a-zA-Z0-9_]+)":/g, (match, prop) => {
      issues++;
      return `],"${prop}":`;
    });
    
    // Fix missing commas after closing braces in arrays
    fixedContent = fixedContent.replace(/\}\s*"([a-zA-Z0-9_]+)":/g, (match, prop) => {
      issues++;
      return `},"${prop}":`;
    });
    
    // Fix missing commas between array elements
    fixedContent = fixedContent.replace(/\]\s*\[/g, (match) => {
      issues++;
      return '],[';
    });
    
    // Fix missing commas between numeric values and properties
    fixedContent = fixedContent.replace(/(\d+)\s*"([a-zA-Z0-9_]+)":/g, (match, num, prop) => {
      issues++;
      return `${num},"${prop}":`;
    });
    
    // Fix missing commas between boolean values and properties
    fixedContent = fixedContent.replace(/(true|false)\s*"([a-zA-Z0-9_]+)":/g, (match, bool, prop) => {
      issues++;
      return `${bool},"${prop}":`;
    });
    
    // Fix missing commas between null values and properties
    fixedContent = fixedContent.replace(/(null)\s*"([a-zA-Z0-9_]+)":/g, (match, nullVal, prop) => {
      issues++;
      return `${nullVal},"${prop}":`;
    });
    
    // Fix missing commas between string values and properties
    fixedContent = fixedContent.replace(/"([^"]+)"\s*"([a-zA-Z0-9_]+)":/g, (match, str, prop) => {
      issues++;
      return `"${str}","${prop}":`;
    });
    
  } while (prevContent !== fixedContent); // Repeat until no more changes are made
  
  // Manual fixes for common patterns in RPG Maker MV files
  
  // Fix arrays with missing commas
  fixedContent = fixedContent.replace(/\[(\d+)(\d+)(\d+)/g, (match, num1, num2, num3) => {
    issues++;
    return `[${num1},${num2},${num3}`;
  });
  
  // Fix arrays with null and missing commas
  fixedContent = fixedContent.replace(/\[(null)(\d+)/g, (match, null1, num) => {
    issues++;
    return `[${null1},${num}`;
  });
  
  fixedContent = fixedContent.replace(/\[(\d+)(null)/g, (match, num, null1) => {
    issues++;
    return `[${num},${null1}`;
  });
  
  // Fix arrays with multiple nulls and missing commas
  fixedContent = fixedContent.replace(/\[(null)(null)/g, (match, null1, null2) => {
    issues++;
    return `[${null1},${null2}`;
  });
  
  // Fix specific patterns in RPG Maker MV files
  fixedContent = fixedContent.replace(/\[(\d+)(\d+)(\d+)(null)(\d+)\]/g, (match, num1, num2, num3, null1, num4) => {
    issues++;
    return `[${num1},${num2},${num3},${null1},${num4}]`;
  });
  
  return {
    content: fixedContent,
    issues,
    approach: 'advanced'
  };
};

/**
 * Fix JSON content using the manual approach
 * @param {string} content - JSON content
 * @returns {Object} - Result of fixing
 */
const fixJsonManual = (content) => {
  let issues = 0;
  
  // Remove any HTML content at the beginning of the file
  const jsonStartIndex = content.search(/[\[\{]/);
  if (jsonStartIndex > 0) {
    content = content.substring(jsonStartIndex);
    issues++;
  }
  
  // Determine if the file is an array or object
  const isArray = content.trim().startsWith('[');
  
  // Split the content into lines for easier processing
  const lines = content.split('\n');
  
  // Reconstruct the JSON
  let fixedContent = '';
  let inObject = false;
  let inArray = false;
  let inString = false;
  let depth = 0;
  
  if (isArray) {
    fixedContent = '[';
    inArray = true;
    depth = 1;
  } else {
    fixedContent = '{';
    inObject = true;
    depth = 1;
  }
  
  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (line === '') continue;
    
    // Process the line character by character
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = j < line.length - 1 ? line[j + 1] : '';
      
      // Handle string literals
      if (char === '"' && (j === 0 || line[j - 1] !== '\\')) {
        inString = !inString;
        fixedContent += char;
        continue;
      }
      
      // Skip characters inside strings
      if (inString) {
        fixedContent += char;
        continue;
      }
      
      // Handle object start
      if (char === '{') {
        inObject = true;
        depth++;
        fixedContent += char;
        continue;
      }
      
      // Handle object end
      if (char === '}') {
        inObject = depth > 1;
        depth--;
        fixedContent += char;
        
        // Add comma if needed
        if (nextChar === '{' || nextChar === '[') {
          fixedContent += ',';
          issues++;
        }
        continue;
      }
      
      // Handle array start
      if (char === '[') {
        inArray = true;
        depth++;
        fixedContent += char;
        continue;
      }
      
      // Handle array end
      if (char === ']') {
        inArray = depth > 1;
        depth--;
        fixedContent += char;
        
        // Add comma if needed
        if (nextChar === '{' || nextChar === '[') {
          fixedContent += ',';
          issues++;
        }
        continue;
      }
      
      // Handle property separator
      if (char === ':') {
        fixedContent += char;
        continue;
      }
      
      // Handle comma
      if (char === ',') {
        fixedContent += char;
        continue;
      }
      
      // Handle missing comma between properties
      if (char === '"' && j > 0 && line[j - 1] === '"') {
        fixedContent += ',';
        issues++;
      }
      
      // Add the character
      fixedContent += char;
    }
  }
  
  // Close any open structures
  while (depth > 0) {
    if (inArray) {
      fixedContent += ']';
    } else if (inObject) {
      fixedContent += '}';
    }
    depth--;
  }
  
  // Apply additional fixes from the advanced approach
  const advancedResult = fixJsonAdvanced(fixedContent);
  fixedContent = advancedResult.content;
  issues += advancedResult.issues;
  
  return {
    content: fixedContent,
    issues,
    approach: 'manual'
  };
};

/**
 * Fix JSON content using the best approach
 * @param {string} content - JSON content
 * @param {Object} options - Options
 * @param {string} options.approach - Approach to use (basic, intermediate, advanced, manual, auto)
 * @returns {Object} - Result of fixing
 */
const fixJson = (content, options = {}) => {
  const { approach = 'auto' } = options;
  
  // Try to parse the JSON first
  const parsed = parseJson(content);
  if (parsed) {
    // JSON is already valid
    return {
      content,
      issues: 0,
      approach: 'none'
    };
  }
  
  // Choose the approach
  switch (approach) {
    case 'basic':
      return fixJsonBasic(content);
    case 'intermediate':
      return fixJsonIntermediate(content);
    case 'advanced':
      return fixJsonAdvanced(content);
    case 'manual':
      return fixJsonManual(content);
    case 'auto':
    default:
      // Try each approach in order of increasing sophistication
      const basicResult = fixJsonBasic(content);
      if (parseJson(basicResult.content)) {
        return basicResult;
      }
      
      const intermediateResult = fixJsonIntermediate(content);
      if (parseJson(intermediateResult.content)) {
        return intermediateResult;
      }
      
      const advancedResult = fixJsonAdvanced(content);
      if (parseJson(advancedResult.content)) {
        return advancedResult;
      }
      
      return fixJsonManual(content);
  }
};

/**
 * Fix a JSON file
 * @param {string} filePath - Path to the file
 * @param {Object} options - Options
 * @param {string} options.approach - Approach to use (basic, intermediate, advanced, manual, auto)
 * @param {string} options.outputPath - Path to write the fixed file to (defaults to overwriting the original)
 * @returns {Promise<Object>} - Result of fixing
 */
const fixJsonFile = async (filePath, options = {}) => {
  const { outputPath = filePath, approach = 'auto' } = options;
  
  // Read the file
  const content = await fs.readFile(filePath, 'utf8');
  
  // Fix the JSON
  const result = fixJson(content, { approach });
  
  // Write the fixed content
  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, result.content, 'utf8');
  
  return {
    ...result,
    filePath,
    outputPath
  };
};

/**
 * Fix all JSON files in a directory
 * @param {string} dirPath - Path to the directory
 * @param {Object} options - Options
 * @param {string} options.approach - Approach to use (basic, intermediate, advanced, manual, auto)
 * @param {string} options.outputDir - Directory to write the fixed files to (defaults to overwriting the originals)
 * @param {boolean} options.recursive - Whether to process files recursively
 * @param {string[]} options.include - File patterns to include
 * @param {string[]} options.exclude - File patterns to exclude
 * @returns {Promise<Object>} - Result of fixing
 */
const fixJsonFiles = async (dirPath, options = {}) => {
  const {
    approach = 'auto',
    outputDir = dirPath,
    recursive = false,
    include = ['*.json'],
    exclude = []
  } = options;
  
  // Get all JSON files
  const pattern = recursive ? '**/*.json' : '*.json';
  const files = glob.sync(pattern, {
    cwd: dirPath,
    nodir: true,
    ignore: exclude
  });
  
  // Fix each file
  const results = [];
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const outputPath = path.join(outputDir, file);
    
    try {
      const result = await fixJsonFile(filePath, {
        approach,
        outputPath
      });
      
      results.push(result);
    } catch (error) {
      results.push({
        filePath,
        outputPath,
        error: error.message,
        issues: 0,
        approach: 'error'
      });
    }
  }
  
  return {
    results,
    totalFiles: results.length,
    fixedFiles: results.filter(r => r.issues > 0).length,
    totalIssues: results.reduce((sum, r) => sum + r.issues, 0)
  };
};

module.exports = {
  fixJson,
  fixJsonFile,
  fixJsonFiles,
  fixJsonBasic,
  fixJsonIntermediate,
  fixJsonAdvanced,
  fixJsonManual
};
