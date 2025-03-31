# RPG Maker AI Tools

A collection of AI-powered tools for RPG Maker MV projects. This library provides utilities for analyzing and fixing RPG Maker MV data files, as well as other helpful tools for RPG Maker MV development.

## Features

- **JSON Fixer**: Fix broken JSON files in RPG Maker MV projects
  - Multiple approaches with increasing levels of sophistication
  - Handles common issues like missing commas, malformed arrays, etc.
  - Can fix entire directories of files at once
  
- **Project Analyzer**: Analyze RPG Maker MV projects for issues
  - Identifies common problems in JSON files
  - Checks for JavaScript issues in note fields
  - Generates detailed reports with HTML visualization
  
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

## Examples

Check out the [examples](./examples) directory for more detailed examples of how to use the library.

## License

MIT
