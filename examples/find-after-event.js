/**
 * Simple script to find "After Event" in RPG Maker MV files
 */

const fs = require('fs');
const path = require('path');

// Get project path from command line arguments
const projectPath = process.argv[2] || "d:/MegaEarth2049-AI edits/";

console.log('Starting find-after-event script...');
console.log(`Checking path: ${projectPath}`);

// Check if the path exists
try {
  fs.accessSync(projectPath);
  console.log(`Path exists: ${projectPath}`);
} catch (err) {
  console.error(`Error: ${projectPath} does not exist`);
  process.exit(1);
}

// Check if data directory exists
const dataPath = path.join(projectPath, 'data');
try {
  fs.accessSync(dataPath);
  console.log(`Data directory exists: ${dataPath}`);
} catch (err) {
  console.error(`Error: ${dataPath} does not exist`);
  process.exit(1);
}

// Get all JSON files in the data directory
const files = fs.readdirSync(dataPath);
const jsonFiles = files.filter(file => file.endsWith('.json'));
console.log(`Found ${jsonFiles.length} JSON files to process.`);

// Search for "After Event" in each file
let totalOccurrences = 0;
let filesWithOccurrences = [];

for (const file of jsonFiles) {
  const filePath = path.join(dataPath, file);
  console.log(`Checking ${file}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Simple string search
    if (content.includes('After Event')) {
      // Count occurrences
      let count = 0;
      let pos = content.indexOf('After Event');
      while (pos !== -1) {
        count++;
        pos = content.indexOf('After Event', pos + 1);
      }
      
      console.log(`  Found ${count} occurrences of "After Event" in ${file}`);
      totalOccurrences += count;
      filesWithOccurrences.push({ file, count });
    }
  } catch (error) {
    console.error(`  Error reading ${file}: ${error.message}`);
  }
}

// Display results
console.log(`\nFound ${totalOccurrences} total occurrences of "After Event" in ${filesWithOccurrences.length} files:`);
for (const { file, count } of filesWithOccurrences) {
  console.log(`  - ${file}: ${count} occurrences`);
}

console.log('\nSearch complete!');
