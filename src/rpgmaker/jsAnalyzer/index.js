/**
 * RPG Maker MV JavaScript Analyzer
 * 
 * This module provides tools for analyzing JavaScript code in RPG Maker MV data files.
 * It extracts patterns, analyzes code, and maps relationships between JavaScript and game elements.
 */

// Import submodules
const patternExtractor = require('./patternExtractor');
const battleAnimationAnalyzer = require('./battleAnimationAnalyzer');
const conditionalLogicAnalyzer = require('./conditionalLogicAnalyzer');
const customEvalAnalyzer = require('./customEvalAnalyzer');
const gameTagAnalyzer = require('./gameTagAnalyzer');
const relationshipMapper = require('./relationshipMapper');
const visualizer = require('./visualizer');

// Export all submodules
module.exports = {
  patternExtractor,
  battleAnimationAnalyzer,
  conditionalLogicAnalyzer,
  customEvalAnalyzer,
  gameTagAnalyzer,
  relationshipMapper,
  visualizer
};
