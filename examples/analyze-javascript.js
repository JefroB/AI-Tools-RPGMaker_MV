#!/usr/bin/env node
/**
 * RPG Maker MV JavaScript Analyzer Example
 * 
 * This script demonstrates how to use the JavaScript analysis tools to analyze
 * JavaScript code in RPG Maker MV data files.
 * 
 * Usage:
 *   node analyze-javascript.js <project-path> [options]
 * 
 * Options:
 *   --output-dir <dir>   Directory to write analysis results to
 *   --battle-animations  Include battle animation analysis
 *   --conditional-logic  Include conditional logic analysis
 *   --custom-evals      Include custom evaluation analysis
 *   --game-tags         Include game tag analysis
 *   --relationships     Include relationship mapping
 *   --visualizations    Generate visualizations
 *   --all               Include all analyses (default)
 */

const fs = require('fs-extra');
const path = require('path');
const { jsAnalyzer } = require('../src/rpgmaker');
const chalk = require('chalk');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Error: Project path is required');
  console.error('Usage: node analyze-javascript.js <project-path> [options]');
  process.exit(1);
}

const projectPath = args[0];
const options = {
  outputDir: null,
  includeBattleAnimations: false,
  includeConditionalLogic: false,
  includeCustomEvals: false,
  includeGameTags: false,
  includeRelationships: false,
  includeVisualizations: false
};

// Parse options
for (let i = 1; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--output-dir') {
    options.outputDir = args[++i];
  } else if (arg === '--battle-animations') {
    options.includeBattleAnimations = true;
  } else if (arg === '--conditional-logic') {
    options.includeConditionalLogic = true;
  } else if (arg === '--custom-evals') {
    options.includeCustomEvals = true;
  } else if (arg === '--game-tags') {
    options.includeGameTags = true;
  } else if (arg === '--relationships') {
    options.includeRelationships = true;
  } else if (arg === '--visualizations') {
    options.includeVisualizations = true;
  } else if (arg === '--all') {
    options.includeBattleAnimations = true;
    options.includeConditionalLogic = true;
    options.includeCustomEvals = true;
    options.includeGameTags = true;
    options.includeRelationships = true;
    options.includeVisualizations = true;
  }
}

// If no specific analyses are requested, include all
if (!options.includeBattleAnimations && 
    !options.includeConditionalLogic && 
    !options.includeCustomEvals && 
    !options.includeGameTags && 
    !options.includeRelationships) {
  options.includeBattleAnimations = true;
  options.includeConditionalLogic = true;
  options.includeCustomEvals = true;
  options.includeGameTags = true;
  options.includeRelationships = true;
}

// Validate project path
if (!fs.existsSync(projectPath)) {
  console.error(`Error: Project path '${projectPath}' does not exist`);
  process.exit(1);
}

// Validate output directory
if (options.outputDir && !fs.existsSync(options.outputDir)) {
  try {
    fs.mkdirSync(options.outputDir, { recursive: true });
  } catch (error) {
    console.error(`Error: Failed to create output directory '${options.outputDir}'`);
    console.error(error.message);
    process.exit(1);
  }
}

// Print analysis options
console.log(chalk.bold('RPG Maker MV JavaScript Analyzer'));
console.log(chalk.bold('==============================='));
console.log(`Project: ${chalk.cyan(projectPath)}`);
console.log(`Output: ${options.outputDir ? chalk.cyan(options.outputDir) : chalk.gray('None')}`);
console.log(`Analyses:`);
console.log(`  Battle Animations: ${options.includeBattleAnimations ? chalk.green('Yes') : chalk.red('No')}`);
console.log(`  Conditional Logic: ${options.includeConditionalLogic ? chalk.green('Yes') : chalk.red('No')}`);
console.log(`  Custom Evaluations: ${options.includeCustomEvals ? chalk.green('Yes') : chalk.red('No')}`);
console.log(`  Game Tags: ${options.includeGameTags ? chalk.green('Yes') : chalk.red('No')}`);
console.log(`  Relationships: ${options.includeRelationships ? chalk.green('Yes') : chalk.red('No')}`);
console.log(`  Visualizations: ${options.includeVisualizations ? chalk.green('Yes') : chalk.red('No')}`);
console.log();

// Run analysis
async function runAnalysis() {
  try {
    console.log(chalk.bold('Analyzing JavaScript in RPG Maker MV data files...'));
    
    // Extract JavaScript patterns
    console.log(chalk.yellow('Extracting JavaScript patterns...'));
    const patterns = await jsAnalyzer.patternExtractor.extractPatterns(projectPath);
    console.log(chalk.green(`Found ${patterns.battleAnimationPatterns.length} battle animation patterns`));
    console.log(chalk.green(`Found ${patterns.conditionalLogicPatterns.length} conditional logic patterns`));
    console.log(chalk.green(`Found ${patterns.customEvalPatterns.length} custom evaluation patterns`));
    console.log(chalk.green(`Found ${patterns.gameTagPatterns.length} game tag patterns`));
    
    // Initialize results
    const results = {
      projectName: path.basename(projectPath),
      patterns
    };
    
    // Analyze battle animations
    if (options.includeBattleAnimations) {
      console.log(chalk.yellow('Analyzing battle animations...'));
      results.battleAnimations = await jsAnalyzer.battleAnimationAnalyzer.analyzeBattleAnimations(projectPath);
      console.log(chalk.green(`Analyzed ${results.battleAnimations.animations ? results.battleAnimations.animations.length : 0} battle animations`));
    }
    
    // Analyze conditional logic
    if (options.includeConditionalLogic) {
      console.log(chalk.yellow('Analyzing conditional logic...'));
      results.conditionalLogic = await jsAnalyzer.conditionalLogicAnalyzer.analyzeConditionalLogic(projectPath);
      console.log(chalk.green(`Analyzed ${results.conditionalLogic.conditions ? results.conditionalLogic.conditions.length : 0} conditions`));
    }
    
    // Analyze custom evaluations
    if (options.includeCustomEvals) {
      console.log(chalk.yellow('Analyzing custom evaluations...'));
      results.customEvals = await jsAnalyzer.customEvalAnalyzer.analyzeCustomEvals(projectPath);
      console.log(chalk.green(`Analyzed ${results.customEvals.evaluations ? results.customEvals.evaluations.length : 0} custom evaluations`));
    }
    
    // Analyze game tags
    if (options.includeGameTags) {
      console.log(chalk.yellow('Analyzing game tags...'));
      results.gameTags = await jsAnalyzer.gameTagAnalyzer.analyzeGameTags(projectPath);
      console.log(chalk.green(`Analyzed ${results.gameTags.tags ? results.gameTags.tags.length : 0} game tags`));
    }
    
    // Map relationships
    if (options.includeRelationships) {
      console.log(chalk.yellow('Mapping JavaScript relationships...'));
      results.relationships = await jsAnalyzer.relationshipMapper.mapJavaScriptRelationships(projectPath, results);
      console.log(chalk.green('Mapped JavaScript relationships'));
    }
    
    // Generate visualizations
    if (options.includeVisualizations && options.outputDir) {
      console.log(chalk.yellow('Generating visualizations...'));
      const visualizations = await jsAnalyzer.visualizer.generateVisualizations(projectPath, results, {
        outputDir: path.join(options.outputDir, 'visualizations')
      });
      console.log(chalk.green(`Generated ${visualizations.outputFiles.length} visualization files`));
    }
    
    // Write results to file
    if (options.outputDir) {
      console.log(chalk.yellow('Writing analysis results...'));
      const outputPath = path.join(options.outputDir, 'js-analysis-results.json');
      await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
      console.log(chalk.green(`Analysis results written to ${outputPath}`));
    }
    
    console.log(chalk.bold.green('JavaScript analysis complete!'));
  } catch (error) {
    console.error(chalk.bold.red('Error analyzing JavaScript:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

runAnalysis();
