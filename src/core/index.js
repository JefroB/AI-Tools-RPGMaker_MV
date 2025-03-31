/**
 * Core utilities
 * 
 * This module exports core utilities from the original AI-Tools project
 * that are useful for RPG Maker MV projects.
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

/**
 * Read a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - File content
 */
const readFile = async (filePath) => {
  return fs.readFile(filePath, 'utf8');
};

/**
 * Write to a file
 * @param {string} filePath - Path to the file
 * @param {string} content - Content to write
 * @returns {Promise<void>}
 */
const writeFile = async (filePath, content) => {
  await fs.ensureDir(path.dirname(filePath));
  return fs.writeFile(filePath, content, 'utf8');
};

/**
 * Create a directory
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<void>}
 */
const createDirectory = async (dirPath) => {
  return fs.ensureDir(dirPath);
};

/**
 * List files in a directory
 * @param {string} dirPath - Path to the directory
 * @param {Object} options - Options
 * @param {boolean} options.recursive - Whether to list files recursively
 * @param {boolean} options.fullPaths - Whether to return full paths
 * @returns {Promise<string[]>} - List of files
 */
const listFiles = async (dirPath, options = {}) => {
  const { recursive = false, fullPaths = false } = options;
  
  const pattern = recursive ? '**/*' : '*';
  const files = glob.sync(pattern, {
    cwd: dirPath,
    nodir: true,
    absolute: fullPaths
  });
  
  return fullPaths ? files : files.map(file => path.join(dirPath, file));
};

/**
 * Check if a file exists
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} - Whether the file exists
 */
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Parse JSON safely
 * @param {string} content - JSON content
 * @returns {Object|null} - Parsed JSON or null if invalid
 */
const parseJson = (content) => {
  try {
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
};

/**
 * Stringify JSON safely
 * @param {Object} obj - Object to stringify
 * @param {number} indent - Indentation
 * @returns {string} - JSON string
 */
const stringifyJson = (obj, indent = 2) => {
  try {
    return JSON.stringify(obj, null, indent);
  } catch (error) {
    return '';
  }
};

module.exports = {
  readFile,
  writeFile,
  createDirectory,
  listFiles,
  fileExists,
  parseJson,
  stringifyJson
};
