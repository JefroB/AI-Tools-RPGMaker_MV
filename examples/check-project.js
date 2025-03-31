/**
 * Simple script to check if a directory is a valid RPG Maker MV project
 */

const fs = require('fs-extra');
const path = require('path');

// Get project path from command line arguments
const projectPath = process.argv[2];
if (!projectPath) {
  console.error('Please provide a path to check');
  console.error('Usage: node check-project.js <path-to-check>');
  process.exit(1);
}

async function main() {
  try {
    console.log('Starting check-project script...');
    console.log(`Checking path: ${projectPath}`);
    
    // Check if the path exists
    const pathExists = await fs.pathExists(projectPath);
    console.log(`Path exists: ${pathExists}`);
    
    if (!pathExists) {
      console.error(`Error: ${projectPath} does not exist`);
      process.exit(1);
    }
    
    // Check if it's a directory
    const stats = await fs.stat(projectPath);
    console.log(`Is directory: ${stats.isDirectory()}`);
    
    if (!stats.isDirectory()) {
      console.error(`Error: ${projectPath} is not a directory`);
      process.exit(1);
    }
    
    // Check if data directory exists
    const dataPath = path.join(projectPath, 'data');
    const dataExists = await fs.pathExists(dataPath);
    console.log(`Data directory exists: ${dataExists}`);
    
    if (dataExists) {
      // List files in data directory
      const files = await fs.readdir(dataPath);
      console.log(`Files in data directory (${files.length} total):`);
      files.slice(0, 10).forEach(file => console.log(`  - ${file}`));
      if (files.length > 10) {
        console.log(`  ... and ${files.length - 10} more files`);
      }
      
      // Check for specific RPG Maker MV files
      const rpgMakerFiles = ['System.json', 'MapInfos.json', 'Actors.json'];
      for (const file of rpgMakerFiles) {
        const filePath = path.join(dataPath, file);
        const fileExists = await fs.pathExists(filePath);
        console.log(`${file} exists: ${fileExists}`);
      }
    }
    
    console.log('Check complete!');
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
