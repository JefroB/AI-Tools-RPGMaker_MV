/**
 * RPG Maker MV Context Extractor
 * 
 * This module provides utilities for extracting contextual information from RPG Maker MV data files.
 * It helps AI tools understand the narrative, characters, locations, and game mechanics.
 */

const fs = require('fs-extra');
const path = require('path');
const { parseJson } = require('../../core');

// Import sub-modules
const narrativeExtractor = require('./narrativeExtractor');
const worldBuilder = require('./worldBuilder');
const characterRelationships = require('./characterRelationships');
const gameSystemsAnalyzer = require('./gameSystemsAnalyzer');
const contextualSummarizer = require('./contextualSummarizer');

/**
 * Extract contextual information from an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {Object} options - Options for extraction
 * @param {boolean} options.extractNarrative - Whether to extract narrative information
 * @param {boolean} options.buildWorld - Whether to build world information
 * @param {boolean} options.mapCharacterRelationships - Whether to map character relationships
 * @param {boolean} options.analyzeGameSystems - Whether to analyze game systems
 * @param {boolean} options.generateSummaries - Whether to generate contextual summaries
 * @returns {Promise<Object>} - Extracted contextual information
 */
async function extractContext(projectPath, options = {}) {
  const {
    extractNarrative = true,
    buildWorld = true,
    mapCharacterRelationships = true,
    analyzeGameSystems = true,
    generateSummaries = true
  } = options;

  // Validate project path
  const dataPath = path.join(projectPath, 'data');
  if (!await fs.pathExists(dataPath)) {
    throw new Error(`Invalid RPG Maker MV project path: ${projectPath}`);
  }

  // Initialize result object
  const result = {
    projectName: '',
    narrative: null,
    world: null,
    characters: null,
    gameSystems: null,
    summaries: null
  };

  try {
    // Get project name from System.json
    const systemPath = path.join(dataPath, 'System.json');
    if (await fs.pathExists(systemPath)) {
      const systemData = parseJson(await fs.readFile(systemPath, 'utf8'));
      result.projectName = systemData?.gameTitle || path.basename(projectPath);
    } else {
      result.projectName = path.basename(projectPath);
    }

    // Extract narrative information
    if (extractNarrative) {
      result.narrative = await narrativeExtractor.extractNarrative(projectPath);
    }

    // Build world information
    if (buildWorld) {
      result.world = await worldBuilder.buildWorld(projectPath);
    }

    // Map character relationships
    if (mapCharacterRelationships) {
      result.characters = await characterRelationships.mapRelationships(projectPath);
    }

    // Analyze game systems
    if (analyzeGameSystems) {
      result.gameSystems = await gameSystemsAnalyzer.analyzeGameSystems(projectPath);
    }

    // Generate contextual summaries
    if (generateSummaries) {
      result.summaries = await contextualSummarizer.generateSummaries(projectPath, result);
    }

    return result;
  } catch (error) {
    throw new Error(`Error extracting context: ${error.message}`);
  }
}

/**
 * Extract narrative information from an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @returns {Promise<Object>} - Extracted narrative information
 */
async function extractNarrative(projectPath) {
  return narrativeExtractor.extractNarrative(projectPath);
}

/**
 * Build world information from an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @returns {Promise<Object>} - Built world information
 */
async function buildWorld(projectPath) {
  return worldBuilder.buildWorld(projectPath);
}

/**
 * Map character relationships from an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @returns {Promise<Object>} - Mapped character relationships
 */
async function mapCharacterRelationships(projectPath) {
  return characterRelationships.mapRelationships(projectPath);
}

/**
 * Analyze game systems from an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @returns {Promise<Object>} - Analyzed game systems
 */
async function analyzeGameSystems(projectPath) {
  return gameSystemsAnalyzer.analyzeGameSystems(projectPath);
}

/**
 * Generate contextual summaries from an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {Object} contextData - Previously extracted context data
 * @returns {Promise<Object>} - Generated contextual summaries
 */
async function generateSummaries(projectPath, contextData = null) {
  if (!contextData) {
    contextData = await extractContext(projectPath, {
      generateSummaries: false
    });
  }
  return contextualSummarizer.generateSummaries(projectPath, contextData);
}

module.exports = {
  extractContext,
  extractNarrative,
  buildWorld,
  mapCharacterRelationships,
  analyzeGameSystems,
  generateSummaries
};
