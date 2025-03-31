# RPG Maker MV Context Extractor

The Context Extractor is a powerful tool for analyzing RPG Maker MV projects and extracting contextual information about the game's narrative, world, characters, and game systems. This information can be used to generate documentation, understand the game's structure, or provide context for AI tools working with the project.

## Features

The Context Extractor provides the following features:

- **Narrative Analysis**: Extract story arcs, quests, dialogues, and plot points from the game's data files.
- **World Building**: Map the game world by analyzing map connections, identifying key locations, and understanding geographical features.
- **Character Relationships**: Analyze character data and event interactions to map relationships between characters.
- **Game Systems Analysis**: Identify combat mechanics, skill systems, progression, and economy systems.
- **Contextual Summarization**: Generate human-readable summaries of the game's content.

## Usage

### Basic Usage

```javascript
const { extractContext } = require('rpgmaker-ai-tools');

// Path to the RPG Maker MV project
const projectPath = 'path/to/rpgmaker/project';

// Extract context
extractContext(projectPath)
  .then(context => {
    console.log('Project Name:', context.projectName);
    console.log('Maps:', context.world.locations.length);
    console.log('Characters:', context.characters.characters.length);
    console.log('Quests:', context.narrative.mainStory.mainQuests.length);
  })
  .catch(error => {
    console.error('Error extracting context:', error);
  });
```

### Advanced Usage

```javascript
const { contextExtractor } = require('rpgmaker-ai-tools');

// Path to the RPG Maker MV project
const projectPath = 'path/to/rpgmaker/project';

// Extract specific context components
async function analyzeGame() {
  try {
    // Extract narrative information
    const narrative = await contextExtractor.extractNarrative(projectPath);
    console.log('Game Title:', narrative.title);
    console.log('Story Arcs:', narrative.storyArcs.length);
    
    // Build world information
    const world = await contextExtractor.buildWorld(projectPath);
    console.log('World Name:', world.name);
    console.log('Regions:', world.regions.length);
    
    // Map character relationships
    const characters = await contextExtractor.mapCharacterRelationships(projectPath);
    console.log('Characters:', characters.characters.length);
    console.log('Protagonists:', characters.protagonists.length);
    
    // Analyze game systems
    const gameSystems = await contextExtractor.analyzeGameSystems(projectPath);
    console.log('Combat System:', gameSystems.combat.battleSystem);
    console.log('Skills:', gameSystems.combat.skills.length);
    
    // Generate summaries
    const context = {
      projectName: narrative.title,
      narrative,
      world,
      characters,
      gameSystems
    };
    
    const summaries = await contextExtractor.generateSummaries(projectPath, context);
    console.log('Game Overview:', summaries.gameOverview);
  } catch (error) {
    console.error('Error analyzing game:', error);
  }
}

analyzeGame();
```

### Generating Documentation

```javascript
const { contextExtractor } = require('rpgmaker-ai-tools');
const fs = require('fs-extra');
const path = require('path');

// Path to the RPG Maker MV project
const projectPath = 'path/to/rpgmaker/project';

// Output directory for documentation
const outputDir = 'docs/game-guide';

// Generate game documentation
async function generateDocumentation() {
  try {
    // Extract all context
    const context = await contextExtractor.extractContext(projectPath);
    
    // Generate summaries
    const summaries = await contextExtractor.generateSummaries(projectPath, context);
    
    // Ensure output directory exists
    await fs.ensureDir(outputDir);
    
    // Write game overview
    await fs.writeFile(
      path.join(outputDir, 'overview.md'),
      summaries.gameOverview,
      'utf8'
    );
    
    // Write narrative summary
    await fs.writeFile(
      path.join(outputDir, 'narrative.md'),
      summaries.narrative,
      'utf8'
    );
    
    // Write world summary
    await fs.writeFile(
      path.join(outputDir, 'world.md'),
      summaries.world,
      'utf8'
    );
    
    // Write character summary
    await fs.writeFile(
      path.join(outputDir, 'characters.md'),
      summaries.characters,
      'utf8'
    );
    
    // Write game systems summary
    await fs.writeFile(
      path.join(outputDir, 'game-systems.md'),
      summaries.gameSystems,
      'utf8'
    );
    
    // Write key locations
    await fs.writeJson(
      path.join(outputDir, 'key-locations.json'),
      summaries.keyLocations,
      { spaces: 2 }
    );
    
    // Write main characters
    await fs.writeJson(
      path.join(outputDir, 'main-characters.json'),
      summaries.mainCharacters,
      { spaces: 2 }
    );
    
    // Write quest summaries
    await fs.writeJson(
      path.join(outputDir, 'quests.json'),
      summaries.questSummaries,
      { spaces: 2 }
    );
    
    console.log('Documentation generated successfully!');
  } catch (error) {
    console.error('Error generating documentation:', error);
  }
}

generateDocumentation();
```

## API Reference

### `extractContext(projectPath, options)`

Extracts contextual information from an RPG Maker MV project.

- **Parameters**:
  - `projectPath` (string): Path to the RPG Maker MV project.
  - `options` (object, optional): Options for extraction.
    - `extractNarrative` (boolean): Whether to extract narrative information. Default: `true`.
    - `buildWorld` (boolean): Whether to build world information. Default: `true`.
    - `mapCharacterRelationships` (boolean): Whether to map character relationships. Default: `true`.
    - `analyzeGameSystems` (boolean): Whether to analyze game systems. Default: `true`.
    - `generateSummaries` (boolean): Whether to generate contextual summaries. Default: `true`.
- **Returns**: Promise resolving to an object containing the extracted context.

### `extractNarrative(projectPath)`

Extracts narrative information from an RPG Maker MV project.

- **Parameters**:
  - `projectPath` (string): Path to the RPG Maker MV project.
- **Returns**: Promise resolving to an object containing the extracted narrative information.

### `buildWorld(projectPath)`

Builds world information from an RPG Maker MV project.

- **Parameters**:
  - `projectPath` (string): Path to the RPG Maker MV project.
- **Returns**: Promise resolving to an object containing the built world information.

### `mapCharacterRelationships(projectPath)`

Maps character relationships from an RPG Maker MV project.

- **Parameters**:
  - `projectPath` (string): Path to the RPG Maker MV project.
- **Returns**: Promise resolving to an object containing the mapped character relationships.

### `analyzeGameSystems(projectPath)`

Analyzes game systems from an RPG Maker MV project.

- **Parameters**:
  - `projectPath` (string): Path to the RPG Maker MV project.
- **Returns**: Promise resolving to an object containing the analyzed game systems.

### `generateSummaries(projectPath, contextData)`

Generates contextual summaries from an RPG Maker MV project.

- **Parameters**:
  - `projectPath` (string): Path to the RPG Maker MV project.
  - `contextData` (object): Previously extracted context data.
- **Returns**: Promise resolving to an object containing the generated summaries.

## Output Structure

The context extractor produces a rich data structure with the following components:

### Narrative

- **title**: Game title.
- **mainStory**: Main story information, including quests.
- **storyArcs**: Identified story arcs.
- **dialogues**: Character dialogues organized by map.
- **events**: Game events organized by map.
- **commonEvents**: Common events with dialogue information.

### World

- **name**: World name.
- **regions**: Major regions in the world.
- **locations**: All locations in the game.
- **mapConnections**: Connections between maps.
- **keyAreas**: Important locations in the game.
- **mapHierarchy**: Hierarchical structure of maps.
- **worldMap**: Simplified representation of the world for visualization.

### Characters

- **characters**: All characters in the game.
- **protagonists**: Playable characters.
- **antagonists**: Enemy characters.
- **relationships**: Relationships between characters.
- **groups**: Character groups or factions.
- **interactions**: Character interactions in events.
- **networkGraph**: Graph representation of character relationships.

### Game Systems

- **combat**: Combat system information, including skills, elements, and states.
- **progression**: Character progression information, including classes and level systems.
- **economy**: Economy system information, including items and shops.
- **equipment**: Equipment system information, including weapons and armor.
- **customSystems**: Custom gameplay systems.
- **balance**: Game balance analysis.

### Summaries

- **gameOverview**: High-level overview of the game.
- **narrative**: Summary of the game's narrative.
- **world**: Summary of the game world.
- **characters**: Summary of the game's characters.
- **gameSystems**: Summary of the game's systems.
- **keyLocations**: Summaries of key locations.
- **mainCharacters**: Summaries of main characters.
- **questSummaries**: Summaries of quests.

## Example

See the [extract-context.js](../examples/extract-context.js) example for a complete demonstration of how to use the context extractor.
