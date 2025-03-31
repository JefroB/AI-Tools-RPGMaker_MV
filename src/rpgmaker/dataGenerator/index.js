/**
 * RPG Maker MV Data Generator
 * 
 * This module provides utilities for generating structured JSON data for RPG Maker MV projects.
 * It includes generators for various data types (Actors, Items, Skills, etc.) and ensures
 * the generated data follows the correct structure expected by RPG Maker MV.
 */

const actorGenerator = require('./actorGenerator');
const itemGenerator = require('./itemGenerator');
const skillGenerator = require('./skillGenerator');
const weaponGenerator = require('./weaponGenerator');
const armorGenerator = require('./armorGenerator');
const enemyGenerator = require('./enemyGenerator');
const schemaValidator = require('./schemaValidator');

/**
 * Generate a new actor with the specified parameters
 * @param {Object} params - Parameters for the actor
 * @returns {Object} - Generated actor object
 */
const generateActor = async (params) => {
  return await actorGenerator.generate(params);
};

/**
 * Generate a new item with the specified parameters
 * @param {Object} params - Parameters for the item
 * @returns {Object} - Generated item object
 */
const generateItem = async (params) => {
  return await itemGenerator.generate(params);
};

/**
 * Generate a new skill with the specified parameters
 * @param {Object} params - Parameters for the skill
 * @returns {Object} - Generated skill object
 */
const generateSkill = async (params) => {
  return await skillGenerator.generate(params);
};

/**
 * Generate a new weapon with the specified parameters
 * @param {Object} params - Parameters for the weapon
 * @returns {Object} - Generated weapon object
 */
const generateWeapon = async (params) => {
  return await weaponGenerator.generate(params);
};

/**
 * Generate a new armor with the specified parameters
 * @param {Object} params - Parameters for the armor
 * @returns {Object} - Generated armor object
 */
const generateArmor = async (params) => {
  return await armorGenerator.generate(params);
};

/**
 * Generate a new enemy with the specified parameters
 * @param {Object} params - Parameters for the enemy
 * @returns {Object} - Generated enemy object
 */
const generateEnemy = async (params) => {
  return await enemyGenerator.generate(params);
};

/**
 * Validate data against RPG Maker MV schemas
 * @param {string} type - Type of data to validate (actor, item, skill, etc.)
 * @param {Object} data - Data to validate
 * @returns {Object} - Validation result
 */
const validateData = (type, data) => {
  return schemaValidator.validate(type, data);
};

/**
 * Generate a complete set of related data (actor with equipment, skills, etc.)
 * @param {Object} params - Parameters for the data set
 * @returns {Object} - Generated data set
 */
const generateRelatedData = async (params) => {
  const result = {
    actor: null,
    equipment: [],
    skills: []
  };

  // Generate actor
  if (params.actor) {
    result.actor = await generateActor(params.actor);
  }

  // Generate equipment
  if (params.equipment) {
    for (const equipParams of params.equipment) {
      if (equipParams.type === 'weapon') {
        result.equipment.push(await generateWeapon(equipParams));
      } else if (equipParams.type === 'armor') {
        result.equipment.push(await generateArmor(equipParams));
      }
    }
  }

  // Generate skills
  if (params.skills) {
    for (const skillParams of params.skills) {
      result.skills.push(await generateSkill(skillParams));
    }
  }

  return result;
};

module.exports = {
  generateActor,
  generateItem,
  generateSkill,
  generateWeapon,
  generateArmor,
  generateEnemy,
  generateRelatedData,
  validateData
};
