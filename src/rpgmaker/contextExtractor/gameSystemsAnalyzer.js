/**
 * Game Systems Analyzer for RPG Maker MV
 * 
 * This module analyzes game mechanics and systems in an RPG Maker MV project,
 * including combat, progression, economy, and other gameplay elements.
 */

const fs = require('fs-extra');
const path = require('path');
const { parseJson } = require('../../core');

/**
 * Analyze game systems from an RPG Maker MV project
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @returns {Promise<Object>} - Analyzed game systems
 */
async function analyzeGameSystems(projectPath) {
  const dataPath = path.join(projectPath, 'data');
  
  // Initialize game systems structure
  const gameSystems = {
    combat: {
      elements: [],
      skills: [],
      states: [],
      battleSystem: 'unknown',
      mechanics: [],
      skillTypes: [],
      enemies: [],
      troops: []
    },
    progression: {
      classes: [],
      levelSystem: {},
      skillProgression: {}
    },
    economy: {
      currency: '',
      items: [],
      shops: [],
      shopItems: []
    },
    equipment: {
      types: [],
      weapons: [],
      armors: [],
      slots: []
    },
    customSystems: []
  };

  try {
    // Extract system information from System.json
    const systemPath = path.join(dataPath, 'System.json');
    if (await fs.pathExists(systemPath)) {
      const systemData = parseJson(await fs.readFile(systemPath, 'utf8'));
      extractSystemInfo(systemData, gameSystems);
    }

    // Extract class information from Classes.json
    const classesPath = path.join(dataPath, 'Classes.json');
    if (await fs.pathExists(classesPath)) {
      const classes = parseJson(await fs.readFile(classesPath, 'utf8'));
      extractClassInfo(classes, gameSystems);
    }

    // Extract skill information from Skills.json
    const skillsPath = path.join(dataPath, 'Skills.json');
    if (await fs.pathExists(skillsPath)) {
      const skills = parseJson(await fs.readFile(skillsPath, 'utf8'));
      extractSkillInfo(skills, gameSystems);
    }

    // Extract item information from Items.json
    const itemsPath = path.join(dataPath, 'Items.json');
    if (await fs.pathExists(itemsPath)) {
      const items = parseJson(await fs.readFile(itemsPath, 'utf8'));
      extractItemInfo(items, gameSystems);
    }

    // Extract weapon information from Weapons.json
    const weaponsPath = path.join(dataPath, 'Weapons.json');
    if (await fs.pathExists(weaponsPath)) {
      const weapons = parseJson(await fs.readFile(weaponsPath, 'utf8'));
      extractWeaponInfo(weapons, gameSystems);
    }

    // Extract armor information from Armors.json
    const armorsPath = path.join(dataPath, 'Armors.json');
    if (await fs.pathExists(armorsPath)) {
      const armors = parseJson(await fs.readFile(armorsPath, 'utf8'));
      extractArmorInfo(armors, gameSystems);
    }

    // Extract state information from States.json
    const statesPath = path.join(dataPath, 'States.json');
    if (await fs.pathExists(statesPath)) {
      const states = parseJson(await fs.readFile(statesPath, 'utf8'));
      extractStateInfo(states, gameSystems);
    }

    // Extract enemy information from Enemies.json
    const enemiesPath = path.join(dataPath, 'Enemies.json');
    if (await fs.pathExists(enemiesPath)) {
      const enemies = parseJson(await fs.readFile(enemiesPath, 'utf8'));
      extractEnemyInfo(enemies, gameSystems);
    }

    // Extract troop information from Troops.json
    const troopsPath = path.join(dataPath, 'Troops.json');
    if (await fs.pathExists(troopsPath)) {
      const troops = parseJson(await fs.readFile(troopsPath, 'utf8'));
      extractTroopInfo(troops, gameSystems);
    }

    // Extract common events for custom systems
    const commonEventsPath = path.join(dataPath, 'CommonEvents.json');
    if (await fs.pathExists(commonEventsPath)) {
      const commonEvents = parseJson(await fs.readFile(commonEventsPath, 'utf8'));
      extractCustomSystems(commonEvents, gameSystems);
    }

    // Analyze plugins for custom systems
    await analyzePlugins(projectPath, gameSystems);

    // Analyze game balance
    analyzeGameBalance(gameSystems);

    return gameSystems;
  } catch (error) {
    throw new Error(`Error analyzing game systems: ${error.message}`);
  }
}

/**
 * Extract system information from System.json
 * @param {Object} systemData - System data
 * @param {Object} gameSystems - Game systems object to populate
 */
function extractSystemInfo(systemData, gameSystems) {
  // Extract battle system type
  gameSystems.combat.battleSystem = systemData.optSideView ? 'Side View' : 'Front View';
  
  // Extract elements
  if (systemData.elements) {
    // Skip first element (null)
    for (let i = 1; i < systemData.elements.length; i++) {
      const element = systemData.elements[i];
      if (element) {
        gameSystems.combat.elements.push({
          id: i,
          name: element
        });
      }
    }
  }
  
  // Extract skill types
  if (systemData.skillTypes) {
    // Skip first element (null)
    for (let i = 1; i < systemData.skillTypes.length; i++) {
      const skillType = systemData.skillTypes[i];
      if (skillType) {
        gameSystems.combat.skillTypes = gameSystems.combat.skillTypes || [];
        gameSystems.combat.skillTypes.push({
          id: i,
          name: skillType
        });
      }
    }
  }
  
  // Extract weapon types
  if (systemData.weaponTypes) {
    // Skip first element (null)
    for (let i = 1; i < systemData.weaponTypes.length; i++) {
      const weaponType = systemData.weaponTypes[i];
      if (weaponType) {
        gameSystems.equipment.types.push({
          id: i,
          name: weaponType,
          category: 'Weapon'
        });
      }
    }
  }
  
  // Extract armor types
  if (systemData.armorTypes) {
    // Skip first element (null)
    for (let i = 1; i < systemData.armorTypes.length; i++) {
      const armorType = systemData.armorTypes[i];
      if (armorType) {
        gameSystems.equipment.types.push({
          id: i,
          name: armorType,
          category: 'Armor'
        });
      }
    }
  }
  
  // Extract equipment slots
  if (systemData.equipTypes) {
    // Skip first element (null)
    for (let i = 1; i < systemData.equipTypes.length; i++) {
      const equipType = systemData.equipTypes[i];
      if (equipType) {
        gameSystems.equipment.slots = gameSystems.equipment.slots || [];
        gameSystems.equipment.slots.push({
          id: i,
          name: equipType
        });
      }
    }
  }
  
  // Extract currency
  if (systemData.currencyUnit) {
    gameSystems.economy.currency = systemData.currencyUnit;
  }
  
  // Extract game mechanics based on system settings
  const mechanics = [];
  
  if (systemData.optDisplayTp) {
    mechanics.push({
      name: 'TP System',
      description: 'Technical Points used for special abilities'
    });
  }
  
  if (systemData.optFloorDeath) {
    mechanics.push({
      name: 'Floor Death',
      description: 'Characters can die from walking on specific tiles'
    });
  }
  
  if (systemData.optFollowers) {
    mechanics.push({
      name: 'Party Followers',
      description: 'Party members follow the leader on the map'
    });
  }
  
  if (systemData.optSlipDeath) {
    mechanics.push({
      name: 'Slip Death',
      description: 'Characters can die from damage over time effects'
    });
  }
  
  gameSystems.combat.mechanics = mechanics;
}

/**
 * Extract class information from Classes.json
 * @param {Array} classes - Classes array
 * @param {Object} gameSystems - Game systems object to populate
 */
function extractClassInfo(classes, gameSystems) {
  const classInfo = [];
  
  // Skip first element (null)
  for (let i = 1; i < classes.length; i++) {
    const classData = classes[i];
    if (!classData) continue;
    
    const classObj = {
      id: classData.id,
      name: classData.name,
      expCurve: classData.expParams || [],
      params: classData.params || [],
      traits: classData.traits || [],
      learnings: []
    };
    
    // Extract skill learning
    if (classData.learnings) {
      classData.learnings.forEach(learning => {
        classObj.learnings.push({
          level: learning.level,
          skillId: learning.skillId
        });
      });
    }
    
    classInfo.push(classObj);
  }
  
  gameSystems.progression.classes = classInfo;
  
  // Analyze level progression
  if (classInfo.length > 0) {
    const firstClass = classInfo[0];
    
    // Determine level progression type based on exp curve
    if (firstClass.expCurve && firstClass.expCurve.length >= 4) {
      const [base, extra, acc_a, acc_b] = firstClass.expCurve;
      
      let progressionType = 'Linear';
      if (acc_a > 2) {
        progressionType = 'Exponential';
      } else if (acc_a < 1) {
        progressionType = 'Diminishing Returns';
      }
      
      gameSystems.progression.levelSystem = {
        type: progressionType,
        baseExp: base,
        extraExp: extra,
        accelerationA: acc_a,
        accelerationB: acc_b
      };
    }
    
    // Analyze skill progression
    const skillProgressionByClass = {};
    
    classInfo.forEach(cls => {
      const skillProgression = {
        earlySkills: [],
        midSkills: [],
        lateSkills: []
      };
      
      cls.learnings.forEach(learning => {
        const skillLevel = {
          level: learning.level,
          skillId: learning.skillId
        };
        
        if (learning.level <= 10) {
          skillProgression.earlySkills.push(skillLevel);
        } else if (learning.level <= 30) {
          skillProgression.midSkills.push(skillLevel);
        } else {
          skillProgression.lateSkills.push(skillLevel);
        }
      });
      
      skillProgressionByClass[cls.name] = skillProgression;
    });
    
    gameSystems.progression.skillProgression = skillProgressionByClass;
  }
}

/**
 * Extract skill information from Skills.json
 * @param {Array} skills - Skills array
 * @param {Object} gameSystems - Game systems object to populate
 */
function extractSkillInfo(skills, gameSystems) {
  const skillInfo = [];
  
  // Skip first element (null)
  for (let i = 1; i < skills.length; i++) {
    const skill = skills[i];
    if (!skill) continue;
    
    skillInfo.push({
      id: skill.id,
      name: skill.name,
      description: skill.description || '',
      iconIndex: skill.iconIndex,
      mpCost: skill.mpCost,
      tpCost: skill.tpCost,
      damage: {
        type: (skill.damage && skill.damage.type) ? skill.damage.type : 0,
        elementId: (skill.damage && skill.damage.elementId) ? skill.damage.elementId : 0,
        formula: (skill.damage && skill.damage.formula) ? skill.damage.formula : '',
        variance: (skill.damage && skill.damage.variance) ? skill.damage.variance : 0,
        critical: (skill.damage && skill.damage.critical) ? skill.damage.critical : false
      },
      effects: skill.effects || [],
      hitType: skill.hitType,
      occasion: skill.occasion,
      repeats: skill.repeats || 1,
      scope: skill.scope,
      speed: skill.speed,
      successRate: skill.successRate,
      tpGain: skill.tpGain
    });
  }
  
  gameSystems.combat.skills = skillInfo;
  
  // Analyze skill types
  const skillTypes = {};
  
  skillInfo.forEach(skill => {
    // Determine skill type based on damage type
    let type = 'Unknown';
    
    if (skill.damage.type === 1) {
      type = 'HP Damage';
    } else if (skill.damage.type === 2) {
      type = 'MP Damage';
    } else if (skill.damage.type === 3) {
      type = 'HP Recovery';
    } else if (skill.damage.type === 4) {
      type = 'MP Recovery';
    } else if (skill.damage.type === 5) {
      type = 'HP Drain';
    } else if (skill.damage.type === 6) {
      type = 'MP Drain';
    } else if (skill.damage.type === 0) {
      type = 'Special';
    }
    
    if (!skillTypes[type]) {
      skillTypes[type] = [];
    }
    
    skillTypes[type].push(skill.id);
  });
  
  gameSystems.combat.skillTypes = skillTypes;
}

/**
 * Extract item information from Items.json
 * @param {Array} items - Items array
 * @param {Object} gameSystems - Game systems object to populate
 */
function extractItemInfo(items, gameSystems) {
  const itemInfo = [];
  const shopItems = [];
  
  // Skip first element (null)
  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;
    
    const itemObj = {
      id: item.id,
      name: item.name,
      description: item.description || '',
      iconIndex: item.iconIndex,
      price: item.price,
      consumable: item.consumable,
      occasion: item.occasion,
      effects: item.effects || [],
      scope: item.scope,
      speed: item.speed,
      successRate: item.successRate,
      hitType: item.hitType,
      damage: item.damage ? {
        type: (item.damage && item.damage.type) ? item.damage.type : 0,
        elementId: (item.damage && item.damage.elementId) ? item.damage.elementId : 0,
        formula: (item.damage && item.damage.formula) ? item.damage.formula : '',
        variance: (item.damage && item.damage.variance) ? item.damage.variance : 0,
        critical: (item.damage && item.damage.critical) ? item.damage.critical : false
      } : null
    };
    
    itemInfo.push(itemObj);
    
    // Add to shop items if it has a price
    if (item.price > 0) {
      shopItems.push({
        id: item.id,
        name: item.name,
        price: item.price,
        type: 'Item'
      });
    }
  }
  
  gameSystems.economy.items = itemInfo;
  gameSystems.economy.shopItems = shopItems;
  
  // Analyze item types
  const itemTypes = {
    'Consumable': [],
    'Key Item': [],
    'Battle': [],
    'Menu': [],
    'Never': [],
    'Always': []
  };
  
  itemInfo.forEach(item => {
    if (item.consumable) {
      itemTypes['Consumable'].push(item.id);
    }
    
    if (item.occasion === 0) {
      itemTypes['Always'].push(item.id);
    } else if (item.occasion === 1) {
      itemTypes['Battle'].push(item.id);
    } else if (item.occasion === 2) {
      itemTypes['Menu'].push(item.id);
    } else if (item.occasion === 3) {
      itemTypes['Never'].push(item.id);
    }
  });
  
  gameSystems.economy.itemTypes = itemTypes;
}

/**
 * Extract weapon information from Weapons.json
 * @param {Array} weapons - Weapons array
 * @param {Object} gameSystems - Game systems object to populate
 */
function extractWeaponInfo(weapons, gameSystems) {
  const weaponInfo = [];
  
  // Skip first element (null)
  for (let i = 1; i < weapons.length; i++) {
    const weapon = weapons[i];
    if (!weapon) continue;
    
    weaponInfo.push({
      id: weapon.id,
      name: weapon.name,
      description: weapon.description || '',
      iconIndex: weapon.iconIndex,
      price: weapon.price,
      wtypeId: weapon.wtypeId,
      animation: weapon.animationId,
      params: weapon.params || [],
      traits: weapon.traits || []
    });
    
    // Add to shop items if it has a price
    if (weapon.price > 0) {
      gameSystems.economy.shopItems = gameSystems.economy.shopItems || [];
      gameSystems.economy.shopItems.push({
        id: weapon.id,
        name: weapon.name,
        price: weapon.price,
        type: 'Weapon'
      });
    }
  }
  
  gameSystems.equipment.weapons = weaponInfo;
}

/**
 * Extract armor information from Armors.json
 * @param {Array} armors - Armors array
 * @param {Object} gameSystems - Game systems object to populate
 */
function extractArmorInfo(armors, gameSystems) {
  const armorInfo = [];
  
  // Skip first element (null)
  for (let i = 1; i < armors.length; i++) {
    const armor = armors[i];
    if (!armor) continue;
    
    armorInfo.push({
      id: armor.id,
      name: armor.name,
      description: armor.description || '',
      iconIndex: armor.iconIndex,
      price: armor.price,
      atypeId: armor.atypeId,
      etypeId: armor.etypeId,
      params: armor.params || [],
      traits: armor.traits || []
    });
    
    // Add to shop items if it has a price
    if (armor.price > 0) {
      gameSystems.economy.shopItems = gameSystems.economy.shopItems || [];
      gameSystems.economy.shopItems.push({
        id: armor.id,
        name: armor.name,
        price: armor.price,
        type: 'Armor'
      });
    }
  }
  
  gameSystems.equipment.armors = armorInfo;
}

/**
 * Extract state information from States.json
 * @param {Array} states - States array
 * @param {Object} gameSystems - Game systems object to populate
 */
function extractStateInfo(states, gameSystems) {
  const stateInfo = [];
  
  // Skip first element (null)
  for (let i = 1; i < states.length; i++) {
    const state = states[i];
    if (!state) continue;
    
    stateInfo.push({
      id: state.id,
      name: state.name,
      iconIndex: state.iconIndex,
      priority: state.priority,
      restriction: state.restriction,
      removeAtBattleEnd: state.removeAtBattleEnd,
      removeByDamage: state.removeByDamage,
      removeByWalking: state.removeByWalking,
      autoRemovalTiming: state.autoRemovalTiming,
      minTurns: state.minTurns,
      maxTurns: state.maxTurns,
      traits: state.traits || [],
      message1: state.message1 || '',
      message2: state.message2 || '',
      message3: state.message3 || '',
      message4: state.message4 || ''
    });
  }
  
  gameSystems.combat.states = stateInfo;
}

/**
 * Extract enemy information from Enemies.json
 * @param {Array} enemies - Enemies array
 * @param {Object} gameSystems - Game systems object to populate
 */
function extractEnemyInfo(enemies, gameSystems) {
  const enemyInfo = [];
  
  // Skip first element (null)
  for (let i = 1; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (!enemy) continue;
    
    enemyInfo.push({
      id: enemy.id,
      name: enemy.name,
      battlerName: enemy.battlerName,
      exp: enemy.exp,
      gold: enemy.gold,
      params: enemy.params || [],
      traits: enemy.traits || [],
      actions: enemy.actions || [],
      dropItems: enemy.dropItems || []
    });
  }
  
  gameSystems.combat.enemies = enemyInfo;
}

/**
 * Extract troop information from Troops.json
 * @param {Array} troops - Troops array
 * @param {Object} gameSystems - Game systems object to populate
 */
function extractTroopInfo(troops, gameSystems) {
  const troopInfo = [];
  
  // Skip first element (null)
  for (let i = 1; i < troops.length; i++) {
    const troop = troops[i];
    if (!troop) continue;
    
    troopInfo.push({
      id: troop.id,
      name: troop.name,
      members: troop.members || [],
      pages: troop.pages || []
    });
  }
  
  gameSystems.combat.troops = troopInfo;
}

/**
 * Extract custom systems from common events
 * @param {Array} commonEvents - Common events array
 * @param {Object} gameSystems - Game systems object to populate
 */
function extractCustomSystems(commonEvents, gameSystems) {
  const customSystems = [];
  
  // Skip first element (null)
  for (let i = 1; i < commonEvents.length; i++) {
    const event = commonEvents[i];
    if (!event || !event.list) continue;
    
    // Look for comments that might indicate custom systems
    let customSystemName = null;
    let customSystemDescription = null;
    
    for (let j = 0; j < event.list.length; j++) {
      const command = event.list[j];
      
      // Comment command (code 108 or 408)
      if ((command.code === 108 || command.code === 408) && command.parameters[0]) {
        const comment = command.parameters[0];
        
        // Look for custom system indicators in comments
        if (comment.includes('SYSTEM:')) {
          customSystemName = comment.split('SYSTEM:')[1].trim();
        } else if (comment.includes('DESCRIPTION:') && customSystemName) {
          customSystemDescription = comment.split('DESCRIPTION:')[1].trim();
        }
      }
    }
    
    if (customSystemName) {
      customSystems.push({
        name: customSystemName,
        description: customSystemDescription || 'Custom game system',
        commonEventId: event.id,
        commonEventName: event.name
      });
    }
  }
  
  gameSystems.customSystems = customSystems;
}

/**
 * Analyze plugins for custom systems
 * @param {string} projectPath - Path to the RPG Maker MV project
 * @param {Object} gameSystems - Game systems object to populate
 */
async function analyzePlugins(projectPath, gameSystems) {
  const pluginsPath = path.join(projectPath, 'js', 'plugins.js');
  
  if (await fs.pathExists(pluginsPath)) {
    try {
      const pluginsContent = await fs.readFile(pluginsPath, 'utf8');
      
      // Extract plugin information using regex
      const pluginRegex = /\{\s*name\s*:\s*["']([^"']+)["']/g;
      let match;
      const plugins = [];
      
      while ((match = pluginRegex.exec(pluginsContent)) !== null) {
        plugins.push(match[1]);
      }
      
      // Identify common plugins and their systems
      const knownPlugins = {
        'YEP_BattleEngineCore': {
          name: 'Yanfly Battle Engine',
          description: 'Enhanced battle system with action sequences and visual improvements'
        },
        'YEP_ItemCore': {
          name: 'Yanfly Item Core',
          description: 'Enhanced item system with categories, independent items, and item upgrading'
        },
        'YEP_SkillCore': {
          name: 'Yanfly Skill Core',
          description: 'Enhanced skill system with cost types, cooldowns, and requirements'
        },
        'YEP_ClassChangeCore': {
          name: 'Yanfly Class Change System',
          description: 'System for changing classes with preserved levels and unlockable classes'
        },
        'YEP_QuestJournal': {
          name: 'Quest Journal System',
          description: 'Comprehensive quest tracking system with categories and objectives'
        },
        'YEP_SaveCore': {
          name: 'Enhanced Save System',
          description: 'Improved save/load interface with file confirmation and custom save info'
        },
        'YEP_MainMenuManager': {
          name: 'Custom Menu System',
          description: 'Customizable main menu with command enablers and extensions'
        },
        'YEP_MessageCore': {
          name: 'Enhanced Message System',
          description: 'Improved message windows with word wrapping, text codes, and name windows'
        },
        'YEP_X_ItemUpgradeSlots': {
          name: 'Item Upgrade System',
          description: 'System for upgrading equipment with slots and upgrade materials'
        },
        'YEP_X_SkillCooldowns': {
          name: 'Skill Cooldown System',
          description: 'System for skill cooldowns and warmups'
        },
        'YEP_X_VisualHpGauge': {
          name: 'Visual HP Gauge System',
          description: 'Visual HP gauges for enemies and allies'
        },
        'YEP_X_ActorVariables': {
          name: 'Actor Variables System',
          description: 'Individual variables for each actor'
        },
        'YEP_ElementCore': {
          name: 'Enhanced Element System',
          description: 'Improved elemental interaction system with absorb, reflect, and amplify'
        },
        'YEP_EquipCore': {
          name: 'Enhanced Equipment System',
          description: 'Improved equipment system with slots, requirements, and custom parameters'
        },
        'YEP_StatusMenuCore': {
          name: 'Enhanced Status Menu',
          description: 'Customizable status menu with additional pages and information'
        },
        'YEP_X_PassiveAuras': {
          name: 'Passive Aura System',
          description: 'System for passive auras that affect allies or enemies'
        },
        'YEP_X_WeakEnemyPoses': {
          name: 'Enemy Pose System',
          description: 'System for changing enemy poses based on HP'
        },
        'YEP_X_AnimatedSVEnemies': {
          name: 'Animated Enemy System',
          description: 'System for animated side-view enemies'
        },
        'YEP_X_SkillCostItems': {
          name: 'Item Cost System',
          description: 'System for skills that cost items to use'
        },
        'YEP_X_MoreCurrencies': {
          name: 'Multiple Currency System',
          description: 'System for multiple currencies beyond gold'
        },
        'YEP_ShopMenuCore': {
          name: 'Enhanced Shop System',
          description: 'Improved shop system with buy/sell options and custom commands'
        },
        'YEP_X_LimitedSkillUses': {
          name: 'Limited Skill Uses System',
          description: 'System for skills with limited uses per battle or day'
        },
        'YEP_X_ItemDiscard': {
          name: 'Item Discard System',
          description: 'System for discarding unwanted items'
        },
        'YEP_X_ItemCategories': {
          name: 'Item Categories System',
          description: 'System for custom item categories'
        },
        'YEP_X_WeaponUnleash': {
          name: 'Weapon Unleash System',
          description: 'System for weapons that can unleash special skills'
        },
        'YEP_X_ArmorScaling': {
          name: 'Armor Scaling System',
          description: 'System for scaling armor effectiveness'
        },
        'YEP_X_CriticalControl': {
          name: 'Critical Hit System',
          description: 'Enhanced critical hit system with rates and damage'
        },
        'YEP_X_SkillMastery': {
          name: 'Skill Mastery System',
          description: 'System for mastering skills through usage'
        },
        'YEP_X_EquipRequirements': {
          name: 'Equipment Requirements System',
          description: 'System for equipment with stat or class requirements'
        },
        'YEP_X_TurnOrderDisplay': {
          name: 'Turn Order Display System',
          description: 'System for displaying turn order in battle'
        },
        'YEP_X_BattleSysCTB': {
          name: 'Conditional Turn Battle System',
          description: 'Turn-based battle system based on conditional turns'
        },
        'YEP_X_BattleSysATB': {
          name: 'Active Time Battle System',
          description: 'Active time-based battle system'
        },
        'YEP_X_BattleSysTB': {
          name: 'Tick-Based Battle System',
          description: 'Turn-based battle system based on ticks'
        },
        'YEP_X_BattleSysSTB': {
          name: 'Standard Turn Battle System',
          description: 'Enhanced standard turn-based battle system'
        },
        'YEP_X_BattleSysFTB': {
          name: 'Free Turn Battle System',
          description: 'Turn-based battle system with free actions'
        },
        'YEP_X_BattleSysPTB': {
          name: 'Press Turn Battle System',
          description: 'Turn-based battle system with press turns'
        },
        'YEP_X_BattleSysETB': {
          name: 'Energy Turn Battle System',
          description: 'Turn-based battle system with energy points'
        }
      };
      
      // Add identified plugins to custom systems
      plugins.forEach(plugin => {
        if (knownPlugins[plugin]) {
          gameSystems.customSystems.push({
            name: knownPlugins[plugin].name,
            description: knownPlugins[plugin].description,
            pluginName: plugin
          });
        }
      });
    } catch (error) {
      console.error(`Error analyzing plugins: ${error.message}`);
    }
  }
}

/**
 * Analyze game balance
 * @param {Object} gameSystems - Game systems object
 */
function analyzeGameBalance(gameSystems) {
  // Initialize balance analysis
  gameSystems.balance = {
    difficulty: 'Unknown',
    progression: 'Unknown',
    economyBalance: 'Unknown',
    combatBalance: 'Unknown',
    analysis: []
  };
  
  // Analyze difficulty based on enemies and items
  if (gameSystems.combat.enemies && gameSystems.combat.enemies.length > 0) {
    const enemies = gameSystems.combat.enemies;
    const avgEnemyExp = enemies.reduce((sum, enemy) => sum + enemy.exp, 0) / enemies.length;
    const avgEnemyGold = enemies.reduce((sum, enemy) => sum + enemy.gold, 0) / enemies.length;
    
    let difficulty = 'Medium';
    if (avgEnemyExp > 100 && avgEnemyGold > 100) {
      difficulty = 'Hard';
    } else if (avgEnemyExp < 30 && avgEnemyGold < 30) {
      difficulty = 'Easy';
    }
    
    gameSystems.balance.difficulty = difficulty;
    gameSystems.balance.analysis.push({
      aspect: 'Enemy Difficulty',
      value: difficulty,
      details: `Average enemy gives ${avgEnemyExp.toFixed(1)} EXP and ${avgEnemyGold.toFixed(1)} ${gameSystems.economy.currency}`
    });
  }
  
  // Analyze progression based on level system
  if (gameSystems.progression.levelSystem && gameSystems.progression.levelSystem.type) {
    const levelSystem = gameSystems.progression.levelSystem;
    
    gameSystems.balance.progression = levelSystem.type;
    gameSystems.balance.analysis.push({
      aspect: 'Level Progression',
      value: levelSystem.type,
      details: `Base EXP: ${levelSystem.baseExp}, Acceleration: ${levelSystem.accelerationA}`
    });
  }
  
  // Analyze economy based on items and equipment
  if (gameSystems.economy.shopItems && gameSystems.economy.shopItems.length > 0) {
    const shopItems = gameSystems.economy.shopItems;
    const avgItemPrice = shopItems.reduce((sum, item) => sum + item.price, 0) / shopItems.length;
    
    let economyBalance = 'Balanced';
    if (avgItemPrice > 1000) {
      economyBalance = 'Expensive';
    } else if (avgItemPrice < 100) {
      economyBalance = 'Cheap';
    }
    
    gameSystems.balance.economyBalance = economyBalance;
    gameSystems.balance.analysis.push({
      aspect: 'Economy',
      value: economyBalance,
      details: `Average item price: ${avgItemPrice.toFixed(1)} ${gameSystems.economy.currency}`
    });
  }
  
  // Analyze combat balance based on skills and states
  if (gameSystems.combat.skills && gameSystems.combat.skills.length > 0) {
    const skills = gameSystems.combat.skills;
    const damageSkills = skills.filter(skill => skill.damage && skill.damage.type === 1);
    
    if (damageSkills.length > 0) {
      const avgMpCost = damageSkills.reduce((sum, skill) => sum + skill.mpCost, 0) / damageSkills.length;
      
      let combatBalance = 'Balanced';
      if (avgMpCost > 20) {
        combatBalance = 'Resource-Intensive';
      } else if (avgMpCost < 5) {
        combatBalance = 'Resource-Light';
      }
      
      gameSystems.balance.combatBalance = combatBalance;
      gameSystems.balance.analysis.push({
        aspect: 'Combat Resources',
        value: combatBalance,
        details: `Average MP cost for damage skills: ${avgMpCost.toFixed(1)}`
      });
    }
  }
}

module.exports = {
  analyzeGameSystems
};
