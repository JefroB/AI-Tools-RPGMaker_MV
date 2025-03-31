/**
 * Narrative Extractor for RPG Maker MV
 * 
 * This module extracts narrative elements from RPG Maker MV data files,
 * including story arcs, character dialogues, and plot points.
 */

const fs = require('fs-extra');
const path = require('path');
const { parseJson } = require('../../core');

/**
 * Extract narrative information from an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @returns {Promise<Object>} - Extracted narrative information
 */
async function extractNarrative(projectPath) {
  const dataPath = path.join(projectPath, 'data');
  
  // Initialize narrative structure
  const narrative = {
    title: '',
    mainStory: {
      introduction: [],
      mainQuests: [],
      sideQuests: [],
      conclusion: []
    },
    dialogues: {},
    plotPoints: [],
    storyArcs: []
  };

  try {
    // Extract game title from System.json
    const systemPath = path.join(dataPath, 'System.json');
    if (await fs.pathExists(systemPath)) {
      const systemData = parseJson(await fs.readFile(systemPath, 'utf8'));
      narrative.title = systemData?.gameTitle || '';
      
      // Extract quest information from switches
      if (systemData?.switches) {
        narrative.mainStory.mainQuests = extractQuestsFromSwitches(systemData.switches);
      }
    }

    // Extract map information from MapInfos.json
    const mapInfosPath = path.join(dataPath, 'MapInfos.json');
    if (await fs.pathExists(mapInfosPath)) {
      const mapInfos = parseJson(await fs.readFile(mapInfosPath, 'utf8'));
      const mapStructure = buildMapStructure(mapInfos);
      narrative.locations = mapStructure;
      
      // Extract dialogues and events from individual map files
      await extractMapEvents(dataPath, mapInfos, narrative);
    }

    // Extract character information from Actors.json
    const actorsPath = path.join(dataPath, 'Actors.json');
    if (await fs.pathExists(actorsPath)) {
      const actors = parseJson(await fs.readFile(actorsPath, 'utf8'));
      narrative.characters = extractCharacterInfo(actors);
    }

    // Extract common events from CommonEvents.json
    const commonEventsPath = path.join(dataPath, 'CommonEvents.json');
    if (await fs.pathExists(commonEventsPath)) {
      const commonEvents = parseJson(await fs.readFile(commonEventsPath, 'utf8'));
      extractCommonEvents(commonEvents, narrative);
    }

    // Analyze narrative structure to identify story arcs
    narrative.storyArcs = analyzeStoryArcs(narrative);

    return narrative;
  } catch (error) {
    throw new Error(`Error extracting narrative: ${error.message}`);
  }
}

/**
 * Extract quests from game switches
 * @param {Array} switches - Game switches array
 * @returns {Array} - Extracted quests
 */
function extractQuestsFromSwitches(switches) {
  const quests = [];
  
  // Skip first element (null)
  for (let i = 1; i < switches.length; i++) {
    const switchName = switches[i];
    if (!switchName) continue;
    
    // Look for quest-related switches
    if (switchName.includes('Quest')) {
      const questInfo = {
        id: i,
        name: switchName,
        status: switchName.includes('Complete') ? 'Complete' : 
               switchName.includes('Started') ? 'Started' : 'Unknown'
      };
      
      // Extract base quest name
      const questNameMatch = switchName.match(/(.*?)\s+(Started|Complete|Ended)/);
      if (questNameMatch) {
        questInfo.baseName = questNameMatch[1].trim();
      }
      
      quests.push(questInfo);
    }
  }
  
  // Group related quests
  const groupedQuests = [];
  const questGroups = {};
  
  quests.forEach(quest => {
    if (quest.baseName) {
      if (!questGroups[quest.baseName]) {
        questGroups[quest.baseName] = {
          name: quest.baseName,
          states: []
        };
      }
      questGroups[quest.baseName].states.push({
        id: quest.id,
        status: quest.status,
        fullName: quest.name
      });
    } else {
      groupedQuests.push({
        name: quest.name,
        id: quest.id,
        status: quest.status
      });
    }
  });
  
  // Add grouped quests
  Object.values(questGroups).forEach(group => {
    groupedQuests.push(group);
  });
  
  return groupedQuests;
}

/**
 * Build map structure from MapInfos.json
 * @param {Array} mapInfos - Map information array
 * @returns {Object} - Hierarchical map structure
 */
function buildMapStructure(mapInfos) {
  const maps = {};
  const rootMaps = [];
  
  // First pass: create map objects
  for (let i = 1; i < mapInfos.length; i++) {
    const mapInfo = mapInfos[i];
    if (!mapInfo) continue;
    
    maps[mapInfo.id] = {
      id: mapInfo.id,
      name: mapInfo.name,
      parentId: mapInfo.parentId,
      order: mapInfo.order,
      children: []
    };
  }
  
  // Second pass: build hierarchy
  for (const id in maps) {
    const map = maps[id];
    if (map.parentId === 0) {
      rootMaps.push(map);
    } else if (maps[map.parentId]) {
      maps[map.parentId].children.push(map);
    }
  }
  
  // Sort maps by order
  rootMaps.sort((a, b) => a.order - b.order);
  for (const id in maps) {
    maps[id].children.sort((a, b) => a.order - b.order);
  }
  
  return {
    rootMaps,
    allMaps: maps
  };
}

/**
 * Extract events from map files
 * @param {string} dataPath - Path to data directory
 * @param {Array} mapInfos - Map information array
 * @param {Object} narrative - Narrative object to populate
 */
async function extractMapEvents(dataPath, mapInfos, narrative) {
  narrative.events = {};
  narrative.dialogues = {};
  
  for (let i = 1; i < mapInfos.length; i++) {
    const mapInfo = mapInfos[i];
    if (!mapInfo) continue;
    
    const mapPath = path.join(dataPath, `Map${mapInfo.id.toString().padStart(3, '0')}.json`);
    if (await fs.pathExists(mapPath)) {
      try {
        const mapData = parseJson(await fs.readFile(mapPath, 'utf8'));
        if (mapData.events) {
          const mapEvents = [];
          const mapDialogues = [];
          
          // Process each event in the map
          for (let j = 0; j < mapData.events.length; j++) {
            const event = mapData.events[j];
            if (!event) continue;
            
            const eventInfo = {
              id: event.id,
              name: event.name,
              x: event.x,
              y: event.y,
              pages: []
            };
            
            // Process event pages
            if (event.pages) {
              for (let k = 0; k < event.pages.length; k++) {
                const page = event.pages[k];
                if (!page) continue;
                
                const pageInfo = {
                  conditions: page.conditions,
                  commands: []
                };
                
                // Extract dialogue and other commands
                if (page.list) {
                  const dialogues = [];
                  let currentDialogue = null;
                  
                  for (let l = 0; l < page.list.length; l++) {
                    const command = page.list[l];
                    
                    // Message command (code 101)
                    if (command.code === 101) {
                      currentDialogue = {
                        speaker: command.parameters[4] || '',
                        lines: [command.parameters[0]]
                      };
                      dialogues.push(currentDialogue);
                    } 
                    // Message continuation (code 401)
                    else if (command.code === 401 && currentDialogue) {
                      currentDialogue.lines.push(command.parameters[0]);
                    }
                    // Control switches (code 121) - quest progress
                    else if (command.code === 121) {
                      const switchId = command.parameters[0];
                      const switchValue = command.parameters[1];
                      
                      if (switchId < mapInfos.length && mapInfos[switchId]) {
                        pageInfo.commands.push({
                          type: 'switch',
                          switchId,
                          switchName: mapInfos[switchId],
                          value: switchValue === 0 ? 'OFF' : 'ON'
                        });
                      }
                    }
                  }
                  
                  if (dialogues.length > 0) {
                    pageInfo.dialogues = dialogues;
                    mapDialogues.push({
                      eventId: event.id,
                      eventName: event.name,
                      pageIndex: k,
                      dialogues
                    });
                  }
                }
                
                eventInfo.pages.push(pageInfo);
              }
            }
            
            mapEvents.push(eventInfo);
          }
          
          if (mapEvents.length > 0) {
            narrative.events[mapInfo.id] = {
              mapName: mapInfo.name,
              events: mapEvents
            };
          }
          
          if (mapDialogues.length > 0) {
            narrative.dialogues[mapInfo.id] = {
              mapName: mapInfo.name,
              dialogues: mapDialogues
            };
          }
        }
      } catch (error) {
        console.error(`Error processing map ${mapInfo.id}: ${error.message}`);
      }
    }
  }
}

/**
 * Extract character information from Actors.json
 * @param {Array} actors - Actors array
 * @returns {Array} - Character information
 */
function extractCharacterInfo(actors) {
  const characters = [];
  
  // Skip first element (null)
  for (let i = 1; i < actors.length; i++) {
    const actor = actors[i];
    if (!actor) continue;
    
    characters.push({
      id: actor.id,
      name: actor.name,
      nickname: actor.nickname,
      profile: actor.profile,
      initialLevel: actor.initialLevel,
      maxLevel: actor.maxLevel,
      classId: actor.classId,
      faceImage: actor.faceName ? `${actor.faceName}:${actor.faceIndex}` : null,
      characterImage: actor.characterName ? `${actor.characterName}:${actor.characterIndex}` : null,
      battlerImage: actor.battlerName || null
    });
  }
  
  return characters;
}

/**
 * Extract common events from CommonEvents.json
 * @param {Array} commonEvents - Common events array
 * @param {Object} narrative - Narrative object to populate
 */
function extractCommonEvents(commonEvents, narrative) {
  narrative.commonEvents = [];
  
  // Skip first element (null)
  for (let i = 1; i < commonEvents.length; i++) {
    const event = commonEvents[i];
    if (!event) continue;
    
    const eventInfo = {
      id: event.id,
      name: event.name,
      trigger: event.trigger,
      dialogues: []
    };
    
    // Extract dialogues
    if (event.list) {
      let currentDialogue = null;
      
      for (let j = 0; j < event.list.length; j++) {
        const command = event.list[j];
        
        // Message command (code 101)
        if (command.code === 101) {
          currentDialogue = {
            speaker: command.parameters[4] || '',
            lines: [command.parameters[0]]
          };
          eventInfo.dialogues.push(currentDialogue);
        } 
        // Message continuation (code 401)
        else if (command.code === 401 && currentDialogue) {
          currentDialogue.lines.push(command.parameters[0]);
        }
      }
    }
    
    narrative.commonEvents.push(eventInfo);
  }
}

/**
 * Analyze narrative structure to identify story arcs
 * @param {Object} narrative - Narrative object
 * @returns {Array} - Identified story arcs
 */
function analyzeStoryArcs(narrative) {
  const storyArcs = [];
  
  // Extract main story arc from quests
  if (narrative.mainStory.mainQuests.length > 0) {
    const mainStoryArc = {
      name: 'Main Story',
      description: 'The primary storyline of the game',
      quests: narrative.mainStory.mainQuests.filter(quest => 
        !quest.name.toLowerCase().includes('side') && 
        !quest.name.toLowerCase().includes('optional')
      )
    };
    
    storyArcs.push(mainStoryArc);
  }
  
  // Extract side story arcs
  const sideQuests = narrative.mainStory.mainQuests.filter(quest => 
    quest.name.toLowerCase().includes('side') || 
    quest.name.toLowerCase().includes('optional')
  );
  
  if (sideQuests.length > 0) {
    storyArcs.push({
      name: 'Side Stories',
      description: 'Optional storylines and quests',
      quests: sideQuests
    });
  }
  
  // Group character-specific dialogues into character arcs
  if (narrative.characters && narrative.dialogues) {
    const characterDialogues = {};
    
    // Collect dialogues by character
    Object.values(narrative.dialogues).forEach(mapDialogue => {
      mapDialogue.dialogues.forEach(eventDialogue => {
        eventDialogue.dialogues.forEach(dialogue => {
          const speaker = dialogue.speaker;
          if (speaker && speaker.trim() !== '') {
            if (!characterDialogues[speaker]) {
              characterDialogues[speaker] = [];
            }
            characterDialogues[speaker].push({
              mapId: mapDialogue.mapName,
              eventName: eventDialogue.eventName,
              lines: dialogue.lines
            });
          }
        });
      });
    });
    
    // Create character arcs
    Object.keys(characterDialogues).forEach(character => {
      if (characterDialogues[character].length >= 3) {  // Minimum threshold for a character arc
        storyArcs.push({
          name: `${character}'s Story`,
          description: `Storyline centered around ${character}`,
          character,
          dialogues: characterDialogues[character]
        });
      }
    });
  }
  
  return storyArcs;
}

module.exports = {
  extractNarrative
};
