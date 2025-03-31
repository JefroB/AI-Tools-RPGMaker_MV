# RPG Maker AI Tools

A collection of AI-powered tools for RPG Maker MV projects. This library provides utilities for analyzing and fixing RPG Maker MV data files as well as other helpful tools for RPG Maker MV development.

Repository: [https://github.com/JefroB/AI-Tools-RPGMaker_MV](https://github.com/JefroB/AI-Tools-RPGMaker_MV)

## Features

- **JSON Fixer**: Fix broken JSON files in RPG Maker MV projects
  - Multiple approaches with increasing levels of sophistication
  - Handles common issues like missing commas, malformed arrays, etc.
  - Can fix entire directories of files at once

- **Project Analyzer**: Analyze RPG Maker MV projects for issues
  - Identifies common problems in JSON files
  - Checks for JavaScript issues in note fields
  - Generates detailed reports with HTML visualization

- **Context Extractor**: Extract contextual information from RPG Maker MV projects
  - Analyzes narrative, world, characters, and game systems
  - Maps relationships between characters and locations
  - Generates human-readable summaries of game content
  - Creates documentation for game guides

- **Asset Creator**: Analyze and create game assets for RPG Maker MV projects
  - Analyzes how images are used in the game
  - Identifies missing and unused assets
  - Generates contextual prompts for creating new assets
  - Helps integrate new assets into the game

- **RPG Maker MV Utilities**: Helper functions for working with RPG Maker MV projects
  - Load and save data files
  - Access game data (actors, classes, maps, etc.)
  - Work with plugins

## Installation

```bash
npm install rpgmaker-ai-tools
```

## Usage

### Fixing JSON Files

```javascript
const rpgmakerTools = require('rpgmaker-ai-tools');

// Fix a single file
async function fixFile() {
  const result = await rpgmakerTools.dataFixer.fixJsonFile('path/to/file.json', {
    approach: 'auto', // 'basic', 'intermediate', 'advanced', 'manual', or 'auto'
    outputPath: 'path/to/output.json' // Optional, defaults to overwriting the original
  });
  
  console.log(`Fixed ${result.issues} issues using ${result.approach} approach`);
}

// Fix all JSON files in a directory
async function fixDirectory() {
  const result = await rpgmakerTools.dataFixer.fixJsonFiles('path/to/data', {
    approach: 'auto',
    outputDir: 'path/to/output', // Optional, defaults to overwriting the originals
    recursive: true, // Optional, defaults to false
    include: ['*.json'], // Optional, defaults to ['*.json']
    exclude: [] // Optional, defaults to []
  });
  
  console.log(`Fixed ${result.fixedFiles} of ${result.totalFiles} files with ${result.totalIssues} issues`);
}
```

### Analyzing Projects

```javascript
const rpgmakerTools = require('rpgmaker-ai-tools');

async function analyzeProject() {
  const { results, summary } = await rpgmakerTools.analyzer.analyzeProject('path/to/data', {
    recursive: true, // Optional, defaults to false
    include: ['*.json'], // Optional, defaults to ['*.json']
    exclude: [], // Optional, defaults to []
    outputDir: 'path/to/output' // Optional, if provided, will write results to files
  });
  
  console.log(`Found ${summary.totalIssues} issues in ${summary.filesWithIssues} files`);
  
  // Access detailed results
  results.forEach(result => {
    console.log(`${result.file}: ${result.issues.length} issues`);
  });
}
```

### Extracting Context

```javascript
const rpgmakerTools = require('rpgmaker-ai-tools');

async function extractContext() {
  // Extract all context from a project
  const context = await rpgmakerTools.extractContext('path/to/project');
  
  console.log('Project Name:', context.projectName);
  console.log('Maps:', context.world.locations.length);
  console.log('Characters:', context.characters.characters.length);
  
  // Generate summaries
  const summaries = await rpgmakerTools.contextExtractor.generateSummaries('path/to/project', context);
  
  // Save summaries to files
  const fs = require('fs-extra');
  await fs.writeFile('game-overview.md', summaries.gameOverview, 'utf8');
  await fs.writeFile('narrative.md', summaries.narrative, 'utf8');
  await fs.writeFile('world.md', summaries.world, 'utf8');
  await fs.writeFile('characters.md', summaries.characters, 'utf8');
  await fs.writeFile('game-systems.md', summaries.gameSystems, 'utf8');
}

// Extract specific components
async function extractComponents() {
  // Extract narrative information
  const narrative = await rpgmakerTools.contextExtractor.extractNarrative('path/to/project');
  
  // Build world information
  const world = await rpgmakerTools.contextExtractor.buildWorld('path/to/project');
  
  // Map character relationships
  const characters = await rpgmakerTools.contextExtractor.mapCharacterRelationships('path/to/project');
  
  // Analyze game systems
  const gameSystems = await rpgmakerTools.contextExtractor.analyzeGameSystems('path/to/project');
}
```

For more detailed information about the Context Extractor, see the [ContextExtractor.md](./docs/ContextExtractor.md) documentation.

### Analyzing and Creating Assets

```javascript
const rpgmakerTools = require('rpgmaker-ai-tools');

async function analyzeAssets() {
  // Analyze image assets in a project
  const assetAnalysis = await rpgmakerTools.analyzeImageAssets('path/to/project');
  
  console.log('Project Name:', assetAnalysis.projectName);
  console.log('Character Assets:', assetAnalysis.characterAssets.length);
  console.log('Map Assets:', assetAnalysis.mapAssets.length);
  console.log('Battle Assets:', assetAnalysis.battleAssets.length);
  console.log('Missing Assets:', assetAnalysis.missingAssets.length);
  console.log('Unused Assets:', assetAnalysis.unusedAssets.length);
  
  // Generate prompts for missing assets
  if (assetAnalysis.missingAssets.length > 0) {
    // Extract context from the project
    const context = await rpgmakerTools.extractContext('path/to/project');
    
    // Generate a prompt for a missing asset
    const missingAsset = assetAnalysis.missingAssets[0];
    const assetRequest = rpgmakerTools.generateMissingAssetRequest(missingAsset, context);
    
    console.log('Asset Type:', assetRequest.assetInfo.type);
    console.log('Asset Name:', assetRequest.assetInfo.name);
    console.log('Prompt:', assetRequest.claudePrompt);
    
    // Save the prompt to a file
    const fs = require('fs-extra');
    await fs.writeFile('asset-prompt.md', assetRequest.claudePrompt, 'utf8');
  }
  
  // Save a new asset to the project
  const fs = require('fs-extra');
  const imageData = await fs.readFile('path/to/new/asset.png');
  const savedPath = await rpgmakerTools.assetCreator.saveImageAsset(
    'path/to/project',
    rpgmakerTools.assetCreator.IMAGE_DIRECTORIES.CHARACTERS,
    'NewCharacter.png',
    imageData
  );
  
  console.log('Saved new asset to:', savedPath);
}
```

For more detailed information about the Asset Creator, see the [AssetCreator.md](./docs/AssetCreator.md) documentation.

### Using RPG Maker MV Utilities

```javascript
const rpgmakerTools = require('rpgmaker-ai-tools');

async function useUtils() {
  // Check if a project is valid
  const isValid = await rpgmakerTools.utils.isValidProject('path/to/project');
  
  // Load data files
  const actors = await rpgmakerTools.utils.loadDataFile('path/to/project', rpgmakerTools.utils.FileTypes.ACTORS);
  
  // Get map IDs
  const mapIds = await rpgmakerTools.utils.getMapIds('path/to/project');
  
  // Load a map
  const map = await rpgmakerTools.utils.loadMapFile('path/to/project', 1);
  
  // Check if a plugin is installed
  const hasPlugin = await rpgmakerTools.utils.hasPlugin('path/to/project', 'YEP_CoreEngine');
}
```

## Command Line Tools

The library includes command line tools for fixing and analyzing RPG Maker MV projects.

### Fix JSON Files

```bash
npx rpgmaker-ai-tools fix-json <path-to-project> [options]
```

Options:
- `--output-dir <dir>`: Directory to write fixed files to (default: overwrite originals)
- `--approach <name>`: Approach to use (basic, intermediate, advanced, manual, auto)
- `--recursive`: Process files recursively
- `--include <pattern>`: File pattern to include (can be used multiple times)
- `--exclude <pattern>`: File pattern to exclude (can be used multiple times)

### Analyze Project

```bash
npx rpgmaker-ai-tools analyze-project <path-to-project> [options]
```

Options:
- `--output-dir <dir>`: Directory to write analysis results to
- `--recursive`: Process files recursively
- `--include <pattern>`: File pattern to include (can be used multiple times)
- `--exclude <pattern>`: File pattern to exclude (can be used multiple times)

### Extract Context

```bash
npx rpgmaker-ai-tools extract-context <path-to-project> [options]
```

Options:
- `--output-dir <dir>`: Directory to write extracted context and summaries to
- `--format <format>`: Output format (json, markdown, or both) (default: both)
- `--extract-narrative`: Extract narrative information (default: true)
- `--build-world`: Build world information (default: true)
- `--map-characters`: Map character relationships (default: true)
- `--analyze-systems`: Analyze game systems (default: true)
- `--generate-summaries`: Generate contextual summaries (default: true)

### Analyze Assets

```bash
npx rpgmaker-ai-tools analyze-assets <path-to-project> [options]
```

Options:
- `--output-dir <dir>`: Directory to write asset analysis and prompts to
- `--generate-prompts`: Generate prompts for missing assets (default: true)
- `--max-prompts <number>`: Maximum number of prompts to generate (default: 10)
- `--prompt-format <format>`: Output format for prompts (markdown or text) (default: markdown)

## Examples

Check out the [examples](./examples) directory for more detailed examples of how to use the library.

## License

MIT
