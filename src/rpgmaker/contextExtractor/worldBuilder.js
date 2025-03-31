/**
 * World Builder for RPG Maker MV
 * 
 * This module analyzes map data to build a comprehensive understanding
 * of the game world, including locations, connections, and geographical features.
 */

const fs = require('fs-extra');
const path = require('path');
const { parseJson } = require('../../core');

/**
 * Build world information from an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @returns {Promise<Object>} - Built world information
 */
async function buildWorld(projectPath) {
  const dataPath = path.join(projectPath, 'data');
  
  // Initialize world structure
  const world = {
    name: '',
    regions: [],
    locations: [],
    mapConnections: [],
    keyAreas: [],
    worldMap: null
  };

  try {
    // Extract game title from System.json as world name
    const systemPath = path.join(dataPath, 'System.json');
    if (await fs.pathExists(systemPath)) {
      const systemData = parseJson(await fs.readFile(systemPath, 'utf8'));
      world.name = systemData?.gameTitle || '';
    }

    // Extract map information from MapInfos.json
    const mapInfosPath = path.join(dataPath, 'MapInfos.json');
    if (await fs.pathExists(mapInfosPath)) {
      const mapInfos = parseJson(await fs.readFile(mapInfosPath, 'utf8'));
      
      // Build hierarchical map structure
      const mapStructure = buildMapHierarchy(mapInfos);
      world.mapHierarchy = mapStructure;
      
      // Extract regions from root maps
      world.regions = identifyRegions(mapStructure.rootMaps);
      
      // Process individual map files to extract detailed information
      await extractMapDetails(dataPath, mapInfos, world);
      
      // Identify key areas based on event density and connections
      world.keyAreas = identifyKeyAreas(world);
      
      // Generate world map representation
      world.worldMap = generateWorldMap(world);
    }

    return world;
  } catch (error) {
    throw new Error(`Error building world: ${error.message}`);
  }
}

/**
 * Build hierarchical map structure from MapInfos.json
 * @param {Array} mapInfos - Map information array
 * @returns {Object} - Hierarchical map structure
 */
function buildMapHierarchy(mapInfos) {
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
      children: [],
      isExpanded: mapInfo.expanded || false
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
 * Identify regions from root maps
 * @param {Array} rootMaps - Root maps in the hierarchy
 * @returns {Array} - Identified regions
 */
function identifyRegions(rootMaps) {
  const regions = [];
  
  rootMaps.forEach(map => {
    // Skip maps that are likely not regions
    if (map.name.toLowerCase().includes('title') || 
        map.name.toLowerCase().includes('menu') ||
        map.name.toLowerCase().includes('game over')) {
      return;
    }
    
    const region = {
      id: map.id,
      name: map.name,
      maps: [map.id],
      subregions: []
    };
    
    // Add child maps to the region
    function addChildMaps(parent, region) {
      parent.children.forEach(child => {
        region.maps.push(child.id);
        
        // If the child has many children, it might be a subregion
        if (child.children.length >= 3) {
          const subregion = {
            id: child.id,
            name: child.name,
            maps: [child.id]
          };
          
          child.children.forEach(grandchild => {
            subregion.maps.push(grandchild.id);
          });
          
          region.subregions.push(subregion);
        }
        
        addChildMaps(child, region);
      });
    }
    
    addChildMaps(map, region);
    regions.push(region);
  });
  
  return regions;
}

/**
 * Extract detailed information from individual map files
 * @param {string} dataPath - Path to data directory
 * @param {Array} mapInfos - Map information array
 * @param {Object} world - World object to populate
 */
async function extractMapDetails(dataPath, mapInfos, world) {
  const locations = [];
  const mapConnections = [];
  const transferEvents = {};
  
  // Process each map
  for (let i = 1; i < mapInfos.length; i++) {
    const mapInfo = mapInfos[i];
    if (!mapInfo) continue;
    
    const mapPath = path.join(dataPath, `Map${mapInfo.id.toString().padStart(3, '0')}.json`);
    if (await fs.pathExists(mapPath)) {
      try {
        const mapData = parseJson(await fs.readFile(mapPath, 'utf8'));
        
        // Create location object
        const location = {
          id: mapInfo.id,
          name: mapInfo.name,
          displayX: mapData.displayX || 0,
          displayY: mapData.displayY || 0,
          width: mapData.width || 0,
          height: mapData.height || 0,
          scrollType: mapData.scrollType || 0,
          encounterList: mapData.encounterList || [],
          encounterStep: mapData.encounterStep || 30,
          noteworthy: false,
          features: [],
          events: []
        };
        
        // Extract map features
        if (mapData.note) {
          location.features = extractMapFeatures(mapData.note);
        }
        
        // Process events to find transfers and important locations
        if (mapData.events) {
          const mapTransfers = [];
          
          for (let j = 0; j < mapData.events.length; j++) {
            const event = mapData.events[j];
            if (!event) continue;
            
            // Add event to location
            location.events.push({
              id: event.id,
              name: event.name,
              x: event.x,
              y: event.y,
              pages: event.pages ? event.pages.length : 0
            });
            
            // Check for transfer events (code 201)
            if (event.pages) {
              for (let k = 0; k < event.pages.length; k++) {
                const page = event.pages[k];
                if (!page || !page.list) continue;
                
                for (let l = 0; l < page.list.length; l++) {
                  const command = page.list[l];
                  
                  // Transfer Player command
                  if (command.code === 201) {
                    const targetMapId = command.parameters[1];
                    const targetX = command.parameters[2];
                    const targetY = command.parameters[3];
                    
                    if (targetMapId > 0) {
                      mapTransfers.push({
                        sourceMapId: mapInfo.id,
                        sourceX: event.x,
                        sourceY: event.y,
                        targetMapId,
                        targetX,
                        targetY,
                        direction: command.parameters[4],
                        fadeType: command.parameters[5]
                      });
                      
                      // Store transfer event for later connection building
                      if (!transferEvents[mapInfo.id]) {
                        transferEvents[mapInfo.id] = [];
                      }
                      transferEvents[mapInfo.id].push({
                        eventId: event.id,
                        targetMapId,
                        targetX,
                        targetY
                      });
                    }
                  }
                }
              }
            }
          }
          
          // Mark location as noteworthy if it has many events or transfers
          if (location.events.length > 5 || mapTransfers.length > 2) {
            location.noteworthy = true;
          }
          
          // Add transfers to map connections
          mapTransfers.forEach(transfer => {
            mapConnections.push({
              from: {
                mapId: transfer.sourceMapId,
                mapName: mapInfo.name,
                x: transfer.sourceX,
                y: transfer.sourceY
              },
              to: {
                mapId: transfer.targetMapId,
                mapName: mapInfos[transfer.targetMapId] ? mapInfos[transfer.targetMapId].name : 'Unknown',
                x: transfer.targetX,
                y: transfer.targetY
              },
              type: transfer.fadeType === 0 ? 'Normal' : 
                    transfer.fadeType === 1 ? 'Fade' : 
                    transfer.fadeType === 2 ? 'White' : 'Unknown'
            });
          });
        }
        
        locations.push(location);
      } catch (error) {
        console.error(`Error processing map ${mapInfo.id}: ${error.message}`);
      }
    }
  }
  
  // Add locations and connections to world
  world.locations = locations;
  world.mapConnections = mapConnections;
  
  // Build bidirectional connections
  buildBidirectionalConnections(world, transferEvents);
}

/**
 * Extract map features from note field
 * @param {string} note - Map note field
 * @returns {Array} - Extracted features
 */
function extractMapFeatures(note) {
  const features = [];
  
  // Extract tags from note field
  const tagRegex = /<([^>]+)>/g;
  let match;
  
  while ((match = tagRegex.exec(note)) !== null) {
    const tag = match[1].trim();
    
    // Process different tag types
    if (tag.startsWith('region:')) {
      features.push({
        type: 'region',
        value: tag.substring(7).trim()
      });
    } else if (tag.startsWith('climate:')) {
      features.push({
        type: 'climate',
        value: tag.substring(8).trim()
      });
    } else if (tag.startsWith('feature:')) {
      features.push({
        type: 'landmark',
        value: tag.substring(8).trim()
      });
    } else if (tag.startsWith('danger:')) {
      features.push({
        type: 'danger',
        value: tag.substring(7).trim()
      });
    } else {
      // Generic feature
      features.push({
        type: 'generic',
        value: tag
      });
    }
  }
  
  return features;
}

/**
 * Build bidirectional connections between maps
 * @param {Object} world - World object
 * @param {Object} transferEvents - Transfer events by map ID
 */
function buildBidirectionalConnections(world, transferEvents) {
  // Create a map of connections
  const connectionMap = {};
  
  world.mapConnections.forEach(connection => {
    const key = `${connection.from.mapId}-${connection.to.mapId}`;
    if (!connectionMap[key]) {
      connectionMap[key] = [];
    }
    connectionMap[key].push(connection);
  });
  
  // Find bidirectional connections
  Object.keys(connectionMap).forEach(key => {
    const [fromMapId, toMapId] = key.split('-').map(Number);
    const reverseKey = `${toMapId}-${fromMapId}`;
    
    if (connectionMap[reverseKey]) {
      // Mark connections as bidirectional
      connectionMap[key].forEach(connection => {
        connection.bidirectional = true;
      });
      
      connectionMap[reverseKey].forEach(connection => {
        connection.bidirectional = true;
      });
    }
  });
}

/**
 * Identify key areas based on event density and connections
 * @param {Object} world - World object
 * @returns {Array} - Identified key areas
 */
function identifyKeyAreas(world) {
  const keyAreas = [];
  
  // Count incoming connections for each map
  const connectionCounts = {};
  world.mapConnections.forEach(connection => {
    const targetMapId = connection.to.mapId;
    connectionCounts[targetMapId] = (connectionCounts[targetMapId] || 0) + 1;
  });
  
  // Identify key areas based on event count and connections
  world.locations.forEach(location => {
    const connectionCount = connectionCounts[location.id] || 0;
    const eventCount = location.events.length;
    
    // Calculate importance score
    const importanceScore = eventCount * 0.7 + connectionCount * 0.3;
    
    // Maps with high importance scores are key areas
    if (importanceScore > 5 || location.noteworthy) {
      keyAreas.push({
        id: location.id,
        name: location.name,
        importanceScore,
        eventCount,
        connectionCount,
        type: determineAreaType(location)
      });
    }
  });
  
  // Sort key areas by importance score
  keyAreas.sort((a, b) => b.importanceScore - a.importanceScore);
  
  return keyAreas;
}

/**
 * Determine area type based on location name and features
 * @param {Object} location - Location object
 * @returns {string} - Area type
 */
function determineAreaType(location) {
  const name = location.name.toLowerCase();
  
  if (name.includes('town') || name.includes('city') || name.includes('village')) {
    return 'Settlement';
  } else if (name.includes('dungeon') || name.includes('cave') || name.includes('ruins')) {
    return 'Dungeon';
  } else if (name.includes('castle') || name.includes('fort') || name.includes('tower')) {
    return 'Fortress';
  } else if (name.includes('forest') || name.includes('woods') || name.includes('jungle')) {
    return 'Forest';
  } else if (name.includes('mountain') || name.includes('peak') || name.includes('hill')) {
    return 'Mountain';
  } else if (name.includes('lake') || name.includes('river') || name.includes('sea') || name.includes('ocean')) {
    return 'Water';
  } else if (name.includes('desert') || name.includes('wasteland')) {
    return 'Desert';
  } else if (name.includes('inn') || name.includes('shop') || name.includes('store')) {
    return 'Building';
  } else if (name.includes('room') || name.includes('chamber') || name.includes('hall')) {
    return 'Interior';
  } else if (name.includes('field') || name.includes('plain') || name.includes('meadow')) {
    return 'Field';
  } else if (name.includes('road') || name.includes('path') || name.includes('route')) {
    return 'Road';
  } else {
    return 'Other';
  }
}

/**
 * Generate a simplified world map representation
 * @param {Object} world - World object
 * @returns {Object} - World map representation
 */
function generateWorldMap(world) {
  // Create nodes for key areas
  const nodes = world.keyAreas.map(area => ({
    id: area.id,
    name: area.name,
    type: area.type,
    importance: area.importanceScore,
    connections: []
  }));
  
  // Create a map of nodes by ID for easy lookup
  const nodeMap = {};
  nodes.forEach(node => {
    nodeMap[node.id] = node;
  });
  
  // Add connections between nodes
  world.mapConnections.forEach(connection => {
    const sourceId = connection.from.mapId;
    const targetId = connection.to.mapId;
    
    if (nodeMap[sourceId] && nodeMap[targetId]) {
      nodeMap[sourceId].connections.push({
        to: targetId,
        bidirectional: connection.bidirectional || false
      });
    }
  });
  
  return {
    nodes,
    regions: world.regions
  };
}

module.exports = {
  buildWorld
};
