/**
 * Example script for generating RPG Maker MV data
 * 
 * This script demonstrates how to use the data generator modules to create
 * RPG Maker MV data files. It generates sample actors, items, and other data
 * and saves them to JSON files.
 */

const fs = require('fs-extra');
const path = require('path');
const rpgmakerTools = require('../src/index');

// Ensure the output directory exists
const outputDir = path.join(__dirname, 'output');
fs.ensureDirSync(outputDir);

/**
 * Generate a sample actor
 */
async function generateSampleActor() {
  console.log('Generating sample actor...');
  
  // Configure the AI provider to use local templates
  rpgmakerTools.dataGenerator.aiProvider.configure({
    useLocalTemplates: true
  });
  
  // Generate an actor with a high-level description
  const heroActor = await rpgmakerTools.dataGenerator.generateActor({
    id: 1,
    description: 'A brave young warrior with fire magic abilities who left their village to seek adventure.',
    initialLevel: 5,
    maxLevel: 99,
    characteristics: ['warrior', 'fire', 'brave', 'young']
  });
  
  console.log('Generated actor:', heroActor.name);
  console.log('Nickname:', heroActor.nickname);
  console.log('Profile:', heroActor.profile);
  
  // Save the actor to a JSON file
  const actorsData = [null, heroActor]; // RPG Maker MV uses 1-based indexing with null at index 0
  await fs.writeJson(path.join(outputDir, 'Actors.json'), actorsData, { spaces: 2 });
  console.log('Saved actor to', path.join(outputDir, 'Actors.json'));
  
  return heroActor;
}

/**
 * Generate sample items
 */
async function generateSampleItems() {
  console.log('\nGenerating sample items...');
  
  // Generate a healing potion
  const potion = await rpgmakerTools.dataGenerator.generateItem({
    id: 1,
    name: 'Healing Potion',
    description: 'A basic potion that restores health.',
    itemType: 'healing',
    level: 1,
    characteristics: ['common', 'healing']
  });
  
  // Generate a buff item
  const buffItem = await rpgmakerTools.dataGenerator.generateItem({
    id: 2,
    name: 'Warrior\'s Charm',
    description: 'A charm that temporarily increases attack power.',
    itemType: 'buff',
    level: 2,
    characteristics: ['uncommon', 'buff']
  });
  
  // Generate a key item
  const keyItem = await rpgmakerTools.dataGenerator.generateItem({
    id: 3,
    name: 'Ancient Relic',
    description: 'A mysterious relic from an ancient civilization.',
    itemType: 'key',
    consumable: false,
    itypeId: 2, // Key item
    characteristics: ['rare', 'key']
  });
  
  const items = [null, potion, buffItem, keyItem]; // RPG Maker MV uses 1-based indexing with null at index 0
  
  console.log('Generated items:');
  items.forEach((item, index) => {
    if (item) {
      console.log(`${index}. ${item.name} - ${item.description}`);
    }
  });
  
  // Save the items to a JSON file
  await fs.writeJson(path.join(outputDir, 'Items.json'), items, { spaces: 2 });
  console.log('Saved items to', path.join(outputDir, 'Items.json'));
  
  return items;
}

/**
 * Generate a sample weapon
 */
async function generateSampleWeapon() {
  console.log('\nGenerating sample weapon...');
  
  // Generate a sword
  const sword = await rpgmakerTools.dataGenerator.generateWeapon({
    id: 1,
    name: 'Iron Sword',
    description: 'A basic iron sword.',
    level: 1,
    characteristics: ['common', 'iron']
  });
  
  const weapons = [null, sword]; // RPG Maker MV uses 1-based indexing with null at index 0
  
  console.log('Generated weapon:');
  console.log(`${sword.name} - ${sword.description}`);
  console.log(`ATK: ${sword.params[2]}, Price: ${sword.price}`);
  
  // Save the weapons to a JSON file
  await fs.writeJson(path.join(outputDir, 'Weapons.json'), weapons, { spaces: 2 });
  console.log('Saved weapons to', path.join(outputDir, 'Weapons.json'));
  
  return weapons;
}

/**
 * Generate a sample enemy
 */
async function generateSampleEnemy() {
  console.log('\nGenerating sample enemy...');
  
  // Generate a goblin enemy
  const goblin = await rpgmakerTools.dataGenerator.generateEnemy({
    id: 1,
    name: 'Goblin',
    description: 'A small, green-skinned creature that attacks travelers.',
    level: 2,
    characteristics: ['small', 'weak', 'numerous']
  });
  
  const enemies = [null, goblin]; // RPG Maker MV uses 1-based indexing with null at index 0
  
  console.log('Generated enemy:');
  console.log(`${goblin.name} - HP: ${goblin.params[0]}, ATK: ${goblin.params[2]}, DEF: ${goblin.params[3]}`);
  console.log(`EXP: ${goblin.exp}, Gold: ${goblin.gold}`);
  
  // Save the enemies to a JSON file
  await fs.writeJson(path.join(outputDir, 'Enemies.json'), enemies, { spaces: 2 });
  console.log('Saved enemies to', path.join(outputDir, 'Enemies.json'));
  
  return enemies;
}

/**
 * Generate a complete set of related data
 */
async function generateRelatedData() {
  console.log('\nGenerating related data set...');
  
  // Generate a complete set of related data
  const relatedData = await rpgmakerTools.dataGenerator.generateRelatedData({
    actor: {
      id: 2,
      name: 'Elara',
      description: 'A skilled mage specializing in ice magic, known for her calm demeanor and tactical mind.',
      initialLevel: 4,
      characteristics: ['mage', 'ice', 'intelligent', 'calm']
    },
    equipment: [
      {
        type: 'weapon',
        id: 2,
        name: 'Frost Staff',
        description: 'A staff imbued with ice magic.',
        level: 3,
        characteristics: ['uncommon', 'ice', 'wood']
      },
      {
        type: 'armor',
        id: 1,
        name: 'Mage Robe',
        description: 'Light robes that enhance magical abilities.',
        level: 2,
        characteristics: ['common', 'light']
      }
    ],
    skills: [
      {
        id: 1,
        name: 'Ice Shard',
        description: 'Launches a shard of ice at an enemy.',
        level: 1,
        characteristics: ['ice', 'damage', 'single']
      },
      {
        id: 2,
        name: 'Frost Barrier',
        description: 'Creates a barrier of ice that increases defense.',
        level: 2,
        characteristics: ['ice', 'buff', 'self']
      }
    ]
  });
  
  console.log('Generated related data:');
  console.log(`Actor: ${relatedData.actor.name}`);
  console.log('Equipment:');
  relatedData.equipment.forEach(item => {
    console.log(`- ${item.name}`);
  });
  console.log('Skills:');
  relatedData.skills.forEach(skill => {
    console.log(`- ${skill.name}: ${skill.description}`);
  });
  
  // Save the related data to JSON files
  // (In a real implementation, we would merge this with existing data)
  
  return relatedData;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('RPG Maker MV Data Generator Example');
    console.log('==================================');
    
    // Update the main index.js to include the data generator
    await updateMainIndex();
    
    // Generate sample data
    await generateSampleActor();
    await generateSampleItems();
    await generateSampleWeapon();
    await generateSampleEnemy();
    await generateRelatedData();
    
    console.log('\nAll data generated successfully!');
    console.log(`Output directory: ${outputDir}`);
  } catch (error) {
    console.error('Error generating data:', error);
  }
}

/**
 * Update the main index.js file to include the data generator
 */
async function updateMainIndex() {
  const indexPath = path.join(__dirname, '..', 'src', 'index.js');
  
  // Read the current index.js file
  let indexContent = await fs.readFile(indexPath, 'utf8');
  
  // Check if dataGenerator is already included
  if (!indexContent.includes('dataGenerator')) {
    // Add dataGenerator to the exports
    if (indexContent.includes('module.exports = {')) {
      // Add dataGenerator to the existing exports
      indexContent = indexContent.replace(
        'module.exports = {',
        'const dataGenerator = require(\'./rpgmaker/dataGenerator\');\n\nmodule.exports = {'
      );
      
      indexContent = indexContent.replace(
        /};\s*$/,
        '  dataGenerator\n};'
      );
      
      // Write the updated content back to the file
      await fs.writeFile(indexPath, indexContent, 'utf8');
      console.log('Updated main index.js to include dataGenerator');
    }
  }
}

// Run the main function
main();
