/**
 * RPG Maker MV Project Analyzer
 * 
 * This module provides utilities for analyzing RPG Maker MV projects.
 * It can analyze JSON files, project structure, and identify common issues.
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { parseJson, stringifyJson } = require('../../core');

/**
 * Analyze a JSON file for issues
 * @param {string} filePath - Path to the file
 * @param {string} content - File content
 * @returns {Object} - Analysis result
 */
function analyzeJsonFile(filePath, content) {
  const issues = [];
  let fixable = true;
  
  // Check for missing commas between properties
  const missingCommas = findMissingCommas(content);
  issues.push(...missingCommas);
  
  // Check for JavaScript issues in note fields
  const jsIssues = findJavaScriptIssues(content);
  issues.push(...jsIssues);
  
  // Check if file is valid JSON
  try {
    JSON.parse(content);
  } catch (error) {
    issues.push({
      type: 'invalid_json',
      message: `Invalid JSON: ${error.message}`,
      line: 0,
      column: 0,
      severity: 'error'
    });
    fixable = false;
  }
  
  return {
    file: filePath,
    content,
    issues,
    fixable
  };
}

/**
 * Find missing commas between properties in JSON
 * @param {string} content - File content
 * @returns {Object[]} - List of issues
 */
function findMissingCommas(content) {
  const issues = [];
  const regex = /"([a-zA-Z0-9_]+)":([^,\s}])\s*"([a-zA-Z0-9_]+)":/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const [fullMatch, prop1, value, prop2] = match;
    
    issues.push({
      type: 'missing_comma',
      message: `Missing comma between "${prop1}" and "${prop2}"`,
      line: getLineNumber(content, match.index),
      column: getColumnNumber(content, match.index),
      index: match.index,
      length: fullMatch.length,
      prop1,
      value,
      prop2,
      severity: 'error',
      fixable: true
    });
  }
  
  return issues;
}

/**
 * Find JavaScript issues in note fields
 * @param {string} content - File content
 * @returns {Object[]} - List of issues
 */
function findJavaScriptIssues(content) {
  const issues = [];
  const noteRegex = /"note":"((?:\\"|[^"])*)"/g;
  let match;
  
  while ((match = noteRegex.exec(content)) !== null) {
    const [fullMatch, noteContent] = match;
    
    // Skip empty notes
    if (!noteContent) continue;
    
    // Check for missing semicolons
    const semicolonRegex = /([^;{])\s*\n\s*([a-zA-Z$_])/g;
    let semicolonMatch;
    
    while ((semicolonMatch = semicolonRegex.exec(noteContent)) !== null) {
      issues.push({
        type: 'missing_semicolon',
        message: 'Missing semicolon in JavaScript code',
        line: getLineNumber(content, match.index + semicolonMatch.index + 7), // 7 for "note":"
        column: getColumnNumber(content, match.index + semicolonMatch.index + 7),
        index: match.index + semicolonMatch.index + 7,
        length: semicolonMatch[0].length,
        severity: 'warning',
        fixable: true
      });
    }
    
    // Check for unescaped quotes
    const quoteRegex = /([^\\])"/g;
    let quoteMatch;
    
    while ((quoteMatch = quoteRegex.exec(noteContent)) !== null) {
      if (quoteMatch[0] === '\\"') continue; // Already escaped
      
      issues.push({
        type: 'unescaped_quote',
        message: 'Unescaped quote in JavaScript code',
        line: getLineNumber(content, match.index + quoteMatch.index + 7),
        column: getColumnNumber(content, match.index + quoteMatch.index + 7),
        index: match.index + quoteMatch.index + 7,
        length: quoteMatch[0].length,
        severity: 'error',
        fixable: true
      });
    }
    
    // Check for arrow functions
    const arrowRegex = /\(([^)]*)\)\s*=>\s*{/g;
    let arrowMatch;
    
    while ((arrowMatch = arrowRegex.exec(noteContent)) !== null) {
      issues.push({
        type: 'arrow_function',
        message: 'Arrow function used in JavaScript code (may not be supported by older plugins)',
        line: getLineNumber(content, match.index + arrowMatch.index + 7),
        column: getColumnNumber(content, match.index + arrowMatch.index + 7),
        index: match.index + arrowMatch.index + 7,
        length: arrowMatch[0].length,
        severity: 'warning',
        fixable: true
      });
    }
    
    // Check for let/const declarations
    const varRegex = /\b(let|const)\b\s+([a-zA-Z$_][a-zA-Z0-9$_]*)/g;
    let varMatch;
    
    while ((varMatch = varRegex.exec(noteContent)) !== null) {
      issues.push({
        type: 'modern_var_declaration',
        message: `"${varMatch[1]}" used in JavaScript code (may not be supported by older plugins)`,
        line: getLineNumber(content, match.index + varMatch.index + 7),
        column: getColumnNumber(content, match.index + varMatch.index + 7),
        index: match.index + varMatch.index + 7,
        length: varMatch[0].length,
        severity: 'warning',
        fixable: true
      });
    }
  }
  
  return issues;
}

/**
 * Get line number for a position in text
 * @param {string} text - Text content
 * @param {number} index - Character index
 * @returns {number} - Line number (1-based)
 */
function getLineNumber(text, index) {
  const lines = text.substring(0, index).split('\n');
  return lines.length;
}

/**
 * Get column number for a position in text
 * @param {string} text - Text content
 * @param {number} index - Character index
 * @returns {number} - Column number (1-based)
 */
function getColumnNumber(text, index) {
  const lines = text.substring(0, index).split('\n');
  return lines[lines.length - 1].length + 1;
}

/**
 * Analyze a single RPG Maker MV data file
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} - Analysis result
 */
async function analyzeFile(filePath) {
  try {
    // Read file content
    const content = await fs.readFile(filePath, 'utf8');
    
    // Analyze file
    return analyzeJsonFile(filePath, content);
  } catch (error) {
    return {
      file: filePath,
      content: '',
      issues: [{
        type: 'error',
        message: `Failed to analyze file: ${error.message}`,
        line: 0,
        column: 0,
        severity: 'error'
      }],
      fixable: false
    };
  }
}

/**
 * Analyze all RPG Maker MV data files in a directory
 * @param {string} dirPath - Path to the directory
 * @param {Object} options - Options
 * @param {boolean} options.recursive - Whether to process files recursively
 * @param {string[]} options.include - File patterns to include
 * @param {string[]} options.exclude - File patterns to exclude
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeFiles(dirPath, options = {}) {
  const {
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
  
  // Analyze each file
  const results = [];
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const result = await analyzeFile(filePath);
    results.push(result);
  }
  
  return results;
}

/**
 * Generate a summary of analysis results
 * @param {Object[]} results - Analysis results
 * @returns {Object} - Summary
 */
function generateSummary(results) {
  const summary = {
    totalFiles: results.length,
    filesWithIssues: results.filter(r => r.issues.length > 0).length,
    totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
    issuesByType: {},
    issuesBySeverity: {
      error: 0,
      warning: 0,
      info: 0
    },
    fixableIssues: 0,
    unfixableIssues: 0
  };
  
  // Count issues by type and severity
  for (const result of results) {
    for (const issue of result.issues) {
      // Count by type
      summary.issuesByType[issue.type] = (summary.issuesByType[issue.type] || 0) + 1;
      
      // Count by severity
      summary.issuesBySeverity[issue.severity] = (summary.issuesBySeverity[issue.severity] || 0) + 1;
      
      // Count fixable issues
      if (issue.fixable) {
        summary.fixableIssues++;
      } else {
        summary.unfixableIssues++;
      }
    }
  }
  
  return summary;
}

/**
 * Analyze an RPG Maker MV project
 * @param {string} projectPath - Path to the project
 * @param {Object} options - Options
 * @param {boolean} options.recursive - Whether to process files recursively
 * @param {string[]} options.include - File patterns to include
 * @param {string[]} options.exclude - File patterns to exclude
 * @param {string} options.outputDir - Directory to write the analysis results to
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeProject(projectPath, options = {}) {
  const {
    recursive = false,
    include = ['*.json'],
    exclude = [],
    outputDir = null
  } = options;
  
  // Analyze files
  const results = await analyzeFiles(projectPath, {
    recursive,
    include,
    exclude
  });
  
  // Generate summary
  const summary = generateSummary(results);
  
  // Write results to files if outputDir is provided
  if (outputDir) {
    await fs.ensureDir(outputDir);
    
    // Write detailed results
    await fs.writeFile(
      path.join(outputDir, 'analysis-results.json'),
      stringifyJson(results)
    );
    
    // Write summary
    await fs.writeFile(
      path.join(outputDir, 'analysis-summary.json'),
      stringifyJson(summary)
    );
    
    // Generate HTML report
    const htmlReport = generateHtmlReport(results, summary);
    await fs.writeFile(
      path.join(outputDir, 'analysis-report.html'),
      htmlReport
    );
  }
  
  return {
    results,
    summary
  };
}

/**
 * Generate an HTML report from analysis results
 * @param {Object[]} results - Analysis results
 * @param {Object} summary - Analysis summary
 * @returns {string} - HTML report
 */
function generateHtmlReport(results, summary) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RPG Maker MV Data Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 30px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
    .issues { background: #fff8f8; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    .error { color: #d9534f; }
    .warning { color: #f0ad4e; }
    .info { color: #5bc0de; }
    .fixable { color: #5cb85c; }
    .unfixable { color: #d9534f; }
  </style>
</head>
<body>
  <h1>RPG Maker MV Data Analysis Report</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Files: ${summary.totalFiles}</p>
    <p>Files with Issues: ${summary.filesWithIssues}</p>
    <p>Total Issues: ${summary.totalIssues}</p>
    
    <h3>Issues by Type</h3>
    <table>
      <tr>
        <th>Issue Type</th>
        <th>Count</th>
      </tr>
      ${Object.entries(summary.issuesByType).map(([type, count]) => `
      <tr>
        <td>${type.replace(/_/g, ' ')}</td>
        <td>${count}</td>
      </tr>
      `).join('')}
    </table>
    
    <h3>Issues by Severity</h3>
    <table>
      <tr>
        <th>Severity</th>
        <th>Count</th>
      </tr>
      ${Object.entries(summary.issuesBySeverity).map(([severity, count]) => `
      <tr>
        <td class="${severity}">${severity}</td>
        <td>${count}</td>
      </tr>
      `).join('')}
    </table>
    
    <h3>Fixability</h3>
    <table>
      <tr>
        <th>Status</th>
        <th>Count</th>
      </tr>
      <tr>
        <td class="fixable">Fixable</td>
        <td>${summary.fixableIssues}</td>
      </tr>
      <tr>
        <td class="unfixable">Unfixable</td>
        <td>${summary.unfixableIssues}</td>
      </tr>
    </table>
  </div>
  
  <div class="issues">
    <h2>Issues by File</h2>
    ${results.map(result => `
    <h3>${path.basename(result.file)}</h3>
    ${result.issues.length === 0 ? '<p>No issues found</p>' : `
    <table>
      <tr>
        <th>Type</th>
        <th>Message</th>
        <th>Line</th>
        <th>Column</th>
        <th>Severity</th>
        <th>Fixable</th>
      </tr>
      ${result.issues.map(issue => `
      <tr>
        <td>${issue.type.replace(/_/g, ' ')}</td>
        <td>${issue.message}</td>
        <td>${issue.line}</td>
        <td>${issue.column}</td>
        <td class="${issue.severity}">${issue.severity}</td>
        <td class="${issue.fixable ? 'fixable' : 'unfixable'}">${issue.fixable ? 'Yes' : 'No'}</td>
      </tr>
      `).join('')}
    </table>
    `}
    `).join('')}
  </div>
</body>
</html>`;

  return html;
}

module.exports = {
  analyzeFile,
  analyzeFiles,
  analyzeProject,
  generateSummary,
  generateHtmlReport
};
