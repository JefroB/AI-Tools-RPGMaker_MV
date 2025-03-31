/**
 * RPG Maker MV Context Extractor Example
 * 
 * This example demonstrates how to use the context extractor to analyze
 * an RPG Maker MV project and extract contextual information about the game.
 */

const path = require('path');
const fs = require('fs-extra');
const { contextExtractor } = require('../src/rpgmaker');

// Path to the RPG Maker MV project
const projectPath = process.argv[2] || 'D:/MegaEarth2049-AI edits';

// Output directory for extracted context
const outputDir = path.join(process.cwd(), 'rpgmaker-context');

// Ensure output directory exists
fs.ensureDirSync(outputDir);

/**
 * Extract context from an RPG Maker MV project
 */
async function extractContext() {
  console.log(`Extracting context from: ${projectPath}`);
  console.log('This may take a few moments depending on the size of the project...');
  
  try {
    // Extract all context
    const context = await contextExtractor.extractContext(projectPath);
    
    // Save full context to JSON file
    await fs.writeJson(path.join(outputDir, 'full-context.json'), context, { spaces: 2 });
    console.log(`Full context saved to: ${path.join(outputDir, 'full-context.json')}`);
    
    // Generate summaries
    const summaries = await contextExtractor.generateSummaries(projectPath, context);
    
    // Save summaries to JSON file
    await fs.writeJson(path.join(outputDir, 'summaries.json'), summaries, { spaces: 2 });
    console.log(`Summaries saved to: ${path.join(outputDir, 'summaries.json')}`);
    
    // Save narrative summary to Markdown file
    await fs.writeFile(
      path.join(outputDir, 'narrative-summary.md'),
      summaries.gameOverview + '\n\n' + summaries.narrative,
      'utf8'
    );
    console.log(`Narrative summary saved to: ${path.join(outputDir, 'narrative-summary.md')}`);
    
    // Save world summary to Markdown file
    await fs.writeFile(
      path.join(outputDir, 'world-summary.md'),
      summaries.world,
      'utf8'
    );
    console.log(`World summary saved to: ${path.join(outputDir, 'world-summary.md')}`);
    
    // Save character summary to Markdown file
    await fs.writeFile(
      path.join(outputDir, 'character-summary.md'),
      summaries.characters,
      'utf8'
    );
    console.log(`Character summary saved to: ${path.join(outputDir, 'character-summary.md')}`);
    
    // Save game systems summary to Markdown file
    await fs.writeFile(
      path.join(outputDir, 'game-systems-summary.md'),
      summaries.gameSystems,
      'utf8'
    );
    console.log(`Game systems summary saved to: ${path.join(outputDir, 'game-systems-summary.md')}`);
    
    // Generate a complete game guide
    const completeGuide = [
      summaries.gameOverview,
      summaries.narrative,
      summaries.world,
      summaries.characters,
      summaries.gameSystems
    ].join('\n\n');
    
    await fs.writeFile(
      path.join(outputDir, 'complete-game-guide.md'),
      completeGuide,
      'utf8'
    );
    console.log(`Complete game guide saved to: ${path.join(outputDir, 'complete-game-guide.md')}`);
    
    console.log('\nContext extraction complete!');
    console.log(`\nExtracted data saved to: ${outputDir}`);
    
    // Print some basic stats
    console.log('\nProject Statistics:');
    console.log(`- Project Name: ${context.projectName}`);
    console.log(`- Maps: ${context.world?.locations?.length || 0}`);
    console.log(`- Characters: ${context.characters?.characters?.length || 0}`);
    console.log(`- Skills: ${context.gameSystems?.combat?.skills?.length || 0}`);
    console.log(`- Items: ${context.gameSystems?.economy?.items?.length || 0}`);
    console.log(`- Quests: ${context.narrative?.mainStory?.mainQuests?.length || 0}`);
    
  } catch (error) {
    console.error('Error extracting context:', error);
  }
}

// Run the extraction
extractContext().catch(console.error);

/**
 * Usage Examples:
 * 
 * Extract context from a specific project:
 * node extract-context.js "path/to/rpgmaker/project"
 * 
 * Extract context from the default project:
 * node extract-context.js
 */
