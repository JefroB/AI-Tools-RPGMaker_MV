/**
 * Direct RPG Maker MV World Lore Fixer
 * 
 * This script directly searches and replaces text in RPG Maker MV data files
 * without using any external modules.
 * 
 * Usage:
 * node direct-fix-lore.js <path-to-rpgmaker-project>
 */

const fs = require('fs');
const path = require('path');

// Get project path from command line arguments
const projectPath = process.argv[2];
if (!projectPath) {
  console.error('Please provide a path to an RPG Maker MV project');
  console.error('Usage: node direct-fix-lore.js <path-to-rpgmaker-project>');
  process.exit(1);
}

// Define lore elements to update
const loreElements = {
  // Replace "After Event" with "After Earth" in all game data
  'After Event': 'After Earth',
  
  // You can add more lore elements to fix here
  // 'Old Term': 'New Term',
};

// Simple function to check if a path exists
function pathExists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch (err) {
    return false;
  }
}

// Main function
function main() {
  try {
    console.log('Starting direct-fix-lore script...');
    console.log(`Checking if ${projectPath} has a data directory...`);
    
    const dataPath = path.join(projectPath, 'data');
    if (!pathExists(dataPath)) {
      console.error(`Error: ${projectPath} does not have a data directory`);
      process.exit(1);
    }
    
    console.log('Data directory found. Processing files...');
    
    // Get all JSON files in the data directory
    const files = fs.readdirSync(dataPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} JSON files to process.`);
    
    // Track replacements
    const results = {
      totalReplacements: 0,
      replacementsByTerm: {}
    };
    
    // Initialize results for each term
    for (const term in loreElements) {
      results.replacementsByTerm[term] = {
        replacement: loreElements[term],
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
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Process each lore element
        let updatedContent = content;
        let fileModified = false;
        
        for (const term in loreElements) {
          const replacement = loreElements[term];
          
          // Simple string search and replace
          if (updatedContent.includes(term)) {
            // Count occurrences (simple approach)
            let count = 0;
            let pos = updatedContent.indexOf(term);
            while (pos !== -1) {
              count++;
              pos = updatedContent.indexOf(term, pos + 1);
            }
            
            if (count > 0) {
              console.log(`  Found ${count} occurrences of "${term}" in ${file}`);
              
              // Replace all occurrences
              const regex = new RegExp(term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
              updatedContent = updatedContent.replace(regex, replacement);
              
              // Update results
              results.replacementsByTerm[term].count += count;
              if (!results.replacementsByTerm[term].files.includes(file)) {
                results.replacementsByTerm[term].files.push(file);
              }
              results.totalReplacements += count;
              
              fileModified = true;
            }
          }
        }
        
        // Save the file if modified
        if (fileModified) {
          // Create backup
          const backupPath = path.join(dataPath, `${file}.bak`);
          fs.writeFileSync(backupPath, content);
          
          // Write updated content
          fs.writeFileSync(filePath, updatedContent);
          console.log(`  Updated ${file} and created backup`);
        }
      } catch (error) {
        console.error(`  Error processing ${file}: ${error.message}`);
      }
    }
    
    // Display results
    console.log(`\nCompleted ${results.totalReplacements} replacements:`);
    
    for (const term in results.replacementsByTerm) {
      const result = results.replacementsByTerm[term];
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

// Run the main function
main();
