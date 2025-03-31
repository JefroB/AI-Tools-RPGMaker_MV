/**
 * Contextual Summarizer for RPG Maker MV
 * 
 * This module generates human-readable summaries of RPG Maker MV game data,
 * providing high-level overviews of narrative, world, characters, and game systems.
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * Generate contextual summaries from an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {Object} contextData - Previously extracted context data
 * @returns {Promise<Object>} - Generated contextual summaries
 */
async function generateSummaries(projectPath, contextData) {
  // Initialize summaries structure
  const summaries = {
    gameOverview: '',
    narrative: '',
    world: '',
    characters: '',
    gameSystems: '',
    keyLocations: [],
    mainCharacters: [],
    questSummaries: []
  };

  try {
    // Generate game overview
    summaries.gameOverview = generateGameOverview(contextData);
    
    // Generate narrative summary
    if (contextData.narrative) {
      summaries.narrative = generateNarrativeSummary(contextData.narrative);
      summaries.questSummaries = generateQuestSummaries(contextData.narrative);
    }
    
    // Generate world summary
    if (contextData.world) {
      summaries.world = generateWorldSummary(contextData.world);
      summaries.keyLocations = generateKeyLocationSummaries(contextData.world);
    }
    
    // Generate character summary
    if (contextData.characters) {
      summaries.characters = generateCharacterSummary(contextData.characters);
      summaries.mainCharacters = generateMainCharacterSummaries(contextData.characters);
    }
    
    // Generate game systems summary
    if (contextData.gameSystems) {
      summaries.gameSystems = generateGameSystemsSummary(contextData.gameSystems);
    }
    
    return summaries;
  } catch (error) {
    throw new Error(`Error generating summaries: ${error.message}`);
  }
}

/**
 * Generate a game overview summary
 * @param {Object} contextData - Context data
 * @returns {string} - Game overview summary
 */
function generateGameOverview(contextData) {
  const projectName = contextData.projectName || 'Untitled RPG Maker MV Project';
  
  let overview = `# ${projectName}\n\n`;
  
  // Add game description
  overview += `## Game Overview\n\n`;
  
  if (contextData.narrative && contextData.narrative.title) {
    overview += `${contextData.narrative.title} is `;
  } else {
    overview += `This is `;
  }
  
  overview += `an RPG Maker MV game `;
  
  // Add genre based on game systems
  if (contextData.gameSystems && contextData.gameSystems.combat) {
    const battleSystem = contextData.gameSystems.combat.battleSystem;
    if (battleSystem.includes('Side View')) {
      overview += `featuring a side-view battle system `;
    } else if (battleSystem.includes('Front View')) {
      overview += `featuring a front-view battle system `;
    }
  }
  
  // Add world information
  if (contextData.world && contextData.world.regions && contextData.world.regions.length > 0) {
    overview += `set in a world with ${contextData.world.regions.length} major regions. `;
  } else {
    overview += `with a rich world to explore. `;
  }
  
  // Add character information
  if (contextData.characters && contextData.characters.protagonists) {
    const protagonistCount = contextData.characters.protagonists.length;
    if (protagonistCount === 1) {
      const protagonist = contextData.characters.protagonists[0];
      overview += `The player controls ${protagonist.name}, `;
    } else if (protagonistCount > 1) {
      overview += `The player controls a party of ${protagonistCount} characters, `;
    }
  }
  
  // Add quest information
  if (contextData.narrative && contextData.narrative.mainStory && contextData.narrative.mainStory.mainQuests) {
    const questCount = contextData.narrative.mainStory.mainQuests.length;
    if (questCount > 0) {
      overview += `and can undertake ${questCount} quests throughout the adventure.`;
    } else {
      overview += `and embarks on an epic adventure.`;
    }
  } else {
    overview += `and embarks on an epic adventure.`;
  }
  
  // Add game systems information
  if (contextData.gameSystems && contextData.gameSystems.customSystems && contextData.gameSystems.customSystems.length > 0) {
    overview += `\n\nThe game features ${contextData.gameSystems.customSystems.length} custom gameplay systems `;
    overview += `that enhance the RPG Maker MV experience.`;
  }
  
  return overview;
}

/**
 * Generate a narrative summary
 * @param {Object} narrative - Narrative data
 * @returns {string} - Narrative summary
 */
function generateNarrativeSummary(narrative) {
  let summary = `## Narrative Summary\n\n`;
  
  // Add story arcs
  if (narrative.storyArcs && narrative.storyArcs.length > 0) {
    const mainStoryArc = narrative.storyArcs.find(arc => arc.name === 'Main Story');
    
    if (mainStoryArc) {
      summary += `The main story revolves around `;
      
      if (mainStoryArc.quests && mainStoryArc.quests.length > 0) {
        const questNames = mainStoryArc.quests
          .filter(quest => quest.name)
          .map(quest => quest.name.replace(' Quest', '').replace(' Started', '').replace(' Complete', '').replace(' Ended', ''));
        
        if (questNames.length > 0) {
          const uniqueQuestNames = [...new Set(questNames)];
          summary += `a series of quests including ${uniqueQuestNames.slice(0, 3).join(', ')}`;
          
          if (uniqueQuestNames.length > 3) {
            summary += `, and more`;
          }
          
          summary += `. `;
        } else {
          summary += `an epic adventure. `;
        }
      } else {
        summary += `an epic adventure. `;
      }
    } else {
      summary += `The game features multiple story arcs. `;
    }
    
    // Add character-specific arcs
    const characterArcs = narrative.storyArcs.filter(arc => arc.name.includes("'s Story"));
    if (characterArcs.length > 0) {
      summary += `There are also character-specific storylines for `;
      summary += characterArcs.slice(0, 3).map(arc => arc.name.replace("'s Story", '')).join(', ');
      
      if (characterArcs.length > 3) {
        summary += `, and others`;
      }
      
      summary += `. `;
    }
  } else {
    summary += `The game features a rich narrative with multiple storylines. `;
  }
  
  // Add quest information
  if (narrative.mainStory && narrative.mainStory.mainQuests && narrative.mainStory.mainQuests.length > 0) {
    const questCount = narrative.mainStory.mainQuests.length;
    summary += `\n\nThere are ${questCount} main quests to complete throughout the game. `;
    
    // Categorize quests
    const startedQuests = narrative.mainStory.mainQuests.filter(quest => 
      quest.status === 'Started' || (quest.states && quest.states.some(state => state.status === 'Started'))
    );
    
    const completedQuests = narrative.mainStory.mainQuests.filter(quest => 
      quest.status === 'Complete' || (quest.states && quest.states.some(state => state.status === 'Complete'))
    );
    
    if (startedQuests.length > 0) {
      summary += `${startedQuests.length} quests are available to start. `;
    }
    
    if (completedQuests.length > 0) {
      summary += `${completedQuests.length} quests can be completed. `;
    }
  }
  
  // Add dialogue information
  if (narrative.dialogues) {
    const mapCount = Object.keys(narrative.dialogues).length;
    let dialogueCount = 0;
    
    Object.values(narrative.dialogues).forEach(mapDialogue => {
      dialogueCount += mapDialogue.dialogues.length;
    });
    
    if (dialogueCount > 0) {
      summary += `\n\nThe game contains ${dialogueCount} dialogue sequences across ${mapCount} different maps, `;
      summary += `creating a rich narrative experience.`;
    }
  }
  
  return summary;
}

/**
 * Generate quest summaries
 * @param {Object} narrative - Narrative data
 * @returns {Array} - Quest summaries
 */
function generateQuestSummaries(narrative) {
  const questSummaries = [];
  
  if (narrative.mainStory && narrative.mainStory.mainQuests) {
    narrative.mainStory.mainQuests.forEach(quest => {
      // Skip quests without a name
      if (!quest.name && !quest.baseName) return;
      
      const questName = quest.baseName || quest.name;
      const questStatus = quest.status || (quest.states && quest.states.length > 0 ? quest.states[0].status : 'Unknown');
      
      const summary = {
        name: questName.replace(' Quest', ''),
        status: questStatus,
        description: `Quest related to ${questName.replace(' Quest', '').replace(' Started', '').replace(' Complete', '').replace(' Ended', '')}`
      };
      
      // Add states if available
      if (quest.states && quest.states.length > 0) {
        summary.states = quest.states.map(state => ({
          status: state.status,
          id: state.id
        }));
      }
      
      questSummaries.push(summary);
    });
  }
  
  return questSummaries;
}

/**
 * Generate a world summary
 * @param {Object} world - World data
 * @returns {string} - World summary
 */
function generateWorldSummary(world) {
  let summary = `## World Summary\n\n`;
  
  // Add world name
  if (world.name) {
    summary += `The world of ${world.name} `;
  } else {
    summary += `The game world `;
  }
  
  // Add region information
  if (world.regions && world.regions.length > 0) {
    summary += `consists of ${world.regions.length} major regions: `;
    summary += world.regions.map(region => region.name).join(', ');
    summary += `. `;
    
    // Add subregion information
    const subregionCount = world.regions.reduce((count, region) => count + (region.subregions ? region.subregions.length : 0), 0);
    if (subregionCount > 0) {
      summary += `These regions are further divided into ${subregionCount} subregions. `;
    }
  } else {
    summary += `is a diverse landscape with many locations to explore. `;
  }
  
  // Add location information
  if (world.locations && world.locations.length > 0) {
    summary += `\n\nThere are ${world.locations.length} distinct locations in the game, `;
    
    // Categorize locations by type
    const locationTypes = {};
    world.locations.forEach(location => {
      const type = determineLocationType(location.name);
      locationTypes[type] = (locationTypes[type] || 0) + 1;
    });
    
    const typeEntries = Object.entries(locationTypes)
      .filter(([type, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
    
    if (typeEntries.length > 0) {
      summary += `including `;
      summary += typeEntries.slice(0, 3).map(([type, count]) => `${count} ${type.toLowerCase()}${count > 1 ? 's' : ''}`).join(', ');
      
      if (typeEntries.length > 3) {
        summary += `, and other areas`;
      }
      
      summary += `. `;
    }
  }
  
  // Add key areas information
  if (world.keyAreas && world.keyAreas.length > 0) {
    summary += `\n\nThe most important locations include `;
    summary += world.keyAreas.slice(0, 5).map(area => area.name).join(', ');
    
    if (world.keyAreas.length > 5) {
      summary += `, and others`;
    }
    
    summary += `.`;
  }
  
  // Add connection information
  if (world.mapConnections && world.mapConnections.length > 0) {
    const bidirectionalConnections = world.mapConnections.filter(conn => conn.bidirectional);
    const percentBidirectional = Math.round((bidirectionalConnections.length / world.mapConnections.length) * 100);
    
    summary += `\n\nThe world has ${world.mapConnections.length} connections between locations, `;
    summary += `with ${percentBidirectional}% being bidirectional paths.`;
  }
  
  return summary;
}

/**
 * Determine location type based on name
 * @param {string} name - Location name
 * @returns {string} - Location type
 */
function determineLocationType(name) {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('town') || lowerName.includes('city') || lowerName.includes('village')) {
    return 'Settlement';
  } else if (lowerName.includes('dungeon') || lowerName.includes('cave') || lowerName.includes('ruins')) {
    return 'Dungeon';
  } else if (lowerName.includes('castle') || lowerName.includes('fort') || lowerName.includes('tower')) {
    return 'Fortress';
  } else if (lowerName.includes('forest') || lowerName.includes('woods') || lowerName.includes('jungle')) {
    return 'Forest';
  } else if (lowerName.includes('mountain') || lowerName.includes('peak') || lowerName.includes('hill')) {
    return 'Mountain';
  } else if (lowerName.includes('lake') || lowerName.includes('river') || lowerName.includes('sea') || lowerName.includes('ocean')) {
    return 'Water';
  } else if (lowerName.includes('desert') || lowerName.includes('wasteland')) {
    return 'Desert';
  } else if (lowerName.includes('inn') || lowerName.includes('shop') || lowerName.includes('store')) {
    return 'Building';
  } else if (lowerName.includes('room') || lowerName.includes('chamber') || lowerName.includes('hall')) {
    return 'Interior';
  } else if (lowerName.includes('field') || lowerName.includes('plain') || lowerName.includes('meadow')) {
    return 'Field';
  } else if (lowerName.includes('road') || lowerName.includes('path') || lowerName.includes('route')) {
    return 'Road';
  } else {
    return 'Other';
  }
}

/**
 * Generate key location summaries
 * @param {Object} world - World data
 * @returns {Array} - Key location summaries
 */
function generateKeyLocationSummaries(world) {
  const locationSummaries = [];
  
  if (world.keyAreas && world.keyAreas.length > 0) {
    // Sort key areas by importance score
    const sortedKeyAreas = [...world.keyAreas].sort((a, b) => b.importanceScore - a.importanceScore);
    
    // Take top 10 key areas
    const topKeyAreas = sortedKeyAreas.slice(0, 10);
    
    topKeyAreas.forEach(area => {
      const location = world.locations.find(loc => loc.id === area.id);
      
      const summary = {
        id: area.id,
        name: area.name,
        type: area.type,
        importance: area.importanceScore,
        description: `A ${area.type.toLowerCase()} with ${area.eventCount} points of interest`
      };
      
      // Add connection information
      const connections = world.mapConnections.filter(conn => 
        conn.from.mapId === area.id || conn.to.mapId === area.id
      );
      
      if (connections.length > 0) {
        const connectedLocations = new Set();
        
        connections.forEach(conn => {
          if (conn.from.mapId === area.id) {
            connectedLocations.add(conn.to.mapName);
          } else {
            connectedLocations.add(conn.from.mapName);
          }
        });
        
        if (connectedLocations.size > 0) {
          summary.connections = Array.from(connectedLocations);
        }
      }
      
      // Add features if available
      if (location && location.features && location.features.length > 0) {
        summary.features = location.features.map(feature => feature.value);
      }
      
      locationSummaries.push(summary);
    });
  }
  
  return locationSummaries;
}

/**
 * Generate a character summary
 * @param {Object} characters - Character data
 * @returns {string} - Character summary
 */
function generateCharacterSummary(characters) {
  let summary = `## Character Summary\n\n`;
  
  // Add character count
  if (characters.characters && characters.characters.length > 0) {
    summary += `The game features ${characters.characters.length} characters. `;
    
    // Count protagonists
    const protagonistCount = characters.characters.filter(char => char.isProtagonist).length;
    if (protagonistCount > 0) {
      summary += `${protagonistCount} of these are playable protagonists. `;
    }
  } else {
    summary += `The game features a diverse cast of characters. `;
  }
  
  // Add antagonist information
  if (characters.antagonists && characters.antagonists.length > 0) {
    summary += `There are ${characters.antagonists.length} significant antagonists in the game. `;
    
    // Highlight significant antagonists
    const significantAntagonists = characters.antagonists.filter(ant => ant.isSignificant);
    if (significantAntagonists.length > 0) {
      summary += `The most notable antagonists include `;
      summary += significantAntagonists.slice(0, 3).map(ant => ant.name).join(', ');
      
      if (significantAntagonists.length > 3) {
        summary += `, and others`;
      }
      
      summary += `. `;
    }
  }
  
  // Add relationship information
  if (characters.relationships && characters.relationships.length > 0) {
    summary += `\n\nThere are ${characters.relationships.length} significant relationships between characters. `;
    
    // Categorize relationships by type
    const relationshipTypes = {};
    characters.relationships.forEach(rel => {
      relationshipTypes[rel.type] = (relationshipTypes[rel.type] || 0) + 1;
    });
    
    const typeEntries = Object.entries(relationshipTypes)
      .filter(([type, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
    
    if (typeEntries.length > 0) {
      summary += `These include `;
      summary += typeEntries.map(([type, count]) => `${count} ${type} relationships`).join(', ');
      summary += `. `;
    }
  }
  
  // Add group information
  if (characters.groups && characters.groups.length > 0) {
    summary += `\n\nCharacters are organized into ${characters.groups.length} distinct groups or factions. `;
    summary += `These include `;
    summary += characters.groups.slice(0, 3).map(group => group.name).join(', ');
    
    if (characters.groups.length > 3) {
      summary += `, and others`;
    }
    
    summary += `.`;
  }
  
  return summary;
}

/**
 * Generate main character summaries
 * @param {Object} characters - Character data
 * @returns {Array} - Main character summaries
 */
function generateMainCharacterSummaries(characters) {
  const characterSummaries = [];
  
  if (characters.characters && characters.characters.length > 0) {
    // Get protagonists
    const protagonists = characters.characters.filter(char => char.isProtagonist);
    
    // If no protagonists, take characters with most relationships
    const mainCharacters = protagonists.length > 0 ? protagonists : 
      [...characters.characters].sort((a, b) => (b.relationships && b.relationships.length ? b.relationships.length : 0) - (a.relationships && a.relationships.length ? a.relationships.length : 0)).slice(0, 5);
    
    mainCharacters.forEach(character => {
      const summary = {
        id: character.id,
        name: character.name,
        isProtagonist: character.isProtagonist,
        class: character.className,
        level: character.initialLevel,
        description: character.profile || `A ${character.className.toLowerCase()} character`
      };
      
      // Add relationship information
      if (character.relationships && character.relationships.length > 0) {
        summary.relationships = character.relationships.map(rel => ({
          character: rel.characterName,
          type: rel.type
        }));
      }
      
      characterSummaries.push(summary);
    });
    
    // Add some antagonists if available
    if (characters.antagonists && characters.antagonists.length > 0) {
      const significantAntagonists = characters.antagonists
        .filter(ant => ant.isSignificant)
        .slice(0, 3);
      
      significantAntagonists.forEach(antagonist => {
        characterSummaries.push({
          id: antagonist.id,
          name: antagonist.name,
          isAntagonist: true,
          description: antagonist.note || `A significant antagonist in the game`
        });
      });
    }
  }
  
  return characterSummaries;
}

/**
 * Generate a game systems summary
 * @param {Object} gameSystems - Game systems data
 * @returns {string} - Game systems summary
 */
function generateGameSystemsSummary(gameSystems) {
  let summary = `## Game Systems Summary\n\n`;
  
  // Add combat system information
  summary += `### Combat System\n\n`;
  
  if (gameSystems.combat) {
    summary += `The game uses a ${gameSystems.combat.battleSystem} battle system. `;
    
    // Add element information
    if (gameSystems.combat.elements && gameSystems.combat.elements.length > 0) {
      summary += `There are ${gameSystems.combat.elements.length} elements in the game: `;
      summary += gameSystems.combat.elements.map(elem => elem.name).join(', ');
      summary += `. `;
    }
    
    // Add skill information
    if (gameSystems.combat.skills && gameSystems.combat.skills.length > 0) {
      summary += `\n\nThe game features ${gameSystems.combat.skills.length} different skills. `;
      
      // Categorize skills by type
      if (gameSystems.combat.skillTypes) {
        const skillTypeEntries = Object.entries(gameSystems.combat.skillTypes)
          .filter(([type, skills]) => skills.length > 0)
          .sort((a, b) => b[1].length - a[1].length);
        
        if (skillTypeEntries.length > 0) {
          summary += `These include `;
          summary += skillTypeEntries.slice(0, 3).map(([type, skills]) => `${skills.length} ${type.toLowerCase()} skills`).join(', ');
          
          if (skillTypeEntries.length > 3) {
            summary += `, and others`;
          }
          
          summary += `. `;
        }
      }
    }
    
    // Add state information
    if (gameSystems.combat.states && gameSystems.combat.states.length > 0) {
      summary += `There are ${gameSystems.combat.states.length} status conditions that can affect characters in battle. `;
    }
    
    // Add enemy information
    if (gameSystems.combat.enemies && gameSystems.combat.enemies.length > 0) {
      summary += `\n\nThe game has ${gameSystems.combat.enemies.length} different enemies to battle. `;
    }
    
    // Add troop information
    if (gameSystems.combat.troops && gameSystems.combat.troops.length > 0) {
      summary += `These are organized into ${gameSystems.combat.troops.length} different enemy groups. `;
    }
    
    // Add mechanics information
    if (gameSystems.combat.mechanics && gameSystems.combat.mechanics.length > 0) {
      summary += `\n\nThe combat system includes mechanics such as `;
      summary += gameSystems.combat.mechanics.slice(0, 3).map(mech => mech.name).join(', ');
      
      if (gameSystems.combat.mechanics.length > 3) {
        summary += `, and others`;
      }
      
      summary += `.`;
    }
  } else {
    summary += `The game features a traditional RPG Maker MV battle system.`;
  }
  
  // Add progression system information
  summary += `\n\n### Progression System\n\n`;
  
  if (gameSystems.progression) {
    // Add class information
    if (gameSystems.progression.classes && gameSystems.progression.classes.length > 0) {
      summary += `The game has ${gameSystems.progression.classes.length} character classes. `;
    }
    
    // Add level system information
    if (gameSystems.progression.levelSystem && gameSystems.progression.levelSystem.type) {
      summary += `Character growth follows a ${gameSystems.progression.levelSystem.type.toLowerCase()} progression curve. `;
    }
    
    // Add skill progression information
    if (gameSystems.progression.skillProgression) {
      const classCount = Object.keys(gameSystems.progression.skillProgression).length;
      if (classCount > 0) {
        summary += `\n\nEach class has its own skill progression path, `;
        summary += `with skills learned at early, mid, and late levels.`;
      }
    }
  } else {
    summary += `Characters progress through a traditional level-up system.`;
  }
  
  // Add economy system information
  summary += `\n\n### Economy System\n\n`;
  
  if (gameSystems.economy) {
    // Add currency information
    if (gameSystems.economy.currency) {
      summary += `The game uses ${gameSystems.economy.currency} as its main currency. `;
    }
    
    // Add item information
    if (gameSystems.economy.items && gameSystems.economy.items.length > 0) {
      summary += `There are ${gameSystems.economy.items.length} different items in the game. `;
      
      // Categorize items by type
      if (gameSystems.economy.itemTypes) {
        const itemTypeEntries = Object.entries(gameSystems.economy.itemTypes)
          .filter(([type, items]) => items && items.length > 0)
          .sort((a, b) => b[1].length - a[1].length);
        
        if (itemTypeEntries.length > 0) {
          summary += `These include `;
          summary += itemTypeEntries.slice(0, 3).map(([type, items]) => `${items.length} ${type.toLowerCase()} items`).join(', ');
          
          if (itemTypeEntries.length > 3) {
            summary += `, and others`;
          }
          
          summary += `. `;
        }
      }
    }
    
    // Add shop information
    if (gameSystems.economy.shopItems && gameSystems.economy.shopItems.length > 0) {
      summary += `\n\nThere are ${gameSystems.economy.shopItems.length} items available for purchase in shops. `;
      
      // Analyze price range
      const prices = gameSystems.economy.shopItems.map(item => item.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      summary += `Prices range from ${minPrice} to ${maxPrice} ${gameSystems.economy.currency}, `;
      summary += `with an average price of ${Math.round(avgPrice)} ${gameSystems.economy.currency}.`;
    }
  } else {
    summary += `The game uses a traditional RPG economy system.`;
  }
  
  // Add equipment system information
  summary += `\n\n### Equipment System\n\n`;
  
  if (gameSystems.equipment) {
    // Add equipment type information
    if (gameSystems.equipment.types && gameSystems.equipment.types.length > 0) {
      const weaponTypes = gameSystems.equipment.types.filter(type => type.category === 'Weapon');
      const armorTypes = gameSystems.equipment.types.filter(type => type.category === 'Armor');
      
      if (weaponTypes.length > 0) {
        summary += `The game has ${weaponTypes.length} types of weapons, including `;
        summary += weaponTypes.slice(0, 3).map(type => type.name).join(', ');
        
        if (weaponTypes.length > 3) {
          summary += `, and others`;
        }
        
        summary += `. `;
      }
      
      if (armorTypes.length > 0) {
        summary += `There are ${armorTypes.length} types of armor, including `;
        summary += armorTypes.slice(0, 3).map(type => type.name).join(', ');
        
        if (armorTypes.length > 3) {
          summary += `, and others`;
        }
        
        summary += `. `;
      }
    }
    
    // Add weapon information
    if (gameSystems.equipment.weapons && gameSystems.equipment.weapons.length > 0) {
      summary += `\n\nThe game features ${gameSystems.equipment.weapons.length} different weapons. `;
    }
    
    // Add armor information
    if (gameSystems.equipment.armors && gameSystems.equipment.armors.length > 0) {
      summary += `There are ${gameSystems.equipment.armors.length} different pieces of armor. `;
    }
    
    // Add equipment slot information
    if (gameSystems.equipment.slots && gameSystems.equipment.slots.length > 0) {
      summary += `Characters have ${gameSystems.equipment.slots.length} equipment slots for customization.`;
    }
  } else {
    summary += `The game uses a traditional RPG equipment system.`;
  }
  
  // Add custom systems information
  if (gameSystems.customSystems && gameSystems.customSystems.length > 0) {
    summary += `\n\n### Custom Systems\n\n`;
    summary += `The game features ${gameSystems.customSystems.length} custom gameplay systems:\n\n`;
    
    gameSystems.customSystems.slice(0, 5).forEach(system => {
      summary += `- **${system.name}**: ${system.description}\n`;
    });
    
    if (gameSystems.customSystems.length > 5) {
      summary += `- *And ${gameSystems.customSystems.length - 5} more custom systems...*\n`;
    }
  }
  
  // Add balance analysis
  if (gameSystems.balance) {
    summary += `\n\n### Game Balance\n\n`;
    
    if (gameSystems.balance.difficulty) {
      summary += `The game has a ${gameSystems.balance.difficulty.toLowerCase()} difficulty level. `;
    }
    
    if (gameSystems.balance.progression) {
      summary += `Character progression follows a ${gameSystems.balance.progression.toLowerCase()} curve. `;
    }
    
    if (gameSystems.balance.economyBalance) {
      summary += `The economy is ${gameSystems.balance.economyBalance.toLowerCase()}. `;
    }
    
    if (gameSystems.balance.combatBalance) {
      summary += `Combat is ${gameSystems.balance.combatBalance.toLowerCase()}. `;
    }
    
    // Add detailed analysis
    if (gameSystems.balance.analysis && gameSystems.balance.analysis.length > 0) {
      summary += `\n\nDetailed balance analysis:\n\n`;
      
      gameSystems.balance.analysis.forEach(aspect => {
        summary += `- **${aspect.aspect}**: ${aspect.value} (${aspect.details})\n`;
      });
    }
  }
  
  return summary;
}

module.exports = {
  generateSummaries
};
