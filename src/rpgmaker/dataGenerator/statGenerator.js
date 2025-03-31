/**
 * Stat Generator for RPG Maker MV Data
 * 
 * This module provides utilities for generating balanced stats for
 * RPG Maker MV data files. It includes functions for generating stats
 * for actors, enemies, items, weapons, and armor based on parameters
 * like level, difficulty, and game progression.
 */

// Default stat ranges for different entity types
const DEFAULT_STAT_RANGES = {
  actor: {
    hp: { base: 100, growthRate: 20, levelFactor: 1.5 },
    mp: { base: 30, growthRate: 5, levelFactor: 1.2 },
    attack: { base: 10, growthRate: 2, levelFactor: 1.1 },
    defense: { base: 10, growthRate: 2, levelFactor: 1.1 },
    magicAttack: { base: 10, growthRate: 2, levelFactor: 1.1 },
    magicDefense: { base: 10, growthRate: 2, levelFactor: 1.1 },
    agility: { base: 10, growthRate: 1, levelFactor: 1.05 },
    luck: { base: 10, growthRate: 1, levelFactor: 1.05 }
  },
  enemy: {
    hp: { base: 50, growthRate: 15, levelFactor: 1.4 },
    mp: { base: 20, growthRate: 4, levelFactor: 1.1 },
    attack: { base: 8, growthRate: 1.5, levelFactor: 1.1 },
    defense: { base: 8, growthRate: 1.5, levelFactor: 1.1 },
    magicAttack: { base: 8, growthRate: 1.5, levelFactor: 1.1 },
    magicDefense: { base: 8, growthRate: 1.5, levelFactor: 1.1 },
    agility: { base: 8, growthRate: 1, levelFactor: 1.05 },
    luck: { base: 8, growthRate: 1, levelFactor: 1.05 }
  },
  weapon: {
    attack: { base: 5, growthRate: 3, levelFactor: 1.2 },
    magicAttack: { base: 0, growthRate: 0, levelFactor: 1.0 },
    price: { base: 100, growthRate: 100, levelFactor: 1.5 }
  },
  armor: {
    defense: { base: 3, growthRate: 2, levelFactor: 1.2 },
    magicDefense: { base: 1, growthRate: 1, levelFactor: 1.1 },
    price: { base: 80, growthRate: 80, levelFactor: 1.5 }
  },
  item: {
    price: { base: 50, growthRate: 25, levelFactor: 1.3 },
    effectValue: { base: 30, growthRate: 10, levelFactor: 1.2 }
  },
  skill: {
    mpCost: { base: 5, growthRate: 2, levelFactor: 1.1 },
    tpCost: { base: 10, growthRate: 5, levelFactor: 1.1 },
    power: { base: 10, growthRate: 5, levelFactor: 1.2 }
  }
};

// Stat modifiers based on characteristics
const CHARACTERISTIC_MODIFIERS = {
  // Actor/Enemy role modifiers
  'warrior': { hp: 1.2, mp: 0.8, attack: 1.3, defense: 1.2, magicAttack: 0.7, magicDefense: 0.8 },
  'mage': { hp: 0.8, mp: 1.3, attack: 0.7, defense: 0.8, magicAttack: 1.3, magicDefense: 1.2 },
  'healer': { hp: 0.9, mp: 1.2, attack: 0.6, defense: 0.9, magicAttack: 1.0, magicDefense: 1.3 },
  'rogue': { hp: 0.9, mp: 0.9, attack: 1.1, defense: 0.8, magicAttack: 0.8, magicDefense: 0.8, agility: 1.4 },
  'tank': { hp: 1.5, mp: 0.7, attack: 0.9, defense: 1.5, magicAttack: 0.6, magicDefense: 1.0 },
  
  // Element modifiers
  'fire': { attack: 1.1, magicAttack: 1.2, defense: 0.9 },
  'ice': { defense: 1.1, magicDefense: 1.1, agility: 0.9 },
  'lightning': { attack: 1.0, magicAttack: 1.1, agility: 1.2 },
  'earth': { hp: 1.2, defense: 1.2, agility: 0.8 },
  'water': { mp: 1.1, magicDefense: 1.2 },
  'wind': { agility: 1.3, luck: 1.1 },
  'light': { mp: 1.2, magicAttack: 1.1, magicDefense: 1.1 },
  'dark': { attack: 1.2, magicAttack: 1.2, defense: 0.9, magicDefense: 0.9 },
  
  // Rarity modifiers
  'common': { price: 0.8 },
  'uncommon': { price: 1.0 },
  'rare': { price: 1.5 },
  'epic': { price: 2.5 },
  'legendary': { price: 5.0 },
  
  // Size modifiers
  'small': { hp: 0.8, attack: 0.9, defense: 0.9, agility: 1.2 },
  'medium': { hp: 1.0, attack: 1.0, defense: 1.0, agility: 1.0 },
  'large': { hp: 1.3, attack: 1.2, defense: 1.1, agility: 0.8 },
  
  // Material modifiers (for weapons/armor)
  'wood': { attack: 0.8, defense: 0.7, price: 0.5 },
  'iron': { attack: 1.0, defense: 1.0, price: 1.0 },
  'steel': { attack: 1.2, defense: 1.2, price: 1.5 },
  'silver': { attack: 1.0, magicAttack: 1.2, price: 2.0 },
  'gold': { defense: 0.8, magicDefense: 1.1, price: 3.0 },
  'mithril': { attack: 1.3, defense: 1.3, price: 4.0 },
  'adamantite': { attack: 1.5, defense: 1.5, price: 5.0 },
  
  // Effect modifiers (for items/skills)
  'healing': { effectValue: 1.0, mpCost: 1.0 },
  'damage': { effectValue: 1.2, mpCost: 1.2 },
  'buff': { effectValue: 0.8, mpCost: 0.9 },
  'debuff': { effectValue: 0.8, mpCost: 0.9 },
  'status': { effectValue: 0.7, mpCost: 1.1 }
};

// Game balance configuration
let balanceConfig = {
  // Difficulty multiplier (higher = harder)
  difficulty: 1.0,
  // Level scaling factor (higher = faster stat growth)
  levelScaling: 1.0,
  // Price scaling factor (higher = more expensive items)
  priceScaling: 1.0,
  // Random variation percentage (0.0 - 1.0)
  randomVariation: 0.1
};

/**
 * Configure the stat generator
 * @param {Object} config - Configuration options
 */
const configure = (config) => {
  balanceConfig = { ...balanceConfig, ...config };
};

/**
 * Calculate a stat value based on parameters
 * @param {string} entityType - Type of entity (actor, enemy, weapon, etc.)
 * @param {string} statName - Name of the stat
 * @param {number} level - Level of the entity
 * @param {Array<string>} characteristics - Characteristics of the entity
 * @returns {number} - The calculated stat value
 */
const calculateStat = (entityType, statName, level = 1, characteristics = []) => {
  // Get the stat range for this entity type and stat
  const statRange = DEFAULT_STAT_RANGES[entityType]?.[statName];
  if (!statRange) {
    return 0; // Stat not applicable for this entity type
  }
  
  // Calculate base value based on level
  const baseValue = statRange.base + 
                   (statRange.growthRate * Math.pow(level, statRange.levelFactor)) * 
                   balanceConfig.levelScaling;
  
  // Apply characteristic modifiers
  let modifierTotal = 1.0;
  characteristics.forEach(characteristic => {
    const lowerChar = characteristic.toLowerCase();
    if (CHARACTERISTIC_MODIFIERS[lowerChar] && CHARACTERISTIC_MODIFIERS[lowerChar][statName]) {
      modifierTotal *= CHARACTERISTIC_MODIFIERS[lowerChar][statName];
    }
  });
  
  // Apply difficulty modifier
  let difficultyMod = 1.0;
  if (entityType === 'enemy') {
    difficultyMod = balanceConfig.difficulty;
  } else if (entityType === 'actor') {
    difficultyMod = 2 - balanceConfig.difficulty; // Inverse for actors (higher difficulty = weaker actors)
  }
  
  // Apply price scaling for price stats
  let priceScaling = 1.0;
  if (statName === 'price') {
    priceScaling = balanceConfig.priceScaling;
  }
  
  // Calculate final value with random variation
  const variation = 1.0 + (Math.random() * 2 - 1) * balanceConfig.randomVariation;
  const finalValue = baseValue * modifierTotal * difficultyMod * priceScaling * variation;
  
  // Round to appropriate precision based on stat type
  if (['hp', 'mp', 'price', 'exp', 'gold'].includes(statName)) {
    return Math.max(1, Math.round(finalValue)); // Integer, minimum 1
  } else if (['effectValue', 'power'].includes(statName)) {
    return Math.max(1, Math.round(finalValue)); // Integer, minimum 1
  } else {
    return Math.max(1, Math.round(finalValue * 10) / 10); // One decimal place, minimum 1
  }
};

/**
 * Generate stats for an actor
 * @param {Object} params - Parameters for stat generation
 * @returns {Object} - Generated stats
 */
const generateActorStats = (params) => {
  const level = params.level || 1;
  const characteristics = params.characteristics || [];
  
  return {
    hp: calculateStat('actor', 'hp', level, characteristics),
    mp: calculateStat('actor', 'mp', level, characteristics),
    attack: calculateStat('actor', 'attack', level, characteristics),
    defense: calculateStat('actor', 'defense', level, characteristics),
    magicAttack: calculateStat('actor', 'magicAttack', level, characteristics),
    magicDefense: calculateStat('actor', 'magicDefense', level, characteristics),
    agility: calculateStat('actor', 'agility', level, characteristics),
    luck: calculateStat('actor', 'luck', level, characteristics)
  };
};

/**
 * Generate stats for an enemy
 * @param {Object} params - Parameters for stat generation
 * @returns {Object} - Generated stats
 */
const generateEnemyStats = (params) => {
  const level = params.level || 1;
  const characteristics = params.characteristics || [];
  
  return {
    hp: calculateStat('enemy', 'hp', level, characteristics),
    mp: calculateStat('enemy', 'mp', level, characteristics),
    attack: calculateStat('enemy', 'attack', level, characteristics),
    defense: calculateStat('enemy', 'defense', level, characteristics),
    magicAttack: calculateStat('enemy', 'magicAttack', level, characteristics),
    magicDefense: calculateStat('enemy', 'magicDefense', level, characteristics),
    agility: calculateStat('enemy', 'agility', level, characteristics),
    luck: calculateStat('enemy', 'luck', level, characteristics),
    exp: Math.round(10 * Math.pow(level, 1.5) * balanceConfig.difficulty),
    gold: Math.round(5 * Math.pow(level, 1.3) * balanceConfig.priceScaling)
  };
};

/**
 * Generate stats for a weapon
 * @param {Object} params - Parameters for stat generation
 * @returns {Object} - Generated stats
 */
const generateWeaponStats = (params) => {
  const level = params.level || 1;
  const characteristics = params.characteristics || [];
  
  return {
    params: [
      0, // MHP
      0, // MMP
      calculateStat('weapon', 'attack', level, characteristics), // ATK
      0, // DEF
      calculateStat('weapon', 'magicAttack', level, characteristics), // MAT
      0, // MDF
      0, // AGI
      0  // LUK
    ],
    price: calculateStat('weapon', 'price', level, characteristics)
  };
};

/**
 * Generate stats for armor
 * @param {Object} params - Parameters for stat generation
 * @returns {Object} - Generated stats
 */
const generateArmorStats = (params) => {
  const level = params.level || 1;
  const characteristics = params.characteristics || [];
  
  return {
    params: [
      0, // MHP
      0, // MMP
      0, // ATK
      calculateStat('armor', 'defense', level, characteristics), // DEF
      0, // MAT
      calculateStat('armor', 'magicDefense', level, characteristics), // MDF
      0, // AGI
      0  // LUK
    ],
    price: calculateStat('armor', 'price', level, characteristics)
  };
};

/**
 * Generate stats for an item
 * @param {Object} params - Parameters for stat generation
 * @returns {Object} - Generated stats
 */
const generateItemStats = (params) => {
  const level = params.level || 1;
  const characteristics = params.characteristics || [];
  
  return {
    price: calculateStat('item', 'price', level, characteristics),
    effectValue: calculateStat('item', 'effectValue', level, characteristics)
  };
};

/**
 * Generate stats for a skill
 * @param {Object} params - Parameters for stat generation
 * @returns {Object} - Generated stats
 */
const generateSkillStats = (params) => {
  const level = params.level || 1;
  const characteristics = params.characteristics || [];
  
  return {
    mpCost: calculateStat('skill', 'mpCost', level, characteristics),
    tpCost: calculateStat('skill', 'tpCost', level, characteristics),
    power: calculateStat('skill', 'power', level, characteristics)
  };
};

/**
 * Generate a damage formula for a skill
 * @param {Object} params - Parameters for formula generation
 * @returns {string} - The generated damage formula
 */
const generateDamageFormula = (params) => {
  const power = params.power || 100;
  const type = params.type || 'physical';
  const element = params.element || 'none';
  const target = params.target || 'single';
  
  let formula = '';
  
  if (type === 'physical') {
    formula = `a.atk * ${power / 100} - b.def * 2`;
  } else if (type === 'magical') {
    formula = `a.mat * ${power / 100} - b.mdf * 2`;
  } else if (type === 'healing') {
    formula = `a.mat * ${power / 100} + a.mdf * 0.5`;
  } else if (type === 'drain') {
    formula = `(a.atk * ${power / 100} - b.def) * 0.5`;
  } else {
    formula = `${power}`;
  }
  
  // Add element and target modifiers
  if (element !== 'none') {
    formula = `(${formula}) * b.elementRate(${element.toUpperCase()}_ELEMENT_ID)`;
  }
  
  if (target === 'all') {
    formula = `(${formula}) * 0.7`;
  }
  
  return formula;
};

module.exports = {
  configure,
  calculateStat,
  generateActorStats,
  generateEnemyStats,
  generateWeaponStats,
  generateArmorStats,
  generateItemStats,
  generateSkillStats,
  generateDamageFormula
};
