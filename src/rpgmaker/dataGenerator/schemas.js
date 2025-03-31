/**
 * RPG Maker MV Data Schemas
 * 
 * This module defines JSON schemas for RPG Maker MV data structures.
 * Each schema includes validation rules and a template with default values.
 */

// Common schema definitions used across multiple data types
const commonDefinitions = {
  trait: {
    type: 'object',
    properties: {
      code: { type: 'integer' },
      dataId: { type: 'integer' },
      value: { type: 'number' }
    },
    required: ['code', 'dataId', 'value']
  },
  effect: {
    type: 'object',
    properties: {
      code: { type: 'integer' },
      dataId: { type: 'integer' },
      value1: { type: 'number' },
      value2: { type: 'number' }
    },
    required: ['code', 'dataId', 'value1', 'value2']
  }
};

// Actor schema
const actorSchema = {
  id: 'actor',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    nickname: { type: 'string' },
    classId: { type: 'integer' },
    initialLevel: { type: 'integer' },
    maxLevel: { type: 'integer' },
    characterName: { type: 'string' },
    characterIndex: { type: 'integer' },
    faceIndex: { type: 'integer' },
    faceName: { type: 'string' },
    equips: { 
      type: 'array',
      items: { type: 'integer' }
    },
    profile: { type: 'string' },
    note: { type: 'string' },
    traits: {
      type: 'array',
      items: { $ref: '#/definitions/trait' }
    }
  },
  required: ['id', 'name', 'classId', 'initialLevel', 'maxLevel', 'characterName', 'faceName', 'equips'],
  definitions: commonDefinitions,
  template: {
    id: 1,
    name: 'Actor',
    nickname: '',
    classId: 1,
    initialLevel: 1,
    maxLevel: 99,
    characterName: 'Actor1',
    characterIndex: 0,
    faceIndex: 0,
    faceName: 'Actor1',
    equips: [0, 0, 0, 0, 0],
    profile: '',
    note: '',
    traits: []
  }
};

// Item schema
const itemSchema = {
  id: 'item',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    iconIndex: { type: 'integer' },
    description: { type: 'string' },
    effects: {
      type: 'array',
      items: { $ref: '#/definitions/effect' }
    },
    price: { type: 'integer' },
    consumable: { type: 'boolean' },
    itypeId: { type: 'integer' },
    note: { type: 'string' }
  },
  required: ['id', 'name', 'iconIndex', 'price', 'consumable', 'itypeId'],
  definitions: commonDefinitions,
  template: {
    id: 1,
    name: 'Item',
    iconIndex: 1,
    description: '',
    effects: [],
    price: 100,
    consumable: true,
    itypeId: 1,
    note: ''
  }
};

// Skill schema
const skillSchema = {
  id: 'skill',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    iconIndex: { type: 'integer' },
    description: { type: 'string' },
    mpCost: { type: 'integer' },
    tpCost: { type: 'integer' },
    damage: {
      type: 'object',
      properties: {
        critical: { type: 'boolean' },
        elementId: { type: 'integer' },
        formula: { type: 'string' },
        type: { type: 'integer' },
        variance: { type: 'integer' }
      }
    },
    effects: {
      type: 'array',
      items: { $ref: '#/definitions/effect' }
    },
    message1: { type: 'string' },
    message2: { type: 'string' },
    occasion: { type: 'integer' },
    repeats: { type: 'integer' },
    scope: { type: 'integer' },
    speed: { type: 'integer' },
    stypeId: { type: 'integer' },
    successRate: { type: 'integer' },
    note: { type: 'string' }
  },
  required: ['id', 'name', 'iconIndex', 'mpCost', 'tpCost', 'damage', 'stypeId', 'successRate'],
  definitions: commonDefinitions,
  template: {
    id: 1,
    name: 'Skill',
    iconIndex: 1,
    description: '',
    mpCost: 0,
    tpCost: 0,
    damage: {
      critical: false,
      elementId: 0,
      formula: '0',
      type: 0,
      variance: 20
    },
    effects: [],
    message1: '',
    message2: '',
    occasion: 0,
    repeats: 1,
    scope: 0,
    speed: 0,
    stypeId: 1,
    successRate: 100,
    note: ''
  }
};

// Weapon schema
const weaponSchema = {
  id: 'weapon',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    iconIndex: { type: 'integer' },
    description: { type: 'string' },
    etypeId: { type: 'integer' },
    wtypeId: { type: 'integer' },
    params: {
      type: 'array',
      items: { type: 'integer' }
    },
    price: { type: 'integer' },
    traits: {
      type: 'array',
      items: { $ref: '#/definitions/trait' }
    },
    note: { type: 'string' }
  },
  required: ['id', 'name', 'iconIndex', 'etypeId', 'wtypeId', 'params', 'price'],
  definitions: commonDefinitions,
  template: {
    id: 1,
    name: 'Weapon',
    iconIndex: 1,
    description: '',
    etypeId: 1,
    wtypeId: 1,
    params: [0, 0, 0, 0, 0, 0, 0, 0],
    price: 500,
    traits: [],
    note: ''
  }
};

// Armor schema
const armorSchema = {
  id: 'armor',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    iconIndex: { type: 'integer' },
    description: { type: 'string' },
    etypeId: { type: 'integer' },
    atypeId: { type: 'integer' },
    params: {
      type: 'array',
      items: { type: 'integer' }
    },
    price: { type: 'integer' },
    traits: {
      type: 'array',
      items: { $ref: '#/definitions/trait' }
    },
    note: { type: 'string' }
  },
  required: ['id', 'name', 'iconIndex', 'etypeId', 'atypeId', 'params', 'price'],
  definitions: commonDefinitions,
  template: {
    id: 1,
    name: 'Armor',
    iconIndex: 1,
    description: '',
    etypeId: 2,
    atypeId: 1,
    params: [0, 0, 0, 0, 0, 0, 0, 0],
    price: 300,
    traits: [],
    note: ''
  }
};

// Enemy schema
const enemySchema = {
  id: 'enemy',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    battlerName: { type: 'string' },
    battlerHue: { type: 'integer' },
    params: {
      type: 'array',
      items: { type: 'integer' }
    },
    exp: { type: 'integer' },
    gold: { type: 'integer' },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          conditionParam1: { type: 'integer' },
          conditionParam2: { type: 'integer' },
          conditionType: { type: 'integer' },
          rating: { type: 'integer' },
          skillId: { type: 'integer' }
        }
      }
    },
    dropItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'integer' },
          dataId: { type: 'integer' },
          denominator: { type: 'integer' }
        }
      }
    },
    traits: {
      type: 'array',
      items: { $ref: '#/definitions/trait' }
    },
    note: { type: 'string' }
  },
  required: ['id', 'name', 'battlerName', 'params', 'exp', 'gold', 'actions', 'dropItems'],
  definitions: commonDefinitions,
  template: {
    id: 1,
    name: 'Enemy',
    battlerName: 'Bat',
    battlerHue: 0,
    params: [100, 0, 10, 10, 10, 10, 10, 10],
    exp: 10,
    gold: 5,
    actions: [
      {
        conditionParam1: 0,
        conditionParam2: 0,
        conditionType: 0,
        rating: 5,
        skillId: 1
      }
    ],
    dropItems: [
      {
        kind: 0,
        dataId: 0,
        denominator: 1
      },
      {
        kind: 0,
        dataId: 0,
        denominator: 1
      },
      {
        kind: 0,
        dataId: 0,
        denominator: 1
      }
    ],
    traits: [],
    note: ''
  }
};

module.exports = {
  actor: actorSchema,
  item: itemSchema,
  skill: skillSchema,
  weapon: weaponSchema,
  armor: armorSchema,
  enemy: enemySchema
};
