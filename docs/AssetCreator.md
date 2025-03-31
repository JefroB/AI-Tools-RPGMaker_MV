# RPG Maker MV Asset Creator

The Asset Creator is a powerful tool for analyzing and creating game assets for RPG Maker MV projects. It helps understand how images are used in the game and generates contextual information for creating new assets.

## Features

The Asset Creator provides the following features:

- **Image Asset Analysis**: Analyze all image assets in an RPG Maker MV project to understand how they're used.
- **Missing Asset Detection**: Identify missing images referenced in the game data.
- **Unused Asset Detection**: Find images that aren't referenced in the game data.
- **Contextual Prompt Generation**: Generate detailed prompts for creating new assets based on game context.
- **Asset Integration**: Save new assets to the appropriate directories with the correct filenames.

## Usage

### Basic Usage

```javascript
const { assetCreator } = require('rpgmaker-ai-tools');

// Path to the RPG Maker MV project
const projectPath = 'path/to/rpgmaker/project';

// Analyze image assets
assetCreator.analyzeImageAssets(projectPath)
  .then(assetAnalysis => {
    console.log('Project Name:', assetAnalysis.projectName);
    console.log('Character Assets:', assetAnalysis.characterAssets.length);
    console.log('Map Assets:', assetAnalysis.mapAssets.length);
    console.log('Battle Assets:', assetAnalysis.battleAssets.length);
    console.log('Missing Assets:', assetAnalysis.missingAssets.length);
    console.log('Unused Assets:', assetAnalysis.unusedAssets.length);
  })
  .catch(error => {
    console.error('Error analyzing assets:', error);
  });
```

### Generating Prompts for Missing Assets

```javascript
const { assetCreator, contextExtractor } = require('rpgmaker-ai-tools');
const fs = require('fs-extra');

async function generateAssetPrompts() {
  // Path to the RPG Maker MV project
  const projectPath = 'path/to/rpgmaker/project';
  
  // Analyze image assets
  const assetAnalysis = await assetCreator.analyzeImageAssets(projectPath);
  
  // Extract context from the project
  const context = await contextExtractor.extractContext(projectPath);
  
  // Generate prompts for missing assets
  for (const missingAsset of assetAnalysis.missingAssets) {
    const assetRequest = assetCreator.generateMissingAssetRequest(missingAsset, context);
    
    // Save prompt to file
    const promptFilename = `${missingAsset.type}_${path.basename(missingAsset.filename, '.png')}.md`;
    await fs.writeFile(promptFilename, assetRequest.claudePrompt, 'utf8');
    
    console.log(`Generated prompt for: ${missingAsset.filename}`);
  }
}

generateAssetPrompts().catch(console.error);
```

### Saving a New Asset

```javascript
const { assetCreator } = require('rpgmaker-ai-tools');
const fs = require('fs-extra');

async function saveNewAsset() {
  // Path to the RPG Maker MV project
  const projectPath = 'path/to/rpgmaker/project';
  
  // Directory and filename for the asset
  const directory = assetCreator.IMAGE_DIRECTORIES.CHARACTERS;
  const filename = 'NewCharacter.png';
  
  // Read image data from file
  const imageData = await fs.readFile('path/to/new/character.png');
  
  // Save asset to the project
  const savedPath = await assetCreator.saveImageAsset(projectPath, directory, filename, imageData);
  
  console.log(`Saved new asset to: ${savedPath}`);
}

saveNewAsset().catch(console.error);
```

## API Reference

### `analyzeImageAssets(projectPath)`

Analyzes image assets in an RPG Maker MV project.

- **Parameters**:
  - `projectPath` (string): Path to the RPG Maker MV project.
- **Returns**: Promise resolving to an object containing the asset analysis.

### `generateCharacterImagePrompt(character, imageType, context)`

Generates a prompt for creating a new character image.

- **Parameters**:
  - `character` (object): Character data.
  - `imageType` (string): Type of image to create (character, face, battler).
  - `context` (object): Game context data.
- **Returns**: Object containing prompt information for image generation.

### `generateEnemyImagePrompt(enemy, imageType, context)`

Generates a prompt for creating a new enemy image.

- **Parameters**:
  - `enemy` (object): Enemy data.
  - `imageType` (string): Type of image to create (enemy, sv_enemy).
  - `context` (object): Game context data.
- **Returns**: Object containing prompt information for image generation.

### `generateTilesetImagePrompt(tileset, tilesetName, context)`

Generates a prompt for creating a new tileset image.

- **Parameters**:
  - `tileset` (object): Tileset data.
  - `tilesetName` (string): Name of the tileset file to create.
  - `context` (object): Game context data.
- **Returns**: Object containing prompt information for image generation.

### `generateClaudePrompt(assetInfo, context)`

Generates a detailed prompt for Claude to create a new image asset.

- **Parameters**:
  - `assetInfo` (object): Information about the asset to create.
  - `context` (object): Game context data.
- **Returns**: String containing a detailed prompt for Claude.

### `saveImageAsset(projectPath, directory, filename, imageData)`

Saves an image asset to the appropriate directory.

- **Parameters**:
  - `projectPath` (string): Path to the RPG Maker MV project.
  - `directory` (string): Directory to save the image to.
  - `filename` (string): Filename for the image.
  - `imageData` (Buffer): Image data to save.
- **Returns**: Promise resolving to the path of the saved image.

### `generateMissingAssetRequest(missingAsset, context)`

Generates a missing asset request.

- **Parameters**:
  - `missingAsset` (object): Information about the missing asset.
  - `context` (object): Game context data.
- **Returns**: Object containing asset request information.

## Constants

### `IMAGE_DIRECTORIES`

Object containing constants for image directories in RPG Maker MV.

```javascript
{
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
}
```

### `IMAGE_FORMATS`

Object containing information about image formats in RPG Maker MV.

```javascript
{
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
}
```

## Asset Analysis Structure

The `analyzeImageAssets` function returns an object with the following structure:

```javascript
{
  projectName: 'Project Name',
  imageDirectories: {
    // Information about each image directory
    characters: {
      path: 'path/to/characters',
      fileCount: 10,
      files: ['Actor1.png', 'Actor2.png', ...]
    },
    // ... other directories
  },
  characterAssets: [
    // Information about character assets
    {
      id: 1,
      name: 'Hero',
      characterImage: 'Actor1',
      faceImage: 'Actor1',
      battlerImage: 'Actor1_1',
      description: 'The main protagonist',
      isProtagonist: true,
      hasCharacterImage: true,
      hasFaceImage: true,
      hasBattlerImage: true
    },
    // ... other characters
  ],
  mapAssets: [
    // Information about map assets
    {
      id: 1,
      name: 'Town',
      tilesetId: 1,
      parallaxName: 'Town',
      description: 'A small town',
      tileset: {
        id: 1,
        name: 'Town',
        tilesetNames: ['A1', 'A2', 'A3', 'A4', 'A5', 'B', 'C', 'D', 'E']
      },
      hasTilesetImages: true,
      hasParallaxImage: true
    },
    // ... other maps
  ],
  battleAssets: [
    // Information about battle assets
    {
      id: 1,
      name: 'Slime',
      battlerName: 'Slime',
      description: 'Enemy Slime',
      hasEnemyImage: true
    },
    // ... other battle assets
  ],
  systemAssets: [
    // Information about system assets
  ],
  missingAssets: [
    // Information about missing assets
    {
      type: 'character',
      directory: 'characters',
      filename: 'NewCharacter.png',
      relatedEntity: { /* Character data */ }
    },
    // ... other missing assets
  ],
  unusedAssets: [
    // Information about unused assets
    {
      type: 'face',
      directory: 'faces',
      filename: 'UnusedFace.png'
    },
    // ... other unused assets
  ]
}
```

## Example

See the [analyze-assets.js](../examples/analyze-assets.js) example for a complete demonstration of how to use the Asset Creator.

## Integration with Claude

The Asset Creator is designed to work with Claude to generate new assets for your RPG Maker MV project. The `generateClaudePrompt` function generates detailed prompts that you can send to Claude to create new images.

Here's an example workflow:

1. Analyze your RPG Maker MV project to identify missing assets.
2. Generate prompts for the missing assets using the Asset Creator.
3. Send the prompts to Claude to create the new images.
4. Save the new images to your project using the `saveImageAsset` function.

This workflow allows you to quickly create new assets that fit seamlessly into your game, with all the necessary contextual information to ensure they match the style and theme of your project.
