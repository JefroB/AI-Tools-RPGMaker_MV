/**
 * Actor Generator for RPG Maker MV
 * 
 * This module provides functionality for generating actor data for RPG Maker MV.
 * It uses the AI provider and stat generator to create balanced and coherent actor data.
 */

const aiProvider = require('./aiProvider');
const statGenerator = require('./statGenerator');
const schemaValidator = require('./schemaValidator');

/**
 * Generate an actor based on the provided parameters
 * @param {Object} params - Parameters for actor generation
 * @param {string} params.name - Name of the actor (optional, will be generated if not provided)
 * @param {string} params.nickname - Nickname of the actor (optional)
 * @param {number} params.classId - Class ID of the actor (optional, defaults to 1)
 * @param {number} params.initialLevel - Initial level of the actor (optional, defaults to 1)
 * @param {number} params.maxLevel - Maximum level of the actor (optional, defaults to 99)
 * @param {string} params.characterName - Character sprite name (optional)
 * @param {number} params.characterIndex - Character sprite index (optional)
 * @param {string} params.faceName - Face sprite name (optional)
 * @param {number} params.faceIndex - Face sprite index (optional)
 * @param {Array<number>} params.equips - Initial equipment (optional)
 * @param {string} params.profile - Character profile (optional)
 * @param {string} params.note - Note field (optional)
 * @param {Array<Object>} params.traits - Character traits (optional)
 * @param {Array<string>} params.characteristics - Descriptive characteristics (optional)
 * @param {string} params.description - High-level description of the actor (optional)
 * @param {Object} options - Additional options for generation
 * @returns {Promise<Object>} - Generated actor data
 */
const generate = async (params = {}, options = {}) => {
  // Get a template actor object
  const actor = schemaValidator.getTemplate('actor');
  
  // Set ID if provided, otherwise use the template default
  if (params.id !== undefined) {
    actor.id = params.id;
  }
  
  // Prepare characteristics array
  const characteristics = params.characteristics || [];
  if (params.description) {
    // If a description is provided, use AI to extract characteristics
    try {
      const extractedCharacteristics = await extractCharacteristicsFromDescription(params.description);
      characteristics.push(...extractedCharacteristics);
    } catch (error) {
      console.warn('Failed to extract characteristics from description:', error);
    }
  }
  
  // Generate name if not provided
  if (!params.name) {
    try {
      actor.name = await aiProvider.generateName({
        type: 'character',
        characteristics
      });
    } catch (error) {
      console.warn('Failed to generate name:', error);
      actor.name = `Actor ${actor.id}`;
    }
  } else {
    actor.name = params.name;
  }
  
  // Generate nickname if not provided
  if (!params.nickname) {
    try {
      const nicknameParams = {
        type: 'character nickname',
        name: actor.name,
        characteristics
      };
      const nickname = await aiProvider.generateContent(
        `Generate a short nickname for a character named "${actor.name}" with these traits: ${characteristics.join(', ')}`,
        { temperature: 0.8 }
      );
      actor.nickname = nickname.replace(/["'\n]/g, '').trim();
    } catch (error) {
      console.warn('Failed to generate nickname:', error);
      actor.nickname = '';
    }
  } else {
    actor.nickname = params.nickname;
  }
  
  // Set class ID
  actor.classId = params.classId || 1;
  
  // Set levels
  actor.initialLevel = params.initialLevel || 1;
  actor.maxLevel = params.maxLevel || 99;
  
  // Set character graphics
  actor.characterName = params.characterName || actor.characterName;
  actor.characterIndex = params.characterIndex !== undefined ? params.characterIndex : actor.characterIndex;
  actor.faceName = params.faceName || actor.faceName;
  actor.faceIndex = params.faceIndex !== undefined ? params.faceIndex : actor.faceIndex;
  
  // Set equipment
  if (params.equips) {
    actor.equips = params.equips;
  }
  
  // Generate profile if not provided
  if (!params.profile) {
    try {
      actor.profile = await aiProvider.generateDescription({
        type: 'character',
        name: actor.name,
        characteristics
      });
    } catch (error) {
      console.warn('Failed to generate profile:', error);
      actor.profile = '';
    }
  } else {
    actor.profile = params.profile;
  }
  
  // Set note field
  actor.note = params.note || '';
  
  // Set traits
  if (params.traits) {
    actor.traits = params.traits;
  }
  
  // Generate stats based on characteristics and level
  try {
    const stats = statGenerator.generateActorStats({
      level: actor.initialLevel,
      characteristics
    });
    
    // In RPG Maker MV, actor stats are defined in the Classes.json file,
    // not directly in the actor data. However, we can add this information
    // to the note field for reference.
    const statsNote = `<ActorStats>
HP: ${stats.hp}
MP: ${stats.mp}
ATK: ${stats.attack}
DEF: ${stats.defense}
MAT: ${stats.magicAttack}
MDF: ${stats.magicDefense}
AGI: ${stats.agility}
LUK: ${stats.luck}
</ActorStats>`;
    
    if (actor.note) {
      actor.note += '\n\n' + statsNote;
    } else {
      actor.note = statsNote;
    }
  } catch (error) {
    console.warn('Failed to generate stats:', error);
  }
  
  // Validate the generated actor
  const validationResult = schemaValidator.validate('actor', actor);
  if (!validationResult.success) {
    console.warn('Generated actor failed validation:', validationResult.errors);
    // Try to fix any validation issues
    const sanitizedActor = schemaValidator.sanitize('actor', actor);
    return sanitizedActor;
  }
  
  return actor;
};

/**
 * Extract characteristics from a description using AI
 * @param {string} description - Description to extract characteristics from
 * @returns {Promise<Array<string>>} - Extracted characteristics
 */
const extractCharacteristicsFromDescription = async (description) => {
  const prompt = `Extract key characteristics from this character description. Return only a JSON array of strings with no explanation.
  
Description: ${description}

Example output: ["brave", "intelligent", "fire-attuned", "noble"]`;

  try {
    const result = await aiProvider.generateContent(prompt, { temperature: 0.3 });
    return JSON.parse(result);
  } catch (error) {
    console.warn('Error extracting characteristics:', error);
    return [];
  }
};

module.exports = {
  generate
};
