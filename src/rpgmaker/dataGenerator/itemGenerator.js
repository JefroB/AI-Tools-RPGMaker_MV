/**
 * Item Generator for RPG Maker MV
 * 
 * This module provides functionality for generating item data for RPG Maker MV.
 * It uses the AI provider and stat generator to create balanced and coherent item data.
 */

const aiProvider = require('./aiProvider');
const statGenerator = require('./statGenerator');
const schemaValidator = require('./schemaValidator');

/**
 * Generate an item based on the provided parameters
 * @param {Object} params - Parameters for item generation
 * @param {number} params.id - ID of the item (optional, will use template default if not provided)
 * @param {string} params.name - Name of the item (optional, will be generated if not provided)
 * @param {number} params.iconIndex - Icon index of the item (optional)
 * @param {string} params.description - Description of the item (optional, will be generated if not provided)
 * @param {Array<Object>} params.effects - Effects of the item (optional)
 * @param {number} params.price - Price of the item (optional, will be generated if not provided)
 * @param {boolean} params.consumable - Whether the item is consumable (optional, defaults to true)
 * @param {number} params.itypeId - Item type ID (optional, defaults to 1)
 * @param {string} params.note - Note field (optional)
 * @param {Array<string>} params.characteristics - Descriptive characteristics (optional)
 * @param {string} params.itemType - Type of item (e.g., 'healing', 'buff', 'key') (optional)
 * @param {number} params.level - Level/tier of the item (optional, defaults to 1)
 * @param {Object} options - Additional options for generation
 * @returns {Promise<Object>} - Generated item data
 */
const generate = async (params = {}, options = {}) => {
  // Get a template item object
  const item = schemaValidator.getTemplate('item');
  
  // Set ID if provided, otherwise use the template default
  if (params.id !== undefined) {
    item.id = params.id;
  }
  
  // Prepare characteristics array
  const characteristics = params.characteristics || [];
  if (params.itemType) {
    characteristics.push(params.itemType);
  }
  
  // Add rarity if specified
  if (params.rarity) {
    characteristics.push(params.rarity);
  }
  
  // Generate name if not provided
  if (!params.name) {
    try {
      item.name = await aiProvider.generateName({
        type: 'item',
        characteristics
      });
    } catch (error) {
      console.warn('Failed to generate name:', error);
      item.name = `Item ${item.id}`;
    }
  } else {
    item.name = params.name;
  }
  
  // Set icon index
  if (params.iconIndex !== undefined) {
    item.iconIndex = params.iconIndex;
  } else {
    // In a real implementation, we would select an appropriate icon based on item type
    // For now, we'll just use a default
    item.iconIndex = getDefaultIconIndex(params.itemType);
  }
  
  // Generate description if not provided
  if (!params.description) {
    try {
      item.description = await aiProvider.generateDescription({
        type: 'item',
        name: item.name,
        characteristics
      });
    } catch (error) {
      console.warn('Failed to generate description:', error);
      item.description = '';
    }
  } else {
    item.description = params.description;
  }
  
  // Set effects
  if (params.effects) {
    item.effects = params.effects;
  } else {
    // Generate default effects based on item type
    item.effects = generateDefaultEffects(params.itemType, params.level || 1);
  }
  
  // Generate price if not provided
  if (params.price === undefined) {
    try {
      const stats = statGenerator.generateItemStats({
        level: params.level || 1,
        characteristics
      });
      item.price = stats.price;
    } catch (error) {
      console.warn('Failed to generate price:', error);
      // Use a default price based on level
      item.price = 50 * (params.level || 1);
    }
  } else {
    item.price = params.price;
  }
  
  // Set consumable flag
  item.consumable = params.consumable !== undefined ? params.consumable : true;
  
  // Set item type ID
  item.itypeId = params.itypeId || 1;
  
  // Set note field
  item.note = params.note || '';
  
  // Add effect information to note field
  if (item.effects.length > 0) {
    const effectsNote = generateEffectsNote(item.effects, params.level || 1);
    if (item.note) {
      item.note += '\n\n' + effectsNote;
    } else {
      item.note = effectsNote;
    }
  }
  
  // Validate the generated item
  const validationResult = schemaValidator.validate('item', item);
  if (!validationResult.success) {
    console.warn('Generated item failed validation:', validationResult.errors);
    // Try to fix any validation issues
    const sanitizedItem = schemaValidator.sanitize('item', item);
    return sanitizedItem;
  }
  
  return item;
};

/**
 * Get a default icon index based on item type
 * @param {string} itemType - Type of item
 * @returns {number} - Icon index
 */
const getDefaultIconIndex = (itemType) => {
  // These would be actual icon indices from RPG Maker MV
  // For now, we'll just use some placeholder values
  switch (itemType) {
    case 'healing':
      return 176; // Potion icon
    case 'buff':
      return 64; // Power up icon
    case 'key':
      return 193; // Key icon
    case 'weapon':
      return 97; // Sword icon
    case 'armor':
      return 128; // Shield icon
    default:
      return 160; // Generic item icon
  }
};

/**
 * Generate default effects based on item type
 * @param {string} itemType - Type of item
 * @param {number} level - Level/tier of the item
 * @returns {Array<Object>} - Generated effects
 */
const generateDefaultEffects = (itemType, level) => {
  const effects = [];
  
  switch (itemType) {
    case 'healing':
      // HP recovery effect
      effects.push({
        code: 11, // HP Recovery
        dataId: 0,
        value1: 0, // Fixed value
        value2: Math.min(1, 0.3 + (level * 0.05)) // % of MaxHP (30% + 5% per level, max 100%)
      });
      break;
    case 'mp_recovery':
      // MP recovery effect
      effects.push({
        code: 12, // MP Recovery
        dataId: 0,
        value1: 0, // Fixed value
        value2: Math.min(1, 0.2 + (level * 0.04)) // % of MaxMP (20% + 4% per level, max 100%)
      });
      break;
    case 'buff':
      // Parameter buff effect
      effects.push({
        code: 31, // Buff Parameter
        dataId: 2, // ATK
        value1: 2, // Turns
        value2: 0
      });
      break;
    case 'debuff':
      // Parameter debuff effect
      effects.push({
        code: 32, // Debuff Parameter
        dataId: 3, // DEF
        value1: 2, // Turns
        value2: 0
      });
      break;
    case 'status_recovery':
      // Remove state effect
      effects.push({
        code: 22, // Remove State
        dataId: 4, // Poison (example)
        value1: 1, // 100% chance
        value2: 0
      });
      break;
    case 'key':
      // No gameplay effects for key items
      break;
    default:
      // Default to a small HP recovery
      effects.push({
        code: 11, // HP Recovery
        dataId: 0,
        value1: 0,
        value2: 0.1 // 10% of MaxHP
      });
  }
  
  return effects;
};

/**
 * Generate a note field describing the item's effects
 * @param {Array<Object>} effects - Item effects
 * @param {number} level - Item level
 * @returns {string} - Note field text
 */
const generateEffectsNote = (effects, level) => {
  let note = '<ItemEffects>\n';
  
  effects.forEach(effect => {
    switch (effect.code) {
      case 11: // HP Recovery
        if (effect.value1 > 0) {
          note += `Recovers ${effect.value1} HP\n`;
        }
        if (effect.value2 > 0) {
          note += `Recovers ${Math.round(effect.value2 * 100)}% of max HP\n`;
        }
        break;
      case 12: // MP Recovery
        if (effect.value1 > 0) {
          note += `Recovers ${effect.value1} MP\n`;
        }
        if (effect.value2 > 0) {
          note += `Recovers ${Math.round(effect.value2 * 100)}% of max MP\n`;
        }
        break;
      case 22: // Remove State
        note += `Removes status effect #${effect.dataId}\n`;
        break;
      case 31: // Buff Parameter
        const buffParams = ['MaxHP', 'MaxMP', 'ATK', 'DEF', 'MAT', 'MDF', 'AGI', 'LUK'];
        note += `Increases ${buffParams[effect.dataId]} for ${effect.value1} turns\n`;
        break;
      case 32: // Debuff Parameter
        const debuffParams = ['MaxHP', 'MaxMP', 'ATK', 'DEF', 'MAT', 'MDF', 'AGI', 'LUK'];
        note += `Decreases ${debuffParams[effect.dataId]} for ${effect.value1} turns\n`;
        break;
    }
  });
  
  note += '</ItemEffects>';
  return note;
};

module.exports = {
  generate
};
