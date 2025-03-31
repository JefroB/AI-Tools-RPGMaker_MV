/**
 * RPG Maker MV World Lore Fixer
 * 
 * This example demonstrates how to use the text replacement utilities
 * to fix lore elements across an RPG Maker MV project.
 * 
 * Usage:
 * node fix-world-lore.js <path-to-rpgmaker-project>
 */

const path = require('path');
const { utils } = require('../src/rpgmaker');

// Get project path from command line arguments
const projectPath = process.argv[2];
if (!projectPath) {
  console.error('Please provide a path to an RPG Maker MV project');
  console.error('Usage: node fix-world-lore.js <path-to-rpgmaker-project>');
  process.exit(1);
}

// Define lore elements to update
const loreElements = {
  // Replace "After Event" with "After Earth" in all game data
  'After Event': 'After Earth',
  
  // You can add more lore elements to fix here
  // 'Old Term': 'New Term',
};

async function main() {
  try {
    console.log(`Checking if ${projectPath} is a valid RPG Maker MV project...`);
    const isValid = await utils.isValidProject(projectPath);
    if (!isValid) {
      console.error(`Error: ${projectPath} is not a valid RPG Maker MV project`);
      process.exit(1);
    }
    
    console.log('Project is valid. Searching for lore elements to fix...');
    
    // First, search for occurrences to see what will be changed
    for (const [oldTerm, newTerm] of Object.entries(loreElements)) {
      const searchResults = await utils.searchText(projectPath, oldTerm);
      
      console.log(`\nFound ${searchResults.totalMatches} occurrences of "${oldTerm}" in ${Object.keys(searchResults.matchesByFile).length} files:`);
      
      // Display file details
      for (const [file, matches] of Object.entries(searchResults.matchesByFile)) {
        console.log(`  - ${file}: ${matches.length} occurrences`);
      }
    }
    
    // Ask for confirmation before making changes
    console.log('\nThe following replacements will be made:');
    for (const [oldTerm, newTerm] of Object.entries(loreElements)) {
      console.log(`  - Replace "${oldTerm}" with "${newTerm}"`);
    }
    
    // In a real application, you might want to add a prompt here
    // to confirm before proceeding with the replacements
    
    console.log('\nProceeding with replacements...');
    
    // Perform the replacements
    const results = await utils.updateLore(projectPath, loreElements);
    
    console.log(`\nCompleted ${results.totalReplacements} replacements:`);
    
    // Display detailed results
    for (const [oldTerm, result] of Object.entries(results.replacementsByTerm)) {
      console.log(`  - Replaced "${oldTerm}" with "${result.replacement}" in ${result.count} places across ${result.files.length} files`);
      
      if (result.files.length > 0) {
        console.log('    Files modified:');
        result.files.forEach(file => {
          console.log(`      - ${file}`);
        });
      }
    }
    
    console.log('\nLore update complete!');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
