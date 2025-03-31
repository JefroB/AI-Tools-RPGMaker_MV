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
const contextExtractor = require('./rpgmaker/contextExtractor');
const assetCreator = require('./rpgmaker/assetCreator');

// Export all modules
module.exports = {
  // Core utilities
  ...core,

  // RPG Maker specific utilities
  dataFixer,
  analyzer,
  utils,
  contextExtractor,
  assetCreator,

  // Convenience methods
  fixJson: dataFixer.fixJson,
  analyzeProject: analyzer.analyzeProject,
  extractContext: contextExtractor.extractContext,
  analyzeImageAssets: assetCreator.analyzeImageAssets,
  generateMissingAssetRequest: assetCreator.generateMissingAssetRequest,

  // Version information
  version: require('../package.json').version
};
