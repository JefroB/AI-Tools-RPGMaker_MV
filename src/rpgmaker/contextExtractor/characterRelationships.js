/**
 * Character Relationship Mapper for RPG Maker MV
 * 
 * This module analyzes character data and event interactions to map
 * relationships between characters in an RPG Maker MV game.
 */

const fs = require('fs-extra');
const path = require('path');
const { parseJson } = require('../../core');

/**
 * Map character relationships from an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @returns {Promise<Object>} - Mapped character relationships
 */
async function mapRelationships(projectPath) {
  const dataPath = path.join(projectPath, 'data');
  
  // Initialize character relationships structure
  const relationships = {
    characters: [],
    relationships: [],
    groups: [],
    protagonists: [],
    antagonists: [],
    networkGraph: null
  };

  try {
    // Extract character information from Actors.json
    const actorsPath = path.join(dataPath, 'Actors.json');
    if (await fs.pathExists(actorsPath)) {
      const actors = parseJson(await fs.readFile(actorsPath, 'utf8'));
      relationships.characters = extractCharacters(actors);
    }

    // Extract class information from Classes.json
    const classesPath = path.join(dataPath, 'Classes.json');
    if (await fs.pathExists(classesPath)) {
      const classes = parseJson(await fs.readFile(classesPath, 'utf8'));
      addClassInformation(relationships.characters, classes);
    }

    // Extract enemy information from Enemies.json
    const enemiesPath = path.join(dataPath, 'Enemies.json');
    if (await fs.pathExists(enemiesPath)) {
      const enemies = parseJson(await fs.readFile(enemiesPath, 'utf8'));
      relationships.antagonists = extractEnemies(enemies);
    }

    // Extract map information from MapInfos.json
    const mapInfosPath = path.join(dataPath, 'MapInfos.json');
    if (await fs.pathExists(mapInfosPath)) {
      const mapInfos = parseJson(await fs.readFile(mapInfosPath, 'utf8'));
      
      // Extract dialogues and interactions from map files
      await extractCharacterInteractions(dataPath, mapInfos, relationships);
    }

    // Extract common events for character interactions
    const commonEventsPath = path.join(dataPath, 'CommonEvents.json');
    if (await fs.pathExists(commonEventsPath)) {
      const commonEvents = parseJson(await fs.readFile(commonEventsPath, 'utf8'));
      extractCommonEventInteractions(commonEvents, relationships);
    }

    // Identify protagonists based on party members in System.json
    const systemPath = path.join(dataPath, 'System.json');
    if (await fs.pathExists(systemPath)) {
      const systemData = parseJson(await fs.readFile(systemPath, 'utf8'));
      identifyProtagonists(relationships, systemData);
    }

    // Analyze relationships to identify groups and hierarchies
    analyzeRelationships(relationships);

    // Generate network graph for visualization
    relationships.networkGraph = generateNetworkGraph(relationships);

    return relationships;
  } catch (error) {
    throw new Error(`Error mapping character relationships: ${error.message}`);
  }
}

/**
 * Extract character information from Actors.json
 * @param {Array} actors - Actors array
 * @returns {Array} - Extracted character information
 */
function extractCharacters(actors) {
  const characters = [];
  
  // Skip first element (null)
  for (let i = 1; i < actors.length; i++) {
    const actor = actors[i];
    if (!actor) continue;
    
    characters.push({
      id: actor.id,
      name: actor.name,
      nickname: actor.nickname || '',
      profile: actor.profile || '',
      initialLevel: actor.initialLevel,
      classId: actor.classId,
      className: '',  // Will be filled in later
      traits: actor.traits || [],
      isProtagonist: false,  // Will be determined later
      relationships: [],  // Will be filled in later
      mentionedWith: {},  // Character co-occurrence counts
      interactions: []  // Will be filled in later
    });
  }
  
  return characters;
}

/**
 * Add class information to characters
 * @param {Array} characters - Character array
 * @param {Array} classes - Classes array
 */
function addClassInformation(characters, classes) {
  // Skip first element (null)
  for (let i = 0; i < characters.length; i++) {
    const character = characters[i];
    const classId = character.classId;
    
    if (classId > 0 && classId < classes.length && classes[classId]) {
      character.className = classes[classId].name || '';
    }
  }
}

/**
 * Extract enemy information from Enemies.json
 * @param {Array} enemies - Enemies array
 * @returns {Array} - Extracted enemy information
 */
function extractEnemies(enemies) {
  const antagonists = [];
  
  // Skip first element (null)
  for (let i = 1; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (!enemy) continue;
    
    // Only include enemies that are likely to be significant characters
    // (based on having a name that's not generic)
    const name = enemy.name.toLowerCase();
    const isGeneric = name.includes('slime') || 
                      name.includes('bat') || 
                      name.includes('wolf') || 
                      name.includes('goblin') ||
                      name.includes('orc') ||
                      name.includes('skeleton') ||
                      name.includes('zombie');
    
    if (!isGeneric) {
      antagonists.push({
        id: enemy.id,
        name: enemy.name,
        battlerName: enemy.battlerName || '',
        note: enemy.note || '',
        params: enemy.params || [],
        exp: enemy.exp || 0,
        gold: enemy.gold || 0,
        isSignificant: enemy.exp > 100 || enemy.gold > 100  // Significant if high exp/gold
      });
    }
  }
  
  return antagonists;
}

/**
 * Extract character interactions from map files
 * @param {string} dataPath - Path to data directory
 * @param {Array} mapInfos - Map information array
 * @param {Object} relationships - Relationships object to populate
 */
async function extractCharacterInteractions(dataPath, mapInfos, relationships) {
  const characterMap = {};
  relationships.characters.forEach(character => {
    characterMap[character.name] = character;
  });
  
  const interactions = [];
  
  // Process each map
  for (let i = 1; i < mapInfos.length; i++) {
    const mapInfo = mapInfos[i];
    if (!mapInfo) continue;
    
    const mapPath = path.join(dataPath, `Map${mapInfo.id.toString().padStart(3, '0')}.json`);
    if (await fs.pathExists(mapPath)) {
      try {
        const mapData = parseJson(await fs.readFile(mapPath, 'utf8'));
        
        if (mapData.events) {
          // Process each event in the map
          for (let j = 0; j < mapData.events.length; j++) {
            const event = mapData.events[j];
            if (!event) continue;
            
            // Process event pages
            if (event.pages) {
              for (let k = 0; k < event.pages.length; k++) {
                const page = event.pages[k];
                if (!page || !page.list) continue;
                
                // Extract dialogues and interactions
                let currentSpeaker = null;
                const mentionedCharacters = new Set();
                
                for (let l = 0; l < page.list.length; l++) {
                  const command = page.list[l];
                  
                  // Message command (code 101)
                  if (command.code === 101) {
                    currentSpeaker = command.parameters[4] || '';
                    const text = command.parameters[0] || '';
                    
                    // Add current speaker to mentioned characters
                    if (currentSpeaker && currentSpeaker.trim() !== '') {
                      mentionedCharacters.add(currentSpeaker);
                    }
                    
                    // Check for character mentions in the text
                    relationships.characters.forEach(character => {
                      if (text.includes(character.name)) {
                        mentionedCharacters.add(character.name);
                      }
                    });
                  } 
                  // Message continuation (code 401)
                  else if (command.code === 401 && currentSpeaker) {
                    const text = command.parameters[0] || '';
                    
                    // Check for character mentions in the text
                    relationships.characters.forEach(character => {
                      if (text.includes(character.name)) {
                        mentionedCharacters.add(character.name);
                      }
                    });
                  }
                }
                
                // Record interactions between mentioned characters
                if (mentionedCharacters.size >= 2) {
                  const chars = Array.from(mentionedCharacters);
                  
                  for (let m = 0; m < chars.length; m++) {
                    for (let n = m + 1; n < chars.length; n++) {
                      const char1 = chars[m];
                      const char2 = chars[n];
                      
                      // Update co-occurrence counts
                      if (characterMap[char1]) {
                        if (!characterMap[char1].mentionedWith[char2]) {
                          characterMap[char1].mentionedWith[char2] = 0;
                        }
                        characterMap[char1].mentionedWith[char2]++;
                      }
                      
                      if (characterMap[char2]) {
                        if (!characterMap[char2].mentionedWith[char1]) {
                          characterMap[char2].mentionedWith[char1] = 0;
                        }
                        characterMap[char2].mentionedWith[char1]++;
                      }
                      
                      // Record interaction
                      interactions.push({
                        characters: [char1, char2],
                        mapId: mapInfo.id,
                        mapName: mapInfo.name,
                        eventId: event.id,
                        eventName: event.name,
                        pageIndex: k
                      });
                    }
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error processing map ${mapInfo.id}: ${error.message}`);
      }
    }
  }
  
  // Add interactions to relationships
  relationships.interactions = interactions;
}

/**
 * Extract character interactions from common events
 * @param {Array} commonEvents - Common events array
 * @param {Object} relationships - Relationships object to populate
 */
function extractCommonEventInteractions(commonEvents, relationships) {
  const characterMap = {};
  relationships.characters.forEach(character => {
    characterMap[character.name] = character;
  });
  
  // Skip first element (null)
  for (let i = 1; i < commonEvents.length; i++) {
    const event = commonEvents[i];
    if (!event || !event.list) continue;
    
    // Extract dialogues and interactions
    let currentSpeaker = null;
    const mentionedCharacters = new Set();
    
    for (let j = 0; j < event.list.length; j++) {
      const command = event.list[j];
      
      // Message command (code 101)
      if (command.code === 101) {
        currentSpeaker = command.parameters[4] || '';
        const text = command.parameters[0] || '';
        
        // Add current speaker to mentioned characters
        if (currentSpeaker && currentSpeaker.trim() !== '') {
          mentionedCharacters.add(currentSpeaker);
        }
        
        // Check for character mentions in the text
        relationships.characters.forEach(character => {
          if (text.includes(character.name)) {
            mentionedCharacters.add(character.name);
          }
        });
      } 
      // Message continuation (code 401)
      else if (command.code === 401 && currentSpeaker) {
        const text = command.parameters[0] || '';
        
        // Check for character mentions in the text
        relationships.characters.forEach(character => {
          if (text.includes(character.name)) {
            mentionedCharacters.add(character.name);
          }
        });
      }
    }
    
    // Record interactions between mentioned characters
    if (mentionedCharacters.size >= 2) {
      const chars = Array.from(mentionedCharacters);
      
      for (let m = 0; m < chars.length; m++) {
        for (let n = m + 1; n < chars.length; n++) {
          const char1 = chars[m];
          const char2 = chars[n];
          
          // Update co-occurrence counts
          if (characterMap[char1]) {
            if (!characterMap[char1].mentionedWith[char2]) {
              characterMap[char1].mentionedWith[char2] = 0;
            }
            characterMap[char1].mentionedWith[char2]++;
          }
          
          if (characterMap[char2]) {
            if (!characterMap[char2].mentionedWith[char1]) {
              characterMap[char2].mentionedWith[char1] = 0;
            }
            characterMap[char2].mentionedWith[char1]++;
          }
          
          // Record interaction
          relationships.interactions.push({
            characters: [char1, char2],
            commonEventId: event.id,
            commonEventName: event.name
          });
        }
      }
    }
  }
}

/**
 * Identify protagonists based on party members in System.json
 * @param {Object} relationships - Relationships object
 * @param {Object} systemData - System data
 */
function identifyProtagonists(relationships, systemData) {
  if (systemData.partyMembers) {
    systemData.partyMembers.forEach(actorId => {
      const character = relationships.characters.find(c => c.id === actorId);
      if (character) {
        character.isProtagonist = true;
        relationships.protagonists.push({
          id: character.id,
          name: character.name
        });
      }
    });
  }
  
  // If no protagonists were identified, use the first character as the protagonist
  if (relationships.protagonists.length === 0 && relationships.characters.length > 0) {
    const character = relationships.characters[0];
    character.isProtagonist = true;
    relationships.protagonists.push({
      id: character.id,
      name: character.name
    });
  }
}

/**
 * Analyze relationships to identify groups and hierarchies
 * @param {Object} relationships - Relationships object
 */
function analyzeRelationships(relationships) {
  // Create relationship edges based on co-occurrence
  relationships.characters.forEach(character => {
    Object.keys(character.mentionedWith).forEach(otherName => {
      const otherCharacter = relationships.characters.find(c => c.name === otherName);
      if (otherCharacter) {
        const count = character.mentionedWith[otherName];
        
        // Only include significant relationships (mentioned together multiple times)
        if (count >= 2) {
          relationships.relationships.push({
            source: character.id,
            sourceName: character.name,
            target: otherCharacter.id,
            targetName: otherCharacter.name,
            strength: count,
            type: determineRelationshipType(character, otherCharacter, count)
          });
          
          // Add to character's relationships
          character.relationships.push({
            characterId: otherCharacter.id,
            characterName: otherCharacter.name,
            strength: count,
            type: determineRelationshipType(character, otherCharacter, count)
          });
        }
      }
    });
  });
  
  // Identify character groups using community detection
  // (simplified approach: group characters that interact frequently)
  const groups = [];
  const assignedCharacters = new Set();
  
  // Sort relationships by strength (descending)
  const sortedRelationships = [...relationships.relationships]
    .sort((a, b) => b.strength - a.strength);
  
  // Create groups based on strong relationships
  sortedRelationships.forEach(rel => {
    if (rel.strength >= 3) {  // Threshold for strong relationship
      const source = relationships.characters.find(c => c.id === rel.source);
      const target = relationships.characters.find(c => c.id === rel.target);
      
      if (source && target) {
        // Check if either character is already in a group
        let sourceGroup = null;
        let targetGroup = null;
        
        groups.forEach(group => {
          if (group.members.some(m => m.id === source.id)) {
            sourceGroup = group;
          }
          if (group.members.some(m => m.id === target.id)) {
            targetGroup = group;
          }
        });
        
        if (sourceGroup && targetGroup) {
          // Both characters are in groups
          if (sourceGroup !== targetGroup) {
            // Merge groups if they're different
            sourceGroup.members = [...sourceGroup.members, ...targetGroup.members];
            groups.splice(groups.indexOf(targetGroup), 1);
          }
        } else if (sourceGroup) {
          // Only source is in a group, add target
          sourceGroup.members.push({
            id: target.id,
            name: target.name
          });
          assignedCharacters.add(target.id);
        } else if (targetGroup) {
          // Only target is in a group, add source
          targetGroup.members.push({
            id: source.id,
            name: source.name
          });
          assignedCharacters.add(source.id);
        } else {
          // Neither is in a group, create a new one
          const newGroup = {
            id: groups.length + 1,
            name: `Group ${groups.length + 1}`,
            members: [
              { id: source.id, name: source.name },
              { id: target.id, name: target.name }
            ]
          };
          groups.push(newGroup);
          assignedCharacters.add(source.id);
          assignedCharacters.add(target.id);
        }
      }
    }
  });
  
  // Name groups based on their members
  groups.forEach(group => {
    // If a protagonist is in the group, name it after them
    const protagonist = group.members.find(m => {
      const character = relationships.characters.find(c => c.id === m.id);
      return character && character.isProtagonist;
    });
    
    if (protagonist) {
      group.name = `${protagonist.name}'s Group`;
    } else if (group.members.length > 0) {
      // Otherwise, name it after the first member
      group.name = `${group.members[0].name}'s Group`;
    }
  });
  
  relationships.groups = groups;
}

/**
 * Determine the type of relationship between two characters
 * @param {Object} char1 - First character
 * @param {Object} char2 - Second character
 * @param {number} strength - Relationship strength
 * @returns {string} - Relationship type
 */
function determineRelationshipType(char1, char2, strength) {
  // If one is a protagonist and one isn't, they might be allies or enemies
  if (char1.isProtagonist && !char2.isProtagonist) {
    return strength >= 5 ? 'ally' : 'acquaintance';
  } else if (!char1.isProtagonist && char2.isProtagonist) {
    return strength >= 5 ? 'ally' : 'acquaintance';
  }
  
  // If both are protagonists, they're likely allies
  if (char1.isProtagonist && char2.isProtagonist) {
    return 'ally';
  }
  
  // Default relationship type based on strength
  if (strength >= 8) {
    return 'close';
  } else if (strength >= 5) {
    return 'friend';
  } else if (strength >= 3) {
    return 'acquaintance';
  } else {
    return 'known';
  }
}

/**
 * Generate a network graph for visualization
 * @param {Object} relationships - Relationships object
 * @returns {Object} - Network graph
 */
function generateNetworkGraph(relationships) {
  const nodes = relationships.characters.map(character => ({
    id: character.id,
    name: character.name,
    isProtagonist: character.isProtagonist,
    class: character.className,
    level: character.initialLevel
  }));
  
  const edges = relationships.relationships.map(rel => ({
    source: rel.source,
    target: rel.target,
    strength: rel.strength,
    type: rel.type
  }));
  
  return {
    nodes,
    edges
  };
}

module.exports = {
  mapRelationships
};
