# RPG Maker MV Data Generator

The Data Generator module provides tools for generating structured JSON data for RPG Maker MV projects. It uses AI to create coherent and balanced game data based on high-level descriptions and parameters.

## Features

- **Structured JSON Output**: Generate valid RPG Maker MV data structures that can be directly imported into your game
- **AI-Powered Content Generation**: Create names, descriptions, and other content using AI
- **Stat Generation & Balancing**: Generate balanced stats based on level, characteristics, and game balance settings
- **Schema Validation**: Ensure generated data conforms to RPG Maker MV's expected format
- **Related Data Generation**: Generate interconnected data (e.g., actors with their equipment and skills)

## Installation

The Data Generator is included in the rpgmaker-ai-tools package:

```bash
npm install rpgmaker-ai-tools
```

## Usage

### Generating an Actor

```javascript
const rpgmakerTools = require('rpgmaker-ai-tools');

async function generateHero() {
  // Configure the AI provider (optional)
  rpgmakerTools.dataGenerator.aiProvider.configure({
    useLocalTemplates: true, // Use local templates instead of API calls
    // For API-based generation, you would configure provider and API keys
    // provider: 'openai',
    // apiKey: 'your-api-key'
  });
  
  // Generate an actor with a high-level description
  const hero = await rpgmakerTools.dataGenerator.generateActor({
    id: 1,
    description: 'A brave young warrior with fire magic abilities who left their village to seek adventure.',
    initialLevel: 5,
    maxLevel: 99,
    characteristics: ['warrior', 'fire', 'brave', 'young']
  });
  
  console.log('Generated hero:', hero);
  
  // Save to RPG Maker MV Actors.json file
  // Note: RPG Maker MV uses 1-based indexing with null at index 0
  const actorsData = [null, hero];
  const fs = require('fs-extra');
  await fs.writeJson('path/to/project/data/Actors.json', actorsData, { spaces: 2 });
}

generateHero();
```

### Generating an Item

```javascript
const rpgmakerTools = require('rpgmaker-ai-tools');

async function generatePotion() {
  // Generate a healing potion
  const potion = await rpgmakerTools.dataGenerator.generateItem({
    id: 1,
    name: 'Healing Potion',
    description: 'A basic potion that restores health.',
    itemType: 'healing',
    level: 1,
    characteristics: ['common', 'healing']
  });
  
  console.log('Generated potion:', potion);
  
  // Save to RPG Maker MV Items.json file
  const itemsData = [null, potion];
  const fs = require('fs-extra');
  await fs.writeJson('path/to/project/data/Items.json', itemsData, { spaces: 2 });
}

generatePotion();
```

### Generating Related Data

```javascript
const rpgmakerTools = require('rpgmaker-ai-tools');

async function generateCharacterSet() {
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
      }
    ]
  });
  
  console.log('Generated character set:', relatedData);
  
  // In a real implementation, you would save each component to its respective file
}

generateCharacterSet();
```

## API Reference

### Actor Generator

```javascript
rpgmakerTools.dataGenerator.generateActor(params, options)
```

Parameters:
- `params` (Object): Parameters for actor generation
  - `id` (number, optional): ID of the actor
  - `name` (string, optional): Name of the actor (will be generated if not provided)
  - `nickname` (string, optional): Nickname of the actor
  - `classId` (number, optional): Class ID of the actor (defaults to 1)
  - `initialLevel` (number, optional): Initial level of the actor (defaults to 1)
  - `maxLevel` (number, optional): Maximum level of the actor (defaults to 99)
  - `characterName` (string, optional): Character sprite name
  - `characterIndex` (number, optional): Character sprite index
  - `faceName` (string, optional): Face sprite name
  - `faceIndex` (number, optional): Face sprite index
  - `equips` (Array<number>, optional): Initial equipment
  - `profile` (string, optional): Character profile
  - `note` (string, optional): Note field
  - `traits` (Array<Object>, optional): Character traits
  - `characteristics` (Array<string>, optional): Descriptive characteristics
  - `description` (string, optional): High-level description of the actor
- `options` (Object, optional): Additional options for generation

Returns:
- Promise<Object>: Generated actor data

### Item Generator

```javascript
rpgmakerTools.dataGenerator.generateItem(params, options)
```

Parameters:
- `params` (Object): Parameters for item generation
  - `id` (number, optional): ID of the item
  - `name` (string, optional): Name of the item (will be generated if not provided)
  - `iconIndex` (number, optional): Icon index of the item
  - `description` (string, optional): Description of the item (will be generated if not provided)
  - `effects` (Array<Object>, optional): Effects of the item
  - `price` (number, optional): Price of the item (will be generated if not provided)
  - `consumable` (boolean, optional): Whether the item is consumable (defaults to true)
  - `itypeId` (number, optional): Item type ID (defaults to 1)
  - `note` (string, optional): Note field
  - `characteristics` (Array<string>, optional): Descriptive characteristics
  - `itemType` (string, optional): Type of item (e.g., 'healing', 'buff', 'key')
  - `level` (number, optional): Level/tier of the item (defaults to 1)
- `options` (Object, optional): Additional options for generation

Returns:
- Promise<Object>: Generated item data

### Weapon Generator

```javascript
rpgmakerTools.dataGenerator.generateWeapon(params, options)
```

Parameters:
- `params` (Object): Parameters for weapon generation
  - `id` (number, optional): ID of the weapon
  - `name` (string, optional): Name of the weapon (will be generated if not provided)
  - `iconIndex` (number, optional): Icon index of the weapon
  - `description` (string, optional): Description of the weapon (will be generated if not provided)
  - `etypeId` (number, optional): Equipment type ID (defaults to 1)
  - `wtypeId` (number, optional): Weapon type ID (defaults to 1)
  - `params` (Array<number>, optional): Parameters (ATK, DEF, etc.)
  - `price` (number, optional): Price of the weapon (will be generated if not provided)
  - `traits` (Array<Object>, optional): Weapon traits
  - `note` (string, optional): Note field
  - `characteristics` (Array<string>, optional): Descriptive characteristics
  - `level` (number, optional): Level/tier of the weapon (defaults to 1)
- `options` (Object, optional): Additional options for generation

Returns:
- Promise<Object>: Generated weapon data

### Armor Generator

```javascript
rpgmakerTools.dataGenerator.generateArmor(params, options)
```

Parameters:
- `params` (Object): Parameters for armor generation
  - `id` (number, optional): ID of the armor
  - `name` (string, optional): Name of the armor (will be generated if not provided)
  - `iconIndex` (number, optional): Icon index of the armor
  - `description` (string, optional): Description of the armor (will be generated if not provided)
  - `etypeId` (number, optional): Equipment type ID (defaults to 2)
  - `atypeId` (number, optional): Armor type ID (defaults to 1)
  - `params` (Array<number>, optional): Parameters (ATK, DEF, etc.)
  - `price` (number, optional): Price of the armor (will be generated if not provided)
  - `traits` (Array<Object>, optional): Armor traits
  - `note` (string, optional): Note field
  - `characteristics` (Array<string>, optional): Descriptive characteristics
  - `level` (number, optional): Level/tier of the armor (defaults to 1)
- `options` (Object, optional): Additional options for generation

Returns:
- Promise<Object>: Generated armor data

### Enemy Generator

```javascript
rpgmakerTools.dataGenerator.generateEnemy(params, options)
```

Parameters:
- `params` (Object): Parameters for enemy generation
  - `id` (number, optional): ID of the enemy
  - `name` (string, optional): Name of the enemy (will be generated if not provided)
  - `battlerName` (string, optional): Battler sprite name
  - `battlerHue` (number, optional): Battler hue
  - `params` (Array<number>, optional): Parameters (HP, MP, ATK, etc.)
  - `exp` (number, optional): Experience points (will be generated if not provided)
  - `gold` (number, optional): Gold (will be generated if not provided)
  - `actions` (Array<Object>, optional): Enemy actions
  - `dropItems` (Array<Object>, optional): Drop items
  - `traits` (Array<Object>, optional): Enemy traits
  - `note` (string, optional): Note field
  - `characteristics` (Array<string>, optional): Descriptive characteristics
  - `level` (number, optional): Level/tier of the enemy (defaults to 1)
- `options` (Object, optional): Additional options for generation

Returns:
- Promise<Object>: Generated enemy data

### Related Data Generator

```javascript
rpgmakerTools.dataGenerator.generateRelatedData(params, options)
```

Parameters:
- `params` (Object): Parameters for related data generation
  - `actor` (Object, optional): Parameters for actor generation
  - `equipment` (Array<Object>, optional): Parameters for equipment generation
  - `skills` (Array<Object>, optional): Parameters for skill generation
- `options` (Object, optional): Additional options for generation

Returns:
- Promise<Object>: Generated related data

### AI Provider Configuration

```javascript
rpgmakerTools.dataGenerator.aiProvider.configure(options)
```

Parameters:
- `options` (Object): Configuration options
  - `useLocalTemplates` (boolean, optional): Whether to use local templates instead of API calls
  - `templateDir` (string, optional): Directory for templates
  - `provider` (string, optional): AI provider ('openai', 'claude', 'template')
  - `maxRetries` (number, optional): Maximum retries for API calls
  - `timeout` (number, optional): Timeout for API calls (ms)
  - `temperature` (number, optional): Temperature for AI generation

### Stat Generator Configuration

```javascript
rpgmakerTools.dataGenerator.statGenerator.configure(options)
```

Parameters:
- `options` (Object): Configuration options
  - `difficulty` (number, optional): Difficulty multiplier (higher = harder)
  - `levelScaling` (number, optional): Level scaling factor (higher = faster stat growth)
  - `priceScaling` (number, optional): Price scaling factor (higher = more expensive items)
  - `randomVariation` (number, optional): Random variation percentage (0.0 - 1.0)

## Characteristics

The data generator uses characteristics to influence the generated content. Here are some examples of characteristics you can use:

### Role Characteristics
- `warrior`, `mage`, `healer`, `rogue`, `tank`

### Element Characteristics
- `fire`, `ice`, `lightning`, `earth`, `water`, `wind`, `light`, `dark`

### Rarity Characteristics
- `common`, `uncommon`, `rare`, `epic`, `legendary`

### Size Characteristics
- `small`, `medium`, `large`

### Material Characteristics
- `wood`, `iron`, `steel`, `silver`, `gold`, `mithril`, `adamantite`

### Effect Characteristics
- `healing`, `damage`, `buff`, `debuff`, `status`

## Examples

Check out the [examples/generate-data.js](../examples/generate-data.js) file for more detailed examples of how to use the data generator.

## Command Line Interface

The library includes a command line tool for generating RPG Maker MV data:

```bash
npx rpgmaker-ai-tools generate-data <path-to-project> [options]
```

Options:
- `--output-dir <dir>`: Directory to write generated data to
- `--type <type>`: Type of data to generate (actor, item, weapon, armor, enemy, all)
- `--count <number>`: Number of items to generate
- `--level <number>`: Level/tier of the generated data
- `--characteristics <list>`: Comma-separated list of characteristics
- `--description <text>`: High-level description for generation
- `--use-local-templates`: Use local templates instead of API calls
- `--difficulty <number>`: Difficulty multiplier (0.5-2.0)
