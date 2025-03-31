/**
 * RPG Maker MV Asset Creator
 * 
 * This module provides tools for analyzing and creating game assets for RPG Maker MV projects.
 * It helps understand how images are used in the game and generates contextual information
 * for creating new assets.
 */

const fs = require('fs-extra');
const path = require('path');
const contextExtractor = require('../contextExtractor');

// Image directory structure in RPG Maker MV
const IMAGE_DIRECTORIES = {
  CHARACTERS: 'characters',    // Character sprites for maps
  FACES: 'faces',              // Character face portraits for message boxes
  SV_ACTORS: 'sv_actors',      // Side-view actor battler sprites
  ENEMIES: 'enemies',          // Enemy sprites for front-view battles
  SV_ENEMIES: 'sv_enemies',    // Side-view enemy battler sprites
  TILESETS: 'tilesets',        // Map tilesets
  BATTLEBACKS1: 'battlebacks1', // Battle background floors
  BATTLEBACKS2: 'battlebacks2', // Battle background walls
  PARALLAXES: 'parallaxes',    // Parallax backgrounds
  PICTURES: 'pictures',        // Pictures shown with Show Picture command
  ANIMATIONS: 'animations',    // Animation graphics
  TITLES1: 'titles1',          // Title screen backgrounds
  TITLES2: 'titles2',          // Title screen foregrounds
  SYSTEM: 'system',            // System graphics (window skins, icons, etc.)
  WEATHER: 'weather'           // Weather effects
};

// Image formats and dimensions
const IMAGE_FORMATS = {
  CHARACTERS: {
    width: 288,
    height: 256,
    format: 'png',
    description: 'Character sprite sheets with 4 rows (down, left, right, up) and 3 columns (different poses)',
    gridSize: { columns: 3, rows: 4 },
    cellSize: { width: 96, height: 64 }
  },
  FACES: {
    width: 384,
    height: 192,
    format: 'png',
    description: 'Face portrait sheets with 2 rows and 4 columns of different expressions',
    gridSize: { columns: 4, rows: 2 },
    cellSize: { width: 96, height: 96 }
  },
  SV_ACTORS: {
    width: 640,
    height: 640,
    format: 'png',
    description: 'Side-view actor battler sprite sheets with various battle poses',
    gridSize: { columns: 9, rows: 6 },
    cellSize: { width: 64, height: 64 }
  },
  ENEMIES: {
    format: 'png',
    description: 'Single enemy sprites for front-view battles, dimensions vary'
  },
  SV_ENEMIES: {
    format: 'png',
    description: 'Side-view enemy battler sprite sheets, dimensions vary'
  },
  TILESETS: {
    format: 'png',
    description: 'Tileset images for maps, dimensions vary by type (A1-A5, B-E)'
  }
};

/**
 * Analyze image assets in an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @returns {Promise<Object>} - Analysis of image assets
 */
async function analyzeImageAssets(projectPath) {
  try {
    // Extract context from the project
    const context = await contextExtractor.extractContext(projectPath);
    
    // Get image directory path
    const imgPath = path.join(projectPath, 'img');
    
    // Initialize asset analysis
    const assetAnalysis = {
      projectName: context.projectName,
      imageDirectories: {},
      characterAssets: [],
      mapAssets: [],
      battleAssets: [],
      systemAssets: [],
      unusedAssets: [],
      missingAssets: []
    };
    
    // Analyze each image directory
    for (const [key, dirName] of Object.entries(IMAGE_DIRECTORIES)) {
      const dirPath = path.join(imgPath, dirName);
      
      if (await fs.pathExists(dirPath)) {
        const files = await fs.readdir(dirPath);
        const imageFiles = files.filter(file => file.endsWith('.png'));
        
        assetAnalysis.imageDirectories[dirName] = {
          path: dirPath,
          fileCount: imageFiles.length,
          files: imageFiles
        };
      } else {
        assetAnalysis.imageDirectories[dirName] = {
          path: dirPath,
          fileCount: 0,
          files: []
        };
      }
    }
    
    // Analyze character assets
    if (context.characters && context.characters.characters) {
      for (const character of context.characters.characters) {
        const characterAsset = {
          id: character.id,
          name: character.name,
          characterImage: character.characterName,
          faceImage: character.faceName,
          battlerImage: character.battlerName,
          description: character.profile || `Character ${character.name}`,
          isProtagonist: character.isProtagonist
        };
        
        // Check if character images exist
        characterAsset.hasCharacterImage = assetAnalysis.imageDirectories[IMAGE_DIRECTORIES.CHARACTERS].files.includes(`${characterAsset.characterImage}.png`);
        characterAsset.hasFaceImage = assetAnalysis.imageDirectories[IMAGE_DIRECTORIES.FACES].files.includes(`${characterAsset.faceImage}.png`);
        characterAsset.hasBattlerImage = assetAnalysis.imageDirectories[IMAGE_DIRECTORIES.SV_ACTORS].files.includes(`${characterAsset.battlerImage}.png`);
        
        // Add to missing assets if any images are missing
        if (!characterAsset.hasCharacterImage) {
          assetAnalysis.missingAssets.push({
            type: 'character',
            directory: IMAGE_DIRECTORIES.CHARACTERS,
            filename: `${characterAsset.characterImage}.png`,
            relatedEntity: character
          });
        }
        
        if (!characterAsset.hasFaceImage) {
          assetAnalysis.missingAssets.push({
            type: 'face',
            directory: IMAGE_DIRECTORIES.FACES,
            filename: `${characterAsset.faceImage}.png`,
            relatedEntity: character
          });
        }
        
        if (!characterAsset.hasBattlerImage) {
          assetAnalysis.missingAssets.push({
            type: 'battler',
            directory: IMAGE_DIRECTORIES.SV_ACTORS,
            filename: `${characterAsset.battlerImage}.png`,
            relatedEntity: character
          });
        }
        
        assetAnalysis.characterAssets.push(characterAsset);
      }
    }
    
    // Analyze map assets
    if (context.world && context.world.locations) {
      for (const location of context.world.locations) {
        const mapAsset = {
          id: location.id,
          name: location.name,
          tilesetId: location.tilesetId,
          parallaxName: location.parallaxName,
          description: location.description || `Location ${location.name}`
        };
        
        // Get tileset information
        if (context.world.tilesets && context.world.tilesets.length > 0) {
          const tileset = context.world.tilesets.find(t => t.id === mapAsset.tilesetId);
          if (tileset) {
            mapAsset.tileset = {
              id: tileset.id,
              name: tileset.name,
              tilesetNames: tileset.tilesetNames
            };
            
            // Check if tileset images exist
            mapAsset.hasTilesetImages = true;
            for (const tilesetName of tileset.tilesetNames) {
              if (tilesetName && !assetAnalysis.imageDirectories[IMAGE_DIRECTORIES.TILESETS].files.includes(`${tilesetName}.png`)) {
                mapAsset.hasTilesetImages = false;
                
                // Add to missing assets
                assetAnalysis.missingAssets.push({
                  type: 'tileset',
                  directory: IMAGE_DIRECTORIES.TILESETS,
                  filename: `${tilesetName}.png`,
                  relatedEntity: { location, tileset }
                });
              }
            }
          }
        }
        
        // Check if parallax image exists
        if (mapAsset.parallaxName) {
          mapAsset.hasParallaxImage = assetAnalysis.imageDirectories[IMAGE_DIRECTORIES.PARALLAXES].files.includes(`${mapAsset.parallaxName}.png`);
          
          if (!mapAsset.hasParallaxImage) {
            assetAnalysis.missingAssets.push({
              type: 'parallax',
              directory: IMAGE_DIRECTORIES.PARALLAXES,
              filename: `${mapAsset.parallaxName}.png`,
              relatedEntity: location
            });
          }
        }
        
        assetAnalysis.mapAssets.push(mapAsset);
      }
    }
    
    // Analyze battle assets
    if (context.gameSystems && context.gameSystems.combat) {
      // Analyze enemies
      if (context.gameSystems.combat.enemies) {
        for (const enemy of context.gameSystems.combat.enemies) {
          const enemyAsset = {
            id: enemy.id,
            name: enemy.name,
            battlerName: enemy.battlerName,
            description: `Enemy ${enemy.name}`
          };
          
          // Check if enemy images exist
          if (context.gameSystems.combat.battleSystem.includes('Side View')) {
            enemyAsset.hasEnemyImage = assetAnalysis.imageDirectories[IMAGE_DIRECTORIES.SV_ENEMIES].files.includes(`${enemyAsset.battlerName}.png`);
            
            if (!enemyAsset.hasEnemyImage) {
              assetAnalysis.missingAssets.push({
                type: 'sv_enemy',
                directory: IMAGE_DIRECTORIES.SV_ENEMIES,
                filename: `${enemyAsset.battlerName}.png`,
                relatedEntity: enemy
              });
            }
          } else {
            enemyAsset.hasEnemyImage = assetAnalysis.imageDirectories[IMAGE_DIRECTORIES.ENEMIES].files.includes(`${enemyAsset.battlerName}.png`);
            
            if (!enemyAsset.hasEnemyImage) {
              assetAnalysis.missingAssets.push({
                type: 'enemy',
                directory: IMAGE_DIRECTORIES.ENEMIES,
                filename: `${enemyAsset.battlerName}.png`,
                relatedEntity: enemy
              });
            }
          }
          
          assetAnalysis.battleAssets.push(enemyAsset);
        }
      }
      
      // Analyze battle backgrounds
      if (context.gameSystems.combat.troops) {
        for (const troop of context.gameSystems.combat.troops) {
          const battleAsset = {
            id: troop.id,
            name: troop.name,
            battleback1Name: troop.battleback1Name,
            battleback2Name: troop.battleback2Name,
            description: `Battle ${troop.name}`
          };
          
          // Check if battleback images exist
          if (battleAsset.battleback1Name) {
            battleAsset.hasBattleback1 = assetAnalysis.imageDirectories[IMAGE_DIRECTORIES.BATTLEBACKS1].files.includes(`${battleAsset.battleback1Name}.png`);
            
            if (!battleAsset.hasBattleback1) {
              assetAnalysis.missingAssets.push({
                type: 'battleback1',
                directory: IMAGE_DIRECTORIES.BATTLEBACKS1,
                filename: `${battleAsset.battleback1Name}.png`,
                relatedEntity: troop
              });
            }
          }
          
          if (battleAsset.battleback2Name) {
            battleAsset.hasBattleback2 = assetAnalysis.imageDirectories[IMAGE_DIRECTORIES.BATTLEBACKS2].files.includes(`${battleAsset.battleback2Name}.png`);
            
            if (!battleAsset.hasBattleback2) {
              assetAnalysis.missingAssets.push({
                type: 'battleback2',
                directory: IMAGE_DIRECTORIES.BATTLEBACKS2,
                filename: `${battleAsset.battleback2Name}.png`,
                relatedEntity: troop
              });
            }
          }
          
          assetAnalysis.battleAssets.push(battleAsset);
        }
      }
    }
    
    // Find unused assets
    for (const [dirKey, dirName] of Object.entries(IMAGE_DIRECTORIES)) {
      const dirInfo = assetAnalysis.imageDirectories[dirName];
      
      if (dirInfo && dirInfo.files.length > 0) {
        switch (dirName) {
          case IMAGE_DIRECTORIES.CHARACTERS:
            // Find unused character images
            for (const file of dirInfo.files) {
              const baseName = path.basename(file, '.png');
              // Skip special files that start with ! (events)
              if (baseName.startsWith('!')) continue;
              
              const isUsed = assetAnalysis.characterAssets.some(asset => asset.characterImage === baseName);
              if (!isUsed) {
                assetAnalysis.unusedAssets.push({
                  type: 'character',
                  directory: dirName,
                  filename: file
                });
              }
            }
            break;
            
          case IMAGE_DIRECTORIES.FACES:
            // Find unused face images
            for (const file of dirInfo.files) {
              const baseName = path.basename(file, '.png');
              const isUsed = assetAnalysis.characterAssets.some(asset => asset.faceImage === baseName);
              if (!isUsed) {
                assetAnalysis.unusedAssets.push({
                  type: 'face',
                  directory: dirName,
                  filename: file
                });
              }
            }
            break;
            
          case IMAGE_DIRECTORIES.SV_ACTORS:
            // Find unused sv_actor images
            for (const file of dirInfo.files) {
              const baseName = path.basename(file, '.png');
              const isUsed = assetAnalysis.characterAssets.some(asset => asset.battlerImage === baseName);
              if (!isUsed) {
                assetAnalysis.unusedAssets.push({
                  type: 'sv_actor',
                  directory: dirName,
                  filename: file
                });
              }
            }
            break;
            
          // Add more cases for other directories as needed
        }
      }
    }
    
    return assetAnalysis;
  } catch (error) {
    throw new Error(`Error analyzing image assets: ${error.message}`);
  }
}

/**
 * Generate a prompt for creating a new character image
 * @param {Object} character - Character data
 * @param {string} imageType - Type of image to create (character, face, battler)
 * @param {Object} context - Game context data
 * @returns {Object} - Prompt information for image generation
 */
function generateCharacterImagePrompt(character, imageType, context) {
  const prompt = {
    type: imageType,
    name: character.name,
    description: character.profile || `Character ${character.name}`,
    specifications: {},
    contextualInformation: {}
  };
  
  // Add image specifications based on type
  switch (imageType) {
    case 'character':
      prompt.specifications = {
        dimensions: `${IMAGE_FORMATS.CHARACTERS.width}x${IMAGE_FORMATS.CHARACTERS.height}`,
        format: IMAGE_FORMATS.CHARACTERS.format,
        layout: IMAGE_FORMATS.CHARACTERS.description,
        gridSize: `${IMAGE_FORMATS.CHARACTERS.gridSize.columns}x${IMAGE_FORMATS.CHARACTERS.gridSize.rows}`,
        cellSize: `${IMAGE_FORMATS.CHARACTERS.cellSize.width}x${IMAGE_FORMATS.CHARACTERS.cellSize.height}`
      };
      break;
      
    case 'face':
      prompt.specifications = {
        dimensions: `${IMAGE_FORMATS.FACES.width}x${IMAGE_FORMATS.FACES.height}`,
        format: IMAGE_FORMATS.FACES.format,
        layout: IMAGE_FORMATS.FACES.description,
        gridSize: `${IMAGE_FORMATS.FACES.gridSize.columns}x${IMAGE_FORMATS.FACES.gridSize.rows}`,
        cellSize: `${IMAGE_FORMATS.FACES.cellSize.width}x${IMAGE_FORMATS.FACES.cellSize.height}`
      };
      break;
      
    case 'battler':
      prompt.specifications = {
        dimensions: `${IMAGE_FORMATS.SV_ACTORS.width}x${IMAGE_FORMATS.SV_ACTORS.height}`,
        format: IMAGE_FORMATS.SV_ACTORS.format,
        layout: IMAGE_FORMATS.SV_ACTORS.description,
        gridSize: `${IMAGE_FORMATS.SV_ACTORS.gridSize.columns}x${IMAGE_FORMATS.SV_ACTORS.gridSize.rows}`,
        cellSize: `${IMAGE_FORMATS.SV_ACTORS.cellSize.width}x${IMAGE_FORMATS.SV_ACTORS.cellSize.height}`
      };
      break;
  }
  
  // Add contextual information
  if (context) {
    // Add character relationships
    if (context.characters && context.characters.relationships) {
      const relationships = context.characters.relationships.filter(rel => 
        rel.character1Id === character.id || rel.character2Id === character.id
      );
      
      if (relationships.length > 0) {
        prompt.contextualInformation.relationships = relationships.map(rel => {
          const otherCharId = rel.character1Id === character.id ? rel.character2Id : rel.character1Id;
          const otherChar = context.characters.characters.find(c => c.id === otherCharId);
          
          return {
            type: rel.type,
            withCharacter: otherChar ? otherChar.name : `Character ${otherCharId}`,
            description: rel.description
          };
        });
      }
    }
    
    // Add character's role in the narrative
    if (context.narrative && context.narrative.storyArcs) {
      const characterArcs = context.narrative.storyArcs.filter(arc => 
        arc.name.includes(character.name) || 
        (arc.characters && arc.characters.includes(character.id))
      );
      
      if (characterArcs.length > 0) {
        prompt.contextualInformation.narrativeRole = characterArcs.map(arc => ({
          storyArc: arc.name,
          description: arc.description
        }));
      }
    }
    
    // Add game world context
    if (context.world && context.world.name) {
      prompt.contextualInformation.world = {
        name: context.world.name,
        description: context.world.description
      };
    }
    
    // Add game style information
    if (context.gameSystems) {
      prompt.contextualInformation.gameStyle = {
        battleSystem: context.gameSystems.combat ? context.gameSystems.combat.battleSystem : 'Unknown',
        genre: determineGameGenre(context)
      };
    }
  }
  
  return prompt;
}

/**
 * Generate a prompt for creating a new enemy image
 * @param {Object} enemy - Enemy data
 * @param {string} imageType - Type of image to create (enemy, sv_enemy)
 * @param {Object} context - Game context data
 * @returns {Object} - Prompt information for image generation
 */
function generateEnemyImagePrompt(enemy, imageType, context) {
  const prompt = {
    type: imageType,
    name: enemy.name,
    description: `Enemy ${enemy.name}`,
    specifications: {},
    contextualInformation: {}
  };
  
  // Add image specifications based on type
  switch (imageType) {
    case 'enemy':
      prompt.specifications = {
        format: IMAGE_FORMATS.ENEMIES.format,
        description: IMAGE_FORMATS.ENEMIES.description
      };
      break;
      
    case 'sv_enemy':
      prompt.specifications = {
        format: IMAGE_FORMATS.SV_ENEMIES.format,
        description: IMAGE_FORMATS.SV_ENEMIES.description
      };
      break;
  }
  
  // Add contextual information
  if (context) {
    // Add enemy stats
    if (enemy.params) {
      prompt.contextualInformation.stats = {
        hp: enemy.params[0],
        mp: enemy.params[1],
        attack: enemy.params[2],
        defense: enemy.params[3],
        magicAttack: enemy.params[4],
        magicDefense: enemy.params[5],
        agility: enemy.params[6],
        luck: enemy.params[7]
      };
    }
    
    // Add enemy actions
    if (enemy.actions) {
      prompt.contextualInformation.actions = enemy.actions.map(action => ({
        skillId: action.skillId,
        conditionType: action.conditionType,
        conditionParam1: action.conditionParam1,
        conditionParam2: action.conditionParam2,
        rating: action.rating
      }));
    }
    
    // Add enemy traits
    if (enemy.traits) {
      prompt.contextualInformation.traits = enemy.traits.map(trait => ({
        code: trait.code,
        dataId: trait.dataId,
        value: trait.value
      }));
    }
    
    // Add game world context
    if (context.world && context.world.name) {
      prompt.contextualInformation.world = {
        name: context.world.name,
        description: context.world.description
      };
    }
    
    // Add game style information
    if (context.gameSystems) {
      prompt.contextualInformation.gameStyle = {
        battleSystem: context.gameSystems.combat ? context.gameSystems.combat.battleSystem : 'Unknown',
        genre: determineGameGenre(context)
      };
    }
  }
  
  return prompt;
}

/**
 * Generate a prompt for creating a new tileset image
 * @param {Object} tileset - Tileset data
 * @param {string} tilesetName - Name of the tileset file to create
 * @param {Object} context - Game context data
 * @returns {Object} - Prompt information for image generation
 */
function generateTilesetImagePrompt(tileset, tilesetName, context) {
  const prompt = {
    type: 'tileset',
    name: tilesetName,
    description: `Tileset for ${tileset.name}`,
    specifications: {
      format: IMAGE_FORMATS.TILESETS.format,
      description: IMAGE_FORMATS.TILESETS.description
    },
    contextualInformation: {}
  };
  
  // Determine tileset type based on name
  if (tilesetName.startsWith('A1')) {
    prompt.specifications.tilesetType = 'A1 (Animated autotiles, water, etc.)';
    prompt.specifications.dimensions = '768x576';
  } else if (tilesetName.startsWith('A2')) {
    prompt.specifications.tilesetType = 'A2 (Ground autotiles)';
    prompt.specifications.dimensions = '768x576';
  } else if (tilesetName.startsWith('A3')) {
    prompt.specifications.tilesetType = 'A3 (Building autotiles)';
    prompt.specifications.dimensions = '768x384';
  } else if (tilesetName.startsWith('A4')) {
    prompt.specifications.tilesetType = 'A4 (Wall autotiles)';
    prompt.specifications.dimensions = '768x768';
  } else if (tilesetName.startsWith('A5')) {
    prompt.specifications.tilesetType = 'A5 (Normal format autotiles)';
    prompt.specifications.dimensions = '384x768';
  } else if (tilesetName.startsWith('B')) {
    prompt.specifications.tilesetType = 'B (Buildings, furniture, etc.)';
    prompt.specifications.dimensions = '768x768';
  } else if (tilesetName.startsWith('C')) {
    prompt.specifications.tilesetType = 'C (Buildings, furniture, etc.)';
    prompt.specifications.dimensions = '768x768';
  } else if (tilesetName.startsWith('D')) {
    prompt.specifications.tilesetType = 'D (Buildings, furniture, etc.)';
    prompt.specifications.dimensions = '768x768';
  } else if (tilesetName.startsWith('E')) {
    prompt.specifications.tilesetType = 'E (Buildings, furniture, etc.)';
    prompt.specifications.dimensions = '768x768';
  }
  
  // Add contextual information
  if (context) {
    // Add locations using this tileset
    if (context.world && context.world.locations) {
      const locationsUsingTileset = context.world.locations.filter(loc => loc.tilesetId === tileset.id);
      
      if (locationsUsingTileset.length > 0) {
        prompt.contextualInformation.locations = locationsUsingTileset.map(loc => ({
          name: loc.name,
          description: loc.description || `Location ${loc.name}`
        }));
      }
    }
    
    // Add game world context
    if (context.world && context.world.name) {
      prompt.contextualInformation.world = {
        name: context.world.name,
        description: context.world.description
      };
    }
    
    // Add game style information
    if (context.gameSystems) {
      prompt.contextualInformation.gameStyle = {
        genre: determineGameGenre(context)
      };
    }
  }
  
  return prompt;
}

/**
 * Determine the game genre based on context
 * @param {Object} context - Game context data
 * @returns {string} - Game genre
 */
function determineGameGenre(context) {
  // This is a simple heuristic and could be improved
  if (!context) return 'RPG';
  
  let genre = 'RPG';
  
  // Check for sci-fi elements
  if (context.world && context.world.name && context.world.name.toLowerCase().includes('sci-fi')) {
    genre = 'Sci-Fi RPG';
  } else if (context.world && context.world.description && context.world.description.toLowerCase().includes('sci-fi')) {
    genre = 'Sci-Fi RPG';
  }
  
  // Check for fantasy elements
  if (context.world && context.world.name && context.world.name.toLowerCase().includes('fantasy')) {
    genre = 'Fantasy RPG';
  } else if (context.world && context.world.description && context.world.description.toLowerCase().includes('fantasy')) {
    genre = 'Fantasy RPG';
  }
  
  // Check for horror elements
  if (context.world && context.world.name && context.world.name.toLowerCase().includes('horror')) {
    genre = 'Horror RPG';
  } else if (context.world && context.world.description && context.world.description.toLowerCase().includes('horror')) {
    genre = 'Horror RPG';
  }
  
  return genre;
}

/**
 * Generate a detailed prompt for Claude to create a new image asset
 * @param {Object} assetInfo - Information about the asset to create
 * @param {Object} context - Game context data
 * @returns {string} - Detailed prompt for Claude
 */
function generateClaudePrompt(assetInfo, context) {
  let prompt = `Create a ${assetInfo.type} image for an RPG Maker MV game named "${context.projectName || 'RPG Game'}".\n\n`;
  
  // Add asset name and description
  prompt += `Asset Name: ${assetInfo.name}\n`;
  prompt += `Description: ${assetInfo.description}\n\n`;
  
  // Add specifications
  prompt += `## Technical Specifications\n`;
  for (const [key, value] of Object.entries(assetInfo.specifications)) {
    prompt += `- ${key}: ${value}\n`;
  }
  prompt += '\n';
  
  // Add contextual information
  if (assetInfo.contextualInformation) {
    prompt += `## Contextual Information\n`;
    
    // Add world information
    if (assetInfo.contextualInformation.world) {
      prompt += `### World\n`;
      prompt += `- Name: ${assetInfo.contextualInformation.world.name}\n`;
      prompt += `- Description: ${assetInfo.contextualInformation.world.description}\n\n`;
    }
    
    // Add game style
    if (assetInfo.contextualInformation.gameStyle) {
      prompt += `### Game Style\n`;
      prompt += `- Genre: ${assetInfo.contextualInformation.gameStyle.genre}\n`;
      if (assetInfo.contextualInformation.gameStyle.battleSystem) {
        prompt += `- Battle System: ${assetInfo.contextualInformation.gameStyle.battleSystem}\n`;
      }
      prompt += '\n';
    }
    
    // Add relationships for characters
    if (assetInfo.contextualInformation.relationships) {
      prompt += `### Character Relationships\n`;
      for (const rel of assetInfo.contextualInformation.relationships) {
        prompt += `- ${rel.type} relationship with ${rel.withCharacter}: ${rel.description || ''}\n`;
      }
      prompt += '\n';
    }
    
    // Add narrative role for characters
    if (assetInfo.contextualInformation.narrativeRole) {
      prompt += `### Narrative Role\n`;
      for (const role of assetInfo.contextualInformation.narrativeRole) {
        prompt += `- Story Arc: ${role.storyArc}\n`;
        if (role.description) {
          prompt += `  Description: ${role.description}\n`;
        }
      }
      prompt += '\n';
    }
    
    // Add stats for enemies
    if (assetInfo.contextualInformation.stats) {
      prompt += `### Enemy Stats\n`;
      const stats = assetInfo.contextualInformation.stats;
      prompt += `- HP: ${stats.hp}, MP: ${stats.mp}\n`;
      prompt += `- Attack: ${stats.attack}, Defense: ${stats.defense}\n`;
      prompt += `- Magic Attack: ${stats.magicAttack}, Magic Defense: ${stats.magicDefense}\n`;
      prompt += `- Agility: ${stats.agility}, Luck: ${stats.luck}\n\n`;
    }
    
    // Add locations for tilesets
    if (assetInfo.contextualInformation.locations) {
      prompt += `### Locations Using This Tileset\n`;
      for (const loc of assetInfo.contextualInformation.locations) {
        prompt += `- ${loc.name}: ${loc.description}\n`;
      }
      prompt += '\n';
    }
  }
  
  // Add specific instructions based on asset type
  switch (assetInfo.type) {
    case 'character':
      prompt += `## Character Image Instructions\n`;
      prompt += `Create a character sprite sheet following the RPG Maker MV format. The sheet should have 4 rows (down, left, right, up) and 3 columns (different poses).\n`;
      prompt += `Each cell should be ${IMAGE_FORMATS.CHARACTERS.cellSize.width}x${IMAGE_FORMATS.CHARACTERS.cellSize.height} pixels.\n`;
      prompt += `The character should match the description and contextual information provided above.\n`;
      break;
      
    case 'face':
      prompt += `## Face Portrait Instructions\n`;
      prompt += `Create a face portrait sheet following the RPG Maker MV format. The sheet should have 2 rows and 4 columns of different expressions.\n`;
      prompt += `Each cell should be ${IMAGE_FORMATS.FACES.cellSize.width}x${IMAGE_FORMATS.FACES.cellSize.height} pixels.\n`;
      prompt += `Include a variety of expressions such as: neutral, happy, sad, angry, surprised, etc.\n`;
      prompt += `The portrait should match the description and contextual information provided above.\n`;
      break;
      
    case 'battler':
      prompt += `## Side-View Battler Instructions\n`;
      prompt += `Create a side-view battler sprite sheet following the RPG Maker MV format. The sheet should have various battle poses.\n`;
      prompt += `Each cell should be ${IMAGE_FORMATS.SV_ACTORS.cellSize.width}x${IMAGE_FORMATS.SV_ACTORS.cellSize.height} pixels.\n`;
      prompt += `Include poses for: standing, attacking, casting magic, taking damage, victory, etc.\n`;
      prompt += `The battler should match the description and contextual information provided above.\n`;
      break;
      
    case 'enemy':
      prompt += `## Enemy Image Instructions\n`;
      prompt += `Create a single enemy sprite for front-view battles.\n`;
      prompt += `The enemy should match the description and contextual information provided above.\n`;
      prompt += `Make sure the enemy looks intimidating and fits the game's style.\n`;
      break;
      
    case 'sv_enemy':
      prompt += `## Side-View Enemy Instructions\n`;
      prompt += `Create a side-view enemy sprite sheet with various battle poses.\n`;
      prompt += `Include poses for: standing, attacking, taking damage, etc.\n`;
      prompt += `The enemy should match the description and contextual information provided above.\n`;
      break;
      
    case 'tileset':
      prompt += `## Tileset Instructions\n`;
      prompt += `Create a tileset image following the RPG Maker MV format for ${assetInfo.specifications.tilesetType}.\n`;
      prompt += `The tileset should match the description and contextual information provided above.\n`;
      prompt += `Ensure the tiles are seamless and can be used to create cohesive maps.\n`;
      break;
      
    case 'battleback1':
      prompt += `## Battle Background Floor Instructions\n`;
      prompt += `Create a battle background floor image.\n`;
      prompt += `This image will be used as the floor in battle scenes.\n`;
      prompt += `The background should match the description and contextual information provided above.\n`;
      break;
      
    case 'battleback2':
      prompt += `## Battle Background Wall Instructions\n`;
      prompt += `Create a battle background wall image.\n`;
      prompt += `This image will be used as the wall/backdrop in battle scenes.\n`;
      prompt += `The background should match the description and contextual information provided above.\n`;
      break;
      
    case 'parallax':
      prompt += `## Parallax Background Instructions\n`;
      prompt += `Create a parallax background image.\n`;
      prompt += `This image will be used as a scrolling background for maps.\n`;
      prompt += `The background should match the description and contextual information provided above.\n`;
      break;
  }
  
  return prompt;
}

/**
 * Save an image asset to the appropriate directory
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {string} directory - Directory to save the image to
 * @param {string} filename - Filename for the image
 * @param {Buffer} imageData - Image data to save
 * @returns {Promise<string>} - Path to the saved image
 */
async function saveImageAsset(projectPath, directory, filename, imageData) {
  try {
    const imgPath = path.join(projectPath, 'img', directory);
    
    // Ensure directory exists
    await fs.ensureDir(imgPath);
    
    // Save image
    const filePath = path.join(imgPath, filename);
    await fs.writeFile(filePath, imageData);
    
    return filePath;
  } catch (error) {
    throw new Error(`Error saving image asset: ${error.message}`);
  }
}

/**
 * Generate a missing asset request
 * @param {Object} missingAsset - Information about the missing asset
 * @param {Object} context - Game context data
 * @returns {Object} - Asset request information
 */
function generateMissingAssetRequest(missingAsset, context) {
  try {
    let assetInfo;
    
    switch (missingAsset.type) {
      case 'character':
      case 'face':
      case 'battler':
        assetInfo = generateCharacterImagePrompt(missingAsset.relatedEntity, missingAsset.type, context);
        break;
        
      case 'enemy':
      case 'sv_enemy':
        assetInfo = generateEnemyImagePrompt(missingAsset.relatedEntity, missingAsset.type, context);
        break;
        
      case 'tileset':
        assetInfo = generateTilesetImagePrompt(
          missingAsset.relatedEntity.tileset,
          path.basename(missingAsset.filename, '.png'),
          context
        );
        break;
        
      case 'parallax':
      case 'battleback1':
      case 'battleback2':
        // Simple prompts for these types
        assetInfo = {
          type: missingAsset.type,
          name: path.basename(missingAsset.filename, '.png'),
          description: `${missingAsset.type} for ${missingAsset.relatedEntity.name}`,
          specifications: {
            format: 'png'
          },
          contextualInformation: {
            world: context.world ? {
              name: context.world.name,
              description: context.world.description
            } : undefined,
            gameStyle: {
              genre: determineGameGenre(context)
            }
          }
        };
        break;
        
      default:
        throw new Error(`Unsupported asset type: ${missingAsset.type}`);
    }
    
    // Generate Claude prompt
    const claudePrompt = generateClaudePrompt(assetInfo, context);
    
    return {
      assetInfo,
      claudePrompt,
      missingAsset
    };
  } catch (error) {
    throw new Error(`Error generating missing asset request: ${error.message}`);
  }
}

module.exports = {
  IMAGE_DIRECTORIES,
  IMAGE_FORMATS,
  analyzeImageAssets,
  generateCharacterImagePrompt,
  generateEnemyImagePrompt,
  generateTilesetImagePrompt,
  generateClaudePrompt,
  saveImageAsset,
  generateMissingAssetRequest
};
