/**
 * Simple RPG Maker MV World Lore Fixer
 * 
 * This script directly searches and replaces text in RPG Maker MV data files
 * without using the textReplacer module.
 * 
 * Usage:
 * node simple-fix-lore.js <path-to-rpgmaker-project>
 */

const fs = require('fs-extra');
const path = require('path');

// Get project path from command line arguments
const projectPath = process.argv[2];
if (!projectPath) {
  console.error('Please provide a path to an RPG Maker MV project');
  console.error('Usage: node simple-fix-lore.js <path-to-rpgmaker-project>');
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
    console.log('Starting simple-fix-lore script...');
    console.log(`Checking if ${projectPath} has a data directory...`);
    const dataPath = path.join(projectPath, 'data');
    const dataExists = await fs.pathExists(dataPath);
    if (!dataExists) {
      console.error(`Error: ${projectPath} does not have a data directory`);
      process.exit(1);
    }
    
    console.log('Data directory found. Processing files...');
    
    // Get all JSON files in the data directory
    const files = await fs.readdir(dataPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} JSON files to process.`);
    
    // Track replacements
    const results = {
      totalReplacements: 0,
      replacementsByTerm: {}
    };
    
    // Initialize results for each term
    for (const [term, replacement] of Object.entries(loreElements)) {
      results.replacementsByTerm[term] = {
        replacement,
        count: 0,
        files: []
      };
    }
    
    // Process each file
    for (const file of jsonFiles) {
      const filePath = path.join(dataPath, file);
      console.log(`Processing ${file}...`);
      
      try {
        // Read file content
        const content = await fs.readFile(filePath, 'utf8');
        
        // Process each lore element
        let updatedContent = content;
        let fileModified = false;
        
        for (const [term, replacement] of Object.entries(loreElements)) {
          // Create a regex to match the term
          const regex = new RegExp(term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
          
          // Check if the term exists in the file
          if (regex.test(updatedContent)) {
            // Count occurrences
            const matches = updatedContent.match(regex);
            const count = matches ? matches.length : 0;
            
            if (count > 0) {
              console.log(`  Found ${count} occurrences of "${term}" in ${file}`);
              
              // Replace the term
              updatedContent = updatedContent.replace(regex, replacement);
              
              // Update results
              results.replacementsByTerm[term].count += count;
              results.replacementsByTerm[term].files.push(file);
              results.totalReplacements += count;
              
              fileModified = true;
            }
          }
        }
        
        // Save the file if modified
        if (fileModified) {
          // Create backup
          const backupPath = path.join(dataPath, `${file}.bak`);
          await fs.writeFile(backupPath, content);
          
          // Write updated content
          await fs.writeFile(filePath, updatedContent);
          console.log(`  Updated ${file} and created backup`);
        }
      } catch (error) {
        console.error(`  Error processing ${file}: ${error.message}`);
      }
    }
    
    // Display results
    console.log(`\nCompleted ${results.totalReplacements} replacements:`);
    
    for (const [term, result] of Object.entries(results.replacementsByTerm)) {
      console.log(`  - Replaced "${term}" with "${result.replacement}" in ${result.count} places across ${result.files.length} files`);
      
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
    console.error(error.stack);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error in main function:');
  console.error(error);
  process.exit(1);
});
