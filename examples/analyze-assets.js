/**
 * RPG Maker MV Asset Analyzer Example
 * 
 * This example demonstrates how to use the Asset Creator module to analyze
 * image assets in an RPG Maker MV project and generate prompts for creating
 * new assets.
 */

const path = require('path');
const fs = require('fs-extra');
const { assetCreator } = require('../src/rpgmaker');

// Path to the RPG Maker MV project
const projectPath = process.argv[2] || 'D:/MegaEarth2049-AI edits';

// Output directory for asset analysis
const outputDir = path.join(process.cwd(), 'rpgmaker-assets');

// Ensure output directory exists
fs.ensureDirSync(outputDir);

/**
 * Analyze image assets in an RPG Maker MV project
 */
async function analyzeAssets() {
  console.log(`Analyzing image assets in: ${projectPath}`);
  console.log('This may take a few moments depending on the size of the project...');
  
  try {
    // Analyze image assets
    const assetAnalysis = await assetCreator.analyzeImageAssets(projectPath);
    
    // Save asset analysis to JSON file
    await fs.writeJson(path.join(outputDir, 'asset-analysis.json'), assetAnalysis, { spaces: 2 });
    console.log(`Asset analysis saved to: ${path.join(outputDir, 'asset-analysis.json')}`);
    
    // Generate summary report
    const summary = generateSummaryReport(assetAnalysis);
    await fs.writeFile(path.join(outputDir, 'asset-summary.md'), summary, 'utf8');
    console.log(`Asset summary saved to: ${path.join(outputDir, 'asset-summary.md')}`);
    
    // Generate prompts for missing assets
    if (assetAnalysis.missingAssets.length > 0) {
      console.log(`\nGenerating prompts for ${assetAnalysis.missingAssets.length} missing assets...`);
      
      // Create directory for prompts
      const promptsDir = path.join(outputDir, 'prompts');
      await fs.ensureDir(promptsDir);
      
      // Extract context from the project
      const { contextExtractor } = require('../src/rpgmaker');
      const context = await contextExtractor.extractContext(projectPath);
      
      // Generate prompts for each missing asset
      for (let i = 0; i < Math.min(assetAnalysis.missingAssets.length, 10); i++) {
        const missingAsset = assetAnalysis.missingAssets[i];
        
        try {
          const assetRequest = assetCreator.generateMissingAssetRequest(missingAsset, context);
          
          // Save prompt to file
          const promptFilename = `${missingAsset.type}_${path.basename(missingAsset.filename, '.png')}.md`;
          await fs.writeFile(
            path.join(promptsDir, promptFilename),
            assetRequest.claudePrompt,
            'utf8'
          );
          
          console.log(`Generated prompt for: ${missingAsset.filename}`);
        } catch (error) {
          console.error(`Error generating prompt for ${missingAsset.filename}: ${error.message}`);
        }
      }
      
      if (assetAnalysis.missingAssets.length > 10) {
        console.log(`Generated prompts for 10 out of ${assetAnalysis.missingAssets.length} missing assets.`);
        console.log('Run the script again with a different subset to generate more prompts.');
      } else {
        console.log(`Generated prompts for all ${assetAnalysis.missingAssets.length} missing assets.`);
      }
      
      console.log(`Prompts saved to: ${promptsDir}`);
    }
    
    // Print some basic stats
    console.log('\nAsset Statistics:');
    console.log(`- Total Character Assets: ${assetAnalysis.characterAssets.length}`);
    console.log(`- Total Map Assets: ${assetAnalysis.mapAssets.length}`);
    console.log(`- Total Battle Assets: ${assetAnalysis.battleAssets.length}`);
    console.log(`- Missing Assets: ${assetAnalysis.missingAssets.length}`);
    console.log(`- Unused Assets: ${assetAnalysis.unusedAssets.length}`);
    
  } catch (error) {
    console.error('Error analyzing assets:', error);
  }
}

/**
 * Generate a summary report of the asset analysis
 * @param {Object} assetAnalysis - Asset analysis data
 * @returns {string} - Summary report in Markdown format
 */
function generateSummaryReport(assetAnalysis) {
  let summary = `# RPG Maker MV Asset Analysis\n\n`;
  
  // Add project information
  summary += `## Project: ${assetAnalysis.projectName || 'Unknown'}\n\n`;
  
  // Add image directory statistics
  summary += `## Image Directories\n\n`;
  summary += `| Directory | File Count |\n`;
  summary += `|-----------|------------|\n`;
  
  for (const [dirName, dirInfo] of Object.entries(assetAnalysis.imageDirectories)) {
    summary += `| ${dirName} | ${dirInfo.fileCount} |\n`;
  }
  
  // Add character asset statistics
  if (assetAnalysis.characterAssets.length > 0) {
    summary += `\n## Character Assets\n\n`;
    summary += `Total Characters: ${assetAnalysis.characterAssets.length}\n\n`;
    
    const missingCharacterImages = assetAnalysis.characterAssets.filter(asset => !asset.hasCharacterImage).length;
    const missingFaceImages = assetAnalysis.characterAssets.filter(asset => !asset.hasFaceImage).length;
    const missingBattlerImages = assetAnalysis.characterAssets.filter(asset => !asset.hasBattlerImage).length;
    
    summary += `- Missing Character Sprites: ${missingCharacterImages}\n`;
    summary += `- Missing Face Portraits: ${missingFaceImages}\n`;
    summary += `- Missing Battler Sprites: ${missingBattlerImages}\n`;
    
    // List protagonists
    const protagonists = assetAnalysis.characterAssets.filter(asset => asset.isProtagonist);
    if (protagonists.length > 0) {
      summary += `\n### Protagonists\n\n`;
      summary += `| Name | Character Image | Face Image | Battler Image |\n`;
      summary += `|------|----------------|------------|---------------|\n`;
      
      for (const protagonist of protagonists) {
        summary += `| ${protagonist.name} | ${protagonist.hasCharacterImage ? '✓' : '✗'} | ${protagonist.hasFaceImage ? '✓' : '✗'} | ${protagonist.hasBattlerImage ? '✓' : '✗'} |\n`;
      }
    }
  }
  
  // Add map asset statistics
  if (assetAnalysis.mapAssets.length > 0) {
    summary += `\n## Map Assets\n\n`;
    summary += `Total Maps: ${assetAnalysis.mapAssets.length}\n\n`;
    
    const missingTilesets = assetAnalysis.mapAssets.filter(asset => asset.tileset && !asset.hasTilesetImages).length;
    const missingParallaxes = assetAnalysis.mapAssets.filter(asset => asset.parallaxName && !asset.hasParallaxImage).length;
    
    summary += `- Maps with Missing Tilesets: ${missingTilesets}\n`;
    summary += `- Maps with Missing Parallax Backgrounds: ${missingParallaxes}\n`;
  }
  
  // Add battle asset statistics
  if (assetAnalysis.battleAssets.length > 0) {
    summary += `\n## Battle Assets\n\n`;
    
    const enemies = assetAnalysis.battleAssets.filter(asset => asset.battlerName);
    const troops = assetAnalysis.battleAssets.filter(asset => asset.battleback1Name || asset.battleback2Name);
    
    summary += `- Total Enemies: ${enemies.length}\n`;
    summary += `- Total Troops: ${troops.length}\n`;
    
    const missingEnemyImages = enemies.filter(asset => !asset.hasEnemyImage).length;
    const missingBattleback1 = troops.filter(asset => asset.battleback1Name && !asset.hasBattleback1).length;
    const missingBattleback2 = troops.filter(asset => asset.battleback2Name && !asset.hasBattleback2).length;
    
    summary += `- Missing Enemy Images: ${missingEnemyImages}\n`;
    summary += `- Missing Battle Background Floors: ${missingBattleback1}\n`;
    summary += `- Missing Battle Background Walls: ${missingBattleback2}\n`;
  }
  
  // Add missing asset summary
  if (assetAnalysis.missingAssets.length > 0) {
    summary += `\n## Missing Assets\n\n`;
    summary += `Total Missing Assets: ${assetAnalysis.missingAssets.length}\n\n`;
    
    // Group by type
    const missingByType = {};
    for (const asset of assetAnalysis.missingAssets) {
      missingByType[asset.type] = (missingByType[asset.type] || 0) + 1;
    }
    
    summary += `| Asset Type | Count |\n`;
    summary += `|------------|-------|\n`;
    
    for (const [type, count] of Object.entries(missingByType)) {
      summary += `| ${type} | ${count} |\n`;
    }
    
    // List some examples
    summary += `\n### Examples of Missing Assets\n\n`;
    summary += `| Type | Filename | Related Entity |\n`;
    summary += `|------|----------|----------------|\n`;
    
    for (let i = 0; i < Math.min(assetAnalysis.missingAssets.length, 10); i++) {
      const asset = assetAnalysis.missingAssets[i];
      const relatedName = asset.relatedEntity.name || 
                          (asset.relatedEntity.tileset ? asset.relatedEntity.tileset.name : 'Unknown');
      
      summary += `| ${asset.type} | ${asset.filename} | ${relatedName} |\n`;
    }
    
    if (assetAnalysis.missingAssets.length > 10) {
      summary += `\n*And ${assetAnalysis.missingAssets.length - 10} more...*\n`;
    }
  }
  
  // Add unused asset summary
  if (assetAnalysis.unusedAssets.length > 0) {
    summary += `\n## Unused Assets\n\n`;
    summary += `Total Unused Assets: ${assetAnalysis.unusedAssets.length}\n\n`;
    
    // Group by type
    const unusedByType = {};
    for (const asset of assetAnalysis.unusedAssets) {
      unusedByType[asset.type] = (unusedByType[asset.type] || 0) + 1;
    }
    
    summary += `| Asset Type | Count |\n`;
    summary += `|------------|-------|\n`;
    
    for (const [type, count] of Object.entries(unusedByType)) {
      summary += `| ${type} | ${count} |\n`;
    }
    
    // List some examples
    summary += `\n### Examples of Unused Assets\n\n`;
    summary += `| Type | Filename |\n`;
    summary += `|------|----------|\n`;
    
    for (let i = 0; i < Math.min(assetAnalysis.unusedAssets.length, 10); i++) {
      const asset = assetAnalysis.unusedAssets[i];
      summary += `| ${asset.type} | ${asset.filename} |\n`;
    }
    
    if (assetAnalysis.unusedAssets.length > 10) {
      summary += `\n*And ${assetAnalysis.unusedAssets.length - 10} more...*\n`;
    }
  }
  
  return summary;
}

// Run the analysis
analyzeAssets().catch(console.error);

/**
 * Usage Examples:
 * 
 * Analyze assets in a specific project:
 * node analyze-assets.js "path/to/rpgmaker/project"
 * 
 * Analyze assets in the default project:
 * node analyze-assets.js
 */
