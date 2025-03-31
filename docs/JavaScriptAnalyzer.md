# JavaScript Analyzer for RPG Maker MV

The JavaScript Analyzer module provides tools for analyzing JavaScript code in RPG Maker MV data files. It helps understand how JavaScript relates to game mechanics and functionality.

## Overview

RPG Maker MV games often contain JavaScript code in various places, such as:

- Battle animation scripts in the `note` field of Skills.json
- Conditional logic scripts in States.json and Skills.json
- Custom evaluation scripts in Skills.json
- Game mechanic tags with JavaScript expressions

This module provides tools to extract, analyze, and visualize these JavaScript patterns to help understand how they relate to game mechanics.

## Module Structure

The JavaScript Analyzer module consists of several submodules:

- **Pattern Extractor**: Extracts JavaScript patterns from data files
- **Battle Animation Analyzer**: Analyzes battle animation scripts
- **Conditional Logic Analyzer**: Analyzes conditional logic scripts
- **Custom Eval Analyzer**: Analyzes custom evaluation scripts
- **Game Tag Analyzer**: Analyzes game tags with JavaScript
- **Relationship Mapper**: Maps relationships between JavaScript and game elements
- **Visualizer**: Generates visual representations of JavaScript analysis

## Usage

### Basic Usage

```javascript
const { jsAnalyzer } = require('rpgmaker-ai-tools');

// Extract JavaScript patterns
const patterns = await jsAnalyzer.patternExtractor.extractPatterns('path/to/project');

// Analyze battle animations
const battleAnimations = await jsAnalyzer.battleAnimationAnalyzer.analyzeBattleAnimations('path/to/project');

// Analyze conditional logic
const conditionalLogic = await jsAnalyzer.conditionalLogicAnalyzer.analyzeConditionalLogic('path/to/project');

// Analyze custom evaluations
const customEvals = await jsAnalyzer.customEvalAnalyzer.analyzeCustomEvals('path/to/project');

// Analyze game tags
const gameTags = await jsAnalyzer.gameTagAnalyzer.analyzeGameTags('path/to/project');

// Map relationships
const relationships = await jsAnalyzer.relationshipMapper.mapJavaScriptRelationships('path/to/project', {
  battleAnimations,
  conditionalLogic,
  customEvals,
  gameTags
});

// Generate visualizations
const visualizations = await jsAnalyzer.visualizer.generateVisualizations('path/to/project', {
  battleAnimations,
  conditionalLogic,
  customEvals,
  gameTags,
  relationships
}, {
  outputDir: 'path/to/output'
});
```

### Using the Command Line Tool

The package includes a command line tool for analyzing JavaScript in RPG Maker MV projects:

```bash
node analyze-javascript.js <project-path> [options]
```

Options:
- `--output-dir <dir>`: Directory to write analysis results to
- `--battle-animations`: Include battle animation analysis
- `--conditional-logic`: Include conditional logic analysis
- `--custom-evals`: Include custom evaluation analysis
- `--game-tags`: Include game tag analysis
- `--relationships`: Include relationship mapping
- `--visualizations`: Generate visualizations
- `--all`: Include all analyses (default)

## Pattern Extractor

The Pattern Extractor module extracts JavaScript patterns from RPG Maker MV data files.

### Extracted Pattern Types

- **Battle Animation Patterns**: Scripts that control battle animations
- **Conditional Logic Patterns**: Scripts that contain conditional logic
- **Custom Eval Patterns**: Scripts that evaluate custom conditions
- **Game Tag Patterns**: Tags that contain JavaScript expressions

### Example

```javascript
const patterns = await jsAnalyzer.patternExtractor.extractPatterns('path/to/project');

console.log(`Found ${patterns.battleAnimationPatterns.length} battle animation patterns`);
console.log(`Found ${patterns.conditionalLogicPatterns.length} conditional logic patterns`);
console.log(`Found ${patterns.customEvalPatterns.length} custom evaluation patterns`);
console.log(`Found ${patterns.gameTagPatterns.length} game tag patterns`);
```

## Battle Animation Analyzer

The Battle Animation Analyzer module analyzes battle animation scripts in RPG Maker MV data files.

### Analysis Features

- Extracts animation commands and parameters
- Identifies common command sequences
- Maps animations to skill mechanics
- Generates sequence diagrams

### Example

```javascript
const battleAnimations = await jsAnalyzer.battleAnimationAnalyzer.analyzeBattleAnimations('path/to/project');

console.log(`Analyzed ${battleAnimations.animations.length} battle animations`);
console.log(`Found ${Object.keys(battleAnimations.commands.frequency).length} unique commands`);
console.log(`Found ${battleAnimations.sequences.length} common command sequences`);
```

## Conditional Logic Analyzer

The Conditional Logic Analyzer module analyzes conditional logic scripts in RPG Maker MV data files.

### Analysis Features

- Extracts conditions and decision trees
- Identifies state transitions
- Tracks variable and switch usage
- Generates flowcharts

### Example

```javascript
const conditionalLogic = await jsAnalyzer.conditionalLogicAnalyzer.analyzeConditionalLogic('path/to/project');

console.log(`Analyzed ${conditionalLogic.conditions.length} conditions`);
console.log(`Found ${conditionalLogic.decisionTrees.length} decision trees`);
console.log(`Found ${Object.keys(conditionalLogic.variableUsage).length} variables used`);
console.log(`Found ${Object.keys(conditionalLogic.switchUsage).length} switches used`);
```

## Custom Eval Analyzer

The Custom Eval Analyzer module analyzes custom evaluation scripts in RPG Maker MV data files.

### Analysis Features

- Parses JavaScript code into AST-like structure
- Extracts variables, functions, and conditionals
- Identifies dependencies between scripts
- Calculates complexity scores

### Example

```javascript
const customEvals = await jsAnalyzer.customEvalAnalyzer.analyzeCustomEvals('path/to/project');

console.log(`Analyzed ${customEvals.evaluations.length} custom evaluations`);
console.log(`Found ${Object.keys(customEvals.dependencies.variables).length} variables used`);
console.log(`Found ${Object.keys(customEvals.dependencies.functions).length} functions used`);
console.log(`Found ${Object.keys(customEvals.dependencies.objects).length} objects used`);
```

## Game Tag Analyzer

The Game Tag Analyzer module analyzes game tags in RPG Maker MV data files.

### Analysis Features

- Extracts tags and values
- Identifies JavaScript usage in tags
- Analyzes tag value distribution
- Maps relationships between tags

### Example

```javascript
const gameTags = await jsAnalyzer.gameTagAnalyzer.analyzeGameTags('path/to/project');

console.log(`Analyzed ${gameTags.tags.length} game tags`);
console.log(`Found ${Object.keys(gameTags.tagsByType).length} tag types`);
console.log(`Found ${gameTags.statistics.javascriptUsage.total} tags with JavaScript`);
```

## Relationship Mapper

The Relationship Mapper module maps relationships between JavaScript and game elements in RPG Maker MV data files.

### Mapping Features

- Maps scripts to game mechanics
- Maps game mechanics to scripts
- Maps scripts to other scripts
- Generates dependency graphs

### Example

```javascript
const relationships = await jsAnalyzer.relationshipMapper.mapJavaScriptRelationships('path/to/project', {
  battleAnimations,
  conditionalLogic,
  customEvals,
  gameTags
});

console.log(`Mapped ${Object.keys(relationships.dependencies.scriptToMechanic).length} script-to-mechanic dependencies`);
console.log(`Mapped ${Object.keys(relationships.dependencies.mechanicToScript).length} mechanic-to-script dependencies`);
console.log(`Mapped ${Object.keys(relationships.dependencies.scriptToScript).length} script-to-script dependencies`);
```

## Visualizer

The Visualizer module generates visual representations of JavaScript analysis in RPG Maker MV data files.

### Visualization Types

- **Battle Animation Diagrams**: Sequence diagrams for battle animations
- **Decision Tree Diagrams**: Flowcharts for conditional logic
- **Dependency Graphs**: Graphs showing relationships between scripts and mechanics
- **Statistics Diagrams**: Charts showing JavaScript usage statistics

### Example

```javascript
const visualizations = await jsAnalyzer.visualizer.generateVisualizations('path/to/project', {
  battleAnimations,
  conditionalLogic,
  customEvals,
  gameTags,
  relationships
}, {
  outputDir: 'path/to/output'
});

console.log(`Generated ${visualizations.battleAnimationDiagrams.length} battle animation diagrams`);
console.log(`Generated ${visualizations.decisionTreeDiagrams.length} decision tree diagrams`);
console.log(`Generated ${visualizations.dependencyGraphs.length} dependency graphs`);
console.log(`Generated ${visualizations.statisticsDiagrams.length} statistics diagrams`);
```

## Output Formats

The Visualizer module supports multiple output formats:

- **HTML**: Interactive visualizations with Mermaid.js
- **Markdown**: Visualizations as Markdown with Mermaid code blocks
- **Text**: Plain text representations of visualizations
- **JSON**: Raw visualization data

## Use Cases

The JavaScript Analyzer module can be used for various purposes:

- **Understanding Game Mechanics**: Analyze how JavaScript code affects game mechanics
- **Debugging**: Identify issues in JavaScript code
- **Documentation**: Generate documentation for JavaScript patterns
- **Refactoring**: Identify patterns for refactoring
- **AI Integration**: Provide context for AI tools to generate new content
