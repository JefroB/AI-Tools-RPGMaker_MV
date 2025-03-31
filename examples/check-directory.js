/**
 * Simple script to check if a directory exists and list its contents
 */

const fs = require('fs');
const path = require('path');

// Get directory path from command line arguments
const dirPath = process.argv[2] || "d:/MegaEarth2049-AI edits/";

console.log('Starting check-directory script...');
console.log(`Checking path: ${dirPath}`);

// Check if the path exists
try {
  fs.accessSync(dirPath);
  console.log(`Path exists: ${dirPath}`);
} catch (err) {
  console.error(`Error: ${dirPath} does not exist`);
  process.exit(1);
}

// Check if it's a directory
try {
  const stats = fs.statSync(dirPath);
  console.log(`Is directory: ${stats.isDirectory()}`);
  if (!stats.isDirectory()) {
    console.error(`Error: ${dirPath} is not a directory`);
    process.exit(1);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}

// List contents of the directory
try {
  const files = fs.readdirSync(dirPath);
  console.log(`\nContents of ${dirPath} (${files.length} items):`);
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    try {
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${stats.isDirectory() ? 'directory' : 'file'})`);
    } catch (err) {
      console.log(`  - ${file} (error: ${err.message})`);
    }
  });
} catch (err) {
  console.error(`Error listing directory: ${err.message}`);
  process.exit(1);
}

// Check if data directory exists
const dataPath = path.join(dirPath, 'data');
console.log(`\nChecking if data directory exists: ${dataPath}`);
try {
  fs.accessSync(dataPath);
  console.log(`Data directory exists: ${dataPath}`);
  
  // List contents of the data directory
  try {
    const files = fs.readdirSync(dataPath);
    console.log(`\nContents of ${dataPath} (${files.length} items):`);
    files.slice(0, 20).forEach(file => {
      const filePath = path.join(dataPath, file);
      try {
        const stats = fs.statSync(filePath);
        console.log(`  - ${file} (${stats.isDirectory() ? 'directory' : 'file'})`);
      } catch (err) {
        console.log(`  - ${file} (error: ${err.message})`);
      }
    });
    if (files.length > 20) {
      console.log(`  ... and ${files.length - 20} more items`);
    }
  } catch (err) {
    console.error(`Error listing data directory: ${err.message}`);
  }
} catch (err) {
  console.error(`Data directory does not exist: ${err.message}`);
}

console.log('\nCheck complete!');
