# RPG Maker MV Data Structure

This document provides an overview of the data structure used in RPG Maker MV projects. Understanding this structure is helpful when working with the rpgmaker-ai-tools library.

## Overview

RPG Maker MV stores game data in JSON files located in the `data` directory of the project. These files contain information about various game elements such as actors, classes, items, maps, and more.

The data files are organized as follows:

- **Actors.json**: Contains information about the game's actors (playable characters)
- **Animations.json**: Contains information about animations used in the game
- **Armors.json**: Contains information about armor items
- **Classes.json**: Contains information about character classes
- **CommonEvents.json**: Contains information about common events
- **Enemies.json**: Contains information about enemies
- **Items.json**: Contains information about items
- **Map###.json**: Contains information about maps (where ### is the map ID)
- **MapInfos.json**: Contains information about all maps in the game
- **Skills.json**: Contains information about skills
- **States.json**: Contains information about states (status effects)
- **System.json**: Contains information about the game system
- **Tilesets.json**: Contains information about tilesets
- **Troops.json**: Contains information about enemy troops
- **Weapons.json**: Contains information about weapons

## Common Issues

RPG Maker MV data files can sometimes become corrupted or contain syntax errors. Common issues include:

- Missing commas between properties
- Malformed arrays
- Unescaped quotes in strings
- HTML content at the beginning of files

The rpgmaker-ai-tools library provides utilities to fix these issues and restore the data files to a valid state.

## Data Structure Details

### Actors.json

An array of actor objects, where each object contains:

```json
{
  "id": 1,
  "name": "Actor Name",
  "nickname": "Nickname",
  "classId": 1,
  "initialLevel": 1,
  "maxLevel": 99,
  "characterName": "Actor1",
  "characterIndex": 0,
  "faceIndex": 0,
  "faceName": "Actor1",
  "equips": [1, 1, 2, 3, 0],
  "profile": "Profile text",
  "note": "Note text",
  "traits": [
    {"code": 11, "dataId": 1, "value": 1.0},
    ...
  ]
}
```

### Classes.json

An array of class objects, where each object contains:

```json
{
  "id": 1,
  "name": "Class Name",
  "expParams": [30, 20, 30, 30],
  "params": [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    ...
  ],
  "learnings": [
    {"level": 1, "skillId": 1, "note": ""},
    ...
  ],
  "traits": [
    {"code": 11, "dataId": 1, "value": 1.0},
    ...
  ],
  "note": "Note text"
}
```

### Items.json

An array of item objects, where each object contains:

```json
{
  "id": 1,
  "name": "Item Name",
  "iconIndex": 1,
  "description": "Item description",
  "effects": [
    {"code": 11, "dataId": 0, "value1": 0, "value2": 0},
    ...
  ],
  "price": 100,
  "consumable": true,
  "itypeId": 1,
  "note": "Note text"
}
```

### Map###.json

A map object containing:

```json
{
  "displayName": "Map Name",
  "width": 17,
  "height": 13,
  "data": [0, 0, 0, ...],
  "events": [
    null,
    {
      "id": 1,
      "name": "Event Name",
      "note": "",
      "pages": [
        {
          "conditions": {"actorId": 1, "actorValid": false, ...},
          "directionFix": false,
          "image": {"characterIndex": 0, "characterName": "", ...},
          "list": [
            {"code": 0, "indent": 0, "parameters": []},
            ...
          ],
          "moveFrequency": 3,
          "moveRoute": {"list": [{"code": 0, "parameters": []}], ...},
          "moveSpeed": 3,
          "moveType": 0,
          "priorityType": 0,
          "stepAnime": false,
          "through": false,
          "trigger": 0,
          "walkAnime": true
        },
        ...
      ],
      "x": 8,
      "y": 6
    },
    ...
  ],
  "autoplayBgm": false,
  "autoplayBgs": false,
  "battleback1Name": "",
  "battleback2Name": "",
  "bgm": {"name": "", "pan": 0, "pitch": 100, "volume": 90},
  "bgs": {"name": "", "pan": 0, "pitch": 100, "volume": 90},
  "disableDashing": false,
  "encounterList": [],
  "encounterStep": 30,
  "parallaxLoopX": false,
  "parallaxLoopY": false,
  "parallaxName": "",
  "parallaxShow": true,
  "parallaxSx": 0,
  "parallaxSy": 0,
  "scrollType": 0,
  "specifyBattleback": false,
  "tilesetId": 1
}
```

### MapInfos.json

An array of map info objects, where each object contains:

```json
{
  "id": 1,
  "expanded": true,
  "name": "Map Name",
  "order": 1,
  "parentId": 0,
  "scrollX": 0,
  "scrollY": 0
}
```

### System.json

A system object containing:

```json
{
  "airship": {"bgm": {"name": "Ship3", "pan": 0, "pitch": 100, "volume": 90}, ...},
  "armorTypes": ["", "General Armor", "Magic Armor", "Light Armor", "Heavy Armor", "Small Shield", "Large Shield"],
  "attackMotions": [{"type": 0, "weaponImageId": 0}, ...],
  "battleBgm": {"name": "Battle1", "pan": 0, "pitch": 100, "volume": 90},
  "battleback1Name": "Grassland",
  "battleback2Name": "Grassland",
  "battlerHue": 0,
  "battlerName": "Dragon",
  "boat": {"bgm": {"name": "Ship1", "pan": 0, "pitch": 100, "volume": 90}, ...},
  "currencyUnit": "G",
  "defeatMe": {"name": "Defeat1", "pan": 0, "pitch": 100, "volume": 90},
  "editMapId": 1,
  "elements": ["", "Physical", "Fire", "Ice", "Thunder", "Water", "Earth", "Wind", "Light", "Darkness"],
  "equipTypes": ["", "Weapon", "Shield", "Head", "Body", "Accessory"],
  "gameTitle": "Game Title",
  "gameoverMe": {"name": "Gameover1", "pan": 0, "pitch": 100, "volume": 90},
  "locale": "en_US",
  "magicSkills": [1],
  "menuCommands": [true, true, true, true, true, true],
  "optDisplayTp": true,
  "optDrawTitle": true,
  "optExtraExp": false,
  "optFloorDeath": false,
  "optFollowers": true,
  "optSideView": false,
  "optSlipDeath": false,
  "optTransparent": false,
  "partyMembers": [1, 2, 3, 4],
  "ship": {"bgm": {"name": "Ship2", "pan": 0, "pitch": 100, "volume": 90}, ...},
  "skillTypes": ["", "Magic", "Special"],
  "sounds": [
    {"name": "Cursor2", "pan": 0, "pitch": 100, "volume": 90},
    ...
  ],
  "startMapId": 1,
  "startX": 8,
  "startY": 6,
  "switches": ["", "Switch 1", ...],
  "terms": {"basic": ["Level", "Lv", "HP", "HP", "MP", "MP", "TP", "TP", "EXP", "EXP"], ...},
  "testBattlers": [{"actorId": 1, "equips": [1, 1, 2, 3, 0], "level": 1}, ...],
  "testTroopId": 4,
  "title1Name": "Castle",
  "title2Name": "",
  "titleBgm": {"name": "Theme6", "pan": 0, "pitch": 100, "volume": 90},
  "variables": ["", "Variable 1", ...],
  "versionId": 1,
  "victoryMe": {"name": "Victory1", "pan": 0, "pitch": 100, "volume": 90},
  "weaponTypes": ["", "Axe", "Claw", "Spear", "Sword", "Katana", "Bow", "Dagger", "Hammer", "Staff", "Gun"],
  "windowTone": [0, 0, 0, 0],
  "plugins": [
    {"name": "Plugin1", "status": true, "description": "Plugin description", "parameters": {"param1": "value1", ...}},
    ...
  ]
}
```

## Note Fields

Many objects in RPG Maker MV data files contain a `note` field. This field can contain arbitrary text, including HTML and JavaScript code. The rpgmaker-ai-tools library provides utilities to analyze and fix issues in these note fields.

## Event Commands

Event commands in RPG Maker MV are stored in the `list` property of event pages. Each command is an object with the following properties:

- `code`: The command code
- `indent`: The indentation level
- `parameters`: An array of parameters for the command

For example:

```json
{
  "code": 101,
  "indent": 0,
  "parameters": ["Actor1", 0, 0, 2]
}
```

This represents a "Show Text" command with the face graphic "Actor1", face index 0, background type 0, and position 2.

## Traits

Traits in RPG Maker MV are stored as objects with the following properties:

- `code`: The trait code
- `dataId`: The data ID
- `value`: The trait value

For example:

```json
{
  "code": 11,
  "dataId": 1,
  "value": 1.0
}
```

This represents an "Element Rate" trait for element 1 with a value of 1.0.

## Effects

Effects in RPG Maker MV are stored as objects with the following properties:

- `code`: The effect code
- `dataId`: The data ID
- `value1`: The first value
- `value2`: The second value

For example:

```json
{
  "code": 11,
  "dataId": 0,
  "value1": 0,
  "value2": 0
}
```

This represents a "Common Event" effect with common event ID 0.

## Conclusion

Understanding the structure of RPG Maker MV data files is essential for working with the rpgmaker-ai-tools library. This document provides a high-level overview of the data structure, but for more detailed information, refer to the RPG Maker MV documentation or the source code of your RPG Maker MV project.
