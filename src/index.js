/**
 * RPG Maker AI Tools
 * 
 * A collection of AI-powered tools for RPG Maker MV projects.
 * This library provides utilities for analyzing and fixing RPG Maker MV data files,
 * as well as other helpful tools for RPG Maker MV development.
 */

// Core utilities
const core = require('./core');

// RPG Maker specific utilities
const dataFixer = require('./rpgmaker/dataFixer');
const analyzer = require('./rpgmaker/analyzer');
const utils = require('./rpgmaker/utils');

// Export all modules
module.exports = {
  // Core utilities
  ...core,
  
  // RPG Maker specific utilities
  dataFixer,
  analyzer,
  utils,
  
  // Convenience methods
  fixJson: dataFixer.fixJson,
  analyzeProject: analyzer.analyzeProject,
  
  // Version information
  version: require('../package.json').version
};
