/**
 * RPG Maker MV Utilities
 * 
 * This module provides utilities specific to RPG Maker MV projects.
 * It includes functions for working with RPG Maker MV data structures,
 * file formats, and common operations.
 */

const fs = require('fs-extra');
const path = require('path');
const { parseJson, stringifyJson } = require('../../core');

/**
 * RPG Maker MV file types
 * @type {Object}
 */
const FileTypes = {
  ACTORS: 'Actors.json',
  ANIMATIONS: 'Animations.json',
  ARMORS: 'Armors.json',
  CLASSES: 'Classes.json',
  COMMON_EVENTS: 'CommonEvents.json',
  ENEMIES: 'Enemies.json',
  ITEMS: 'Items.json',
  MAP_INFOS: 'MapInfos.json',
  SKILLS: 'Skills.json',
  STATES: 'States.json',
  SYSTEM: 'System.json',
  TILESETS: 'Tilesets.json',
  TROOPS: 'Troops.json',
  WEAPONS: 'Weapons.json'
};

/**
 * Get the path to a data file
 * @param {string} projectPath - Path to the project
 * @param {string} fileType - File type (use FileTypes constants)
 * @returns {string} - Path to the file
 */
function getDataFilePath(projectPath, fileType) {
  return path.join(projectPath, 'data', fileType);
}

/**
 * Load a data file
 * @param {string} projectPath - Path to the project
 * @param {string} fileType - File type (use FileTypes constants)
 * @returns {Promise<Object>} - Parsed data
 */
async function loadDataFile(projectPath, fileType) {
  const filePath = getDataFilePath(projectPath, fileType);
  const content = await fs.readFile(filePath, 'utf8');
  return parseJson(content);
}

/**
 * Save a data file
 * @param {string} projectPath - Path to the project
 * @param {string} fileType - File type (use FileTypes constants)
 * @param {Object} data - Data to save
 * @returns {Promise<void>}
 */
async function saveDataFile(projectPath, fileType, data) {
  const filePath = getDataFilePath(projectPath, fileType);
  const content = stringifyJson(data);
  await fs.writeFile(filePath, content, 'utf8');
}

/**
 * Get a map file path
 * @param {string} projectPath - Path to the project
 * @param {number} mapId - Map ID
 * @returns {string} - Path to the map file
 */
function getMapFilePath(projectPath, mapId) {
  const mapIdStr = mapId.toString().padStart(3, '0');
  return path.join(projectPath, 'data', `Map${mapIdStr}.json`);
}

/**
 * Load a map file
 * @param {string} projectPath - Path to the project
 * @param {number} mapId - Map ID
 * @returns {Promise<Object>} - Parsed map data
 */
async function loadMapFile(projectPath, mapId) {
  const filePath = getMapFilePath(projectPath, mapId);
  const content = await fs.readFile(filePath, 'utf8');
  return parseJson(content);
}

/**
 * Save a map file
 * @param {string} projectPath - Path to the project
 * @param {number} mapId - Map ID
 * @param {Object} data - Map data to save
 * @returns {Promise<void>}
 */
async function saveMapFile(projectPath, mapId, data) {
  const filePath = getMapFilePath(projectPath, mapId);
  const content = stringifyJson(data);
  await fs.writeFile(filePath, content, 'utf8');
}

/**
 * Get all map IDs in a project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<number[]>} - List of map IDs
 */
async function getMapIds(projectPath) {
  const mapInfos = await loadDataFile(projectPath, FileTypes.MAP_INFOS);
  return Object.keys(mapInfos)
    .filter(key => key !== '0' && mapInfos[key]) // Skip null entries
    .map(key => parseInt(key, 10));
}

/**
 * Get map info for a specific map
 * @param {string} projectPath - Path to the project
 * @param {number} mapId - Map ID
 * @returns {Promise<Object>} - Map info
 */
async function getMapInfo(projectPath, mapId) {
  const mapInfos = await loadDataFile(projectPath, FileTypes.MAP_INFOS);
  return mapInfos[mapId];
}

/**
 * Get all actors in a project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<Object[]>} - List of actors
 */
async function getActors(projectPath) {
  const actors = await loadDataFile(projectPath, FileTypes.ACTORS);
  return actors.filter(actor => actor); // Skip null entries
}

/**
 * Get all classes in a project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<Object[]>} - List of classes
 */
async function getClasses(projectPath) {
  const classes = await loadDataFile(projectPath, FileTypes.CLASSES);
  return classes.filter(cls => cls); // Skip null entries
}

/**
 * Get all skills in a project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<Object[]>} - List of skills
 */
async function getSkills(projectPath) {
  const skills = await loadDataFile(projectPath, FileTypes.SKILLS);
  return skills.filter(skill => skill); // Skip null entries
}

/**
 * Get all items in a project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<Object[]>} - List of items
 */
async function getItems(projectPath) {
  const items = await loadDataFile(projectPath, FileTypes.ITEMS);
  return items.filter(item => item); // Skip null entries
}

/**
 * Get all weapons in a project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<Object[]>} - List of weapons
 */
async function getWeapons(projectPath) {
  const weapons = await loadDataFile(projectPath, FileTypes.WEAPONS);
  return weapons.filter(weapon => weapon); // Skip null entries
}

/**
 * Get all armors in a project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<Object[]>} - List of armors
 */
async function getArmors(projectPath) {
  const armors = await loadDataFile(projectPath, FileTypes.ARMORS);
  return armors.filter(armor => armor); // Skip null entries
}

/**
 * Get all enemies in a project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<Object[]>} - List of enemies
 */
async function getEnemies(projectPath) {
  const enemies = await loadDataFile(projectPath, FileTypes.ENEMIES);
  return enemies.filter(enemy => enemy); // Skip null entries
}

/**
 * Get all troops in a project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<Object[]>} - List of troops
 */
async function getTroops(projectPath) {
  const troops = await loadDataFile(projectPath, FileTypes.TROOPS);
  return troops.filter(troop => troop); // Skip null entries
}

/**
 * Get all states in a project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<Object[]>} - List of states
 */
async function getStates(projectPath) {
  const states = await loadDataFile(projectPath, FileTypes.STATES);
  return states.filter(state => state); // Skip null entries
}

/**
 * Get all animations in a project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<Object[]>} - List of animations
 */
async function getAnimations(projectPath) {
  const animations = await loadDataFile(projectPath, FileTypes.ANIMATIONS);
  return animations.filter(animation => animation); // Skip null entries
}

/**
 * Get all tilesets in a project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<Object[]>} - List of tilesets
 */
async function getTilesets(projectPath) {
  const tilesets = await loadDataFile(projectPath, FileTypes.TILESETS);
  return tilesets.filter(tileset => tileset); // Skip null entries
}

/**
 * Get all common events in a project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<Object[]>} - List of common events
 */
async function getCommonEvents(projectPath) {
  const commonEvents = await loadDataFile(projectPath, FileTypes.COMMON_EVENTS);
  return commonEvents.filter(event => event); // Skip null entries
}

/**
 * Get the system data for a project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<Object>} - System data
 */
async function getSystemData(projectPath) {
  return loadDataFile(projectPath, FileTypes.SYSTEM);
}

/**
 * Check if a project is a valid RPG Maker MV project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<boolean>} - Whether the project is valid
 */
async function isValidProject(projectPath) {
  try {
    // Check if the data directory exists
    const dataPath = path.join(projectPath, 'data');
    const dataExists = await fs.pathExists(dataPath);
    if (!dataExists) {
      return false;
    }
    
    // Check if essential files exist
    const systemPath = path.join(dataPath, FileTypes.SYSTEM);
    const systemExists = await fs.pathExists(systemPath);
    if (!systemExists) {
      return false;
    }
    
    // Check if the project has a valid package.json with RPG Maker MV dependencies
    const packagePath = path.join(projectPath, 'package.json');
    const packageExists = await fs.pathExists(packagePath);
    if (packageExists) {
      const packageJson = await fs.readJson(packagePath);
      const dependencies = packageJson.dependencies || {};
      if (dependencies['rpgmaker-mv'] || dependencies['rpgmakermv']) {
        return true;
      }
    }
    
    // Check if the project has an index.html file with RPG Maker MV content
    const indexPath = path.join(projectPath, 'index.html');
    const indexExists = await fs.pathExists(indexPath);
    if (indexExists) {
      const indexContent = await fs.readFile(indexPath, 'utf8');
      return indexContent.includes('rpgmaker') || indexContent.includes('rpg maker');
    }
    
    // If we got this far, it's probably a valid project
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get the plugin list for a project
 * @param {string} projectPath - Path to the project
 * @returns {Promise<Object[]>} - List of plugins
 */
async function getPlugins(projectPath) {
  try {
    const systemData = await getSystemData(projectPath);
    return systemData.plugins || [];
  } catch (error) {
    return [];
  }
}

/**
 * Get the plugin parameters for a specific plugin
 * @param {string} projectPath - Path to the project
 * @param {string} pluginName - Plugin name
 * @returns {Promise<Object>} - Plugin parameters
 */
async function getPluginParameters(projectPath, pluginName) {
  const plugins = await getPlugins(projectPath);
  const plugin = plugins.find(p => p.name === pluginName);
  if (!plugin) {
    return null;
  }
  
  try {
    return parseJson(plugin.parameters);
  } catch (error) {
    return plugin.parameters;
  }
}

/**
 * Check if a plugin is installed
 * @param {string} projectPath - Path to the project
 * @param {string} pluginName - Plugin name
 * @returns {Promise<boolean>} - Whether the plugin is installed
 */
async function hasPlugin(projectPath, pluginName) {
  const plugins = await getPlugins(projectPath);
  return plugins.some(p => p.name === pluginName);
}

module.exports = {
  FileTypes,
  getDataFilePath,
  loadDataFile,
  saveDataFile,
  getMapFilePath,
  loadMapFile,
  saveMapFile,
  getMapIds,
  getMapInfo,
  getActors,
  getClasses,
  getSkills,
  getItems,
  getWeapons,
  getArmors,
  getEnemies,
  getTroops,
  getStates,
  getAnimations,
  getTilesets,
  getCommonEvents,
  getSystemData,
  isValidProject,
  getPlugins,
  getPluginParameters,
  hasPlugin
};
