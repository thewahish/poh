// filename: game.js

// ===================================================================
//  GAME DATA LIBRARY
// ===================================================================

const GameConfig = {
    COMBAT: {
        fleeChance: 0.5,
        enemySkillChance: 0.4
    },
    PROGRESSION: {
        enemyScaleFactor: 0.5, // Increased for a steeper difficulty curve
        baseXpToLevel: 100,
        goldLossOnDeathPercent: 0.9,
        bossFloorInterval: 3 // A boss appears every 3 floors
    }
};

const Characters = {
    WARRIOR: { 
        id: 'warrior', name: 'Taha', name_ar: 'طه', resource: 'Vigor', resourceColor: '0xf1c40f',
        baseStats: { hp: 120, resource: 60, atk: 14, def: 10 }, // Slightly re-balanced
        statGainsPerLevel: { hp: 20, atk: 3, def: 2 },
        skill: { name: 'Power Strike', cost: 20, damageMultiplier: 1.8 }
    },
    SORCERESS: { 
        id: 'sorceress', name: 'Mais', name_ar: 'ميس', resource: 'Mana', resourceColor: '0x3498db',
        baseStats: { hp: 80, resource: 100, atk: 18, def: 6 },
        statGainsPerLevel: { hp: 10, atk: 4, def: 1 },
        skill: { name: 'Fireball', cost: 30, damageMultiplier: 2.2 }
    },
    ROGUE: { 
        id: 'rogue', name: 'Ibrahim', name_ar: 'إبراهيم', resource: 'Energy', resourceColor: '0x9b59b6',
        baseStats: { hp: 100, resource: 80, atk: 20, def: 8 },
        statGainsPerLevel: { hp: 15, atk: 3, def: 1 },
        skill: { name: 'Quick Strike', cost: 25, damageMultiplier: 1.5 }
    }
};

const Enemies = {
    GOBLIN: {
        id: 'goblin', name: 'Goblin', name_ar: 'عفريت',
        baseStats: { hp: 60, resource: 20, atk: 18, def: 6 }, // Re-balanced for more threat
        skill: { name: 'Vicious Stab', cost: 10, damageMultiplier: 1.5 },
        xpValue: 40,
        goldValue: 15
    },
    SLIME: {
        id: 'slime', name: 'Slime', name_ar: 'هلام',
        baseStats: { hp: 80, resource: 30, atk: 16, def: 10 }, // Re-balanced for more threat
        skill: { name: 'Corrosive Spit', cost: 15, damageMultiplier: 1.2 },
        xpValue: 50,
        goldValue: 20
    }
};

// --- NEW BOSS DATA ---
const Bosses = {
    ORC_WARLORD: {
        id: 'orc_warlord', name: 'Orc Warlord', name_ar: 'سيد حرب الأورك',
        baseStats: { hp: 250, resource: 100, atk: 25, def: 15 },
        skill: { name: 'Warlord\'s Smash', cost: 40, damageMultiplier: 2.0 },
        xpValue: 200,
        goldValue: 100
    }
};

const Items = {
    HEALTH_POTION: {
        id: 'hp_potion', name: 'Health Potion', name_ar: 'جرعة صحة',
        effect: 'heal_hp_percent', value: 0.4
    }
};

const Localization = {
    en: {
        gameTitle: "Path of Heroes", playButton: "New Game", charSelectTitle: "Choose Your Hero",
        startGameButton: "Start Journey", attackButton: "Attack", defendButton: "Defend",
        skillButton: "Skill", itemsButton: "Items", fleeButton: "Flee", youWin: "You are Victorious!",
        youLose: "You have been Defeated.", floorCleared: "Floor Cleared!", rewardTitle: "Choose Your Reward",
        rewardHeal: "Rest", rewardAtk: "Sharpen Weapon", rewardDef: "Reinforce Armor",
        rewardMaxHp: "Fortify", rewardMaxResource: "Focus", rewardItem: "Find Item", levelUp: "Level Up!",
    },
    ar: {
        gameTitle: "طريق الأبطال", playButton: "لعبة جديدة", charSelectTitle: "اختر بطلك",
        startGameButton: "ابدأ الرحلة", attackButton: "هجوم", defendButton: "دفاع",
        skillButton: "مهارة", itemsButton: "أدوات", fleeButton: "هروب", youWin: "لقد انتصرت!",
        youLose: "لقد هُزمت.", floorCleared: "تم اجتياز الطابق!", rewardTitle: "اختر مكافأتك",
        rewardHeal: "استراحة", rewardAtk: "شحذ السلاح", rewardDef: "تعزيز الدرع",
        rewardMaxHp: "تحصين", rewardMaxResource: "تركيز", rewardItem: "العثور على أداة", levelUp: "ارتفع مستواك!",
    }
};

let currentLang = 'en';

let PlayerData = {
    gold: 0,
    heroes: {
        'warrior': { level: 1, xp: 0, xpToNextLevel: GameConfig.PROGRESSION.baseXpToLevel },
        'sorceress': { level: 1, xp: 0, xpToNextLevel: GameConfig.PROGRESSION.baseXpToLevel },
        'rogue': { level: 1, xp: 0, xpToNextLevel: GameConfig.PROGRESSION.baseXpToLevel }
    }
};

let GameState = {
    currentFloor: 3, // Set to 3 for immediate boss testing
    hero: null 
};

// ===================================================================
//  UTILITY FUNCTIONS
// ===================================================================

function calculateDamage(attacker, defender, isSkill = false) {
    let damage = attacker.stats.atk;
    let defense = defender.stats.def;
    if (isSkill) {
        defense *= 0.5; // Skills ignore 50% of defense
    }
    const finalDamage = Math.max(1, damage - defense);
    return Math.floor(finalDamage);
}

function createHeroInstance(heroId) {
    const heroData = Characters[heroId.toUpperCase()];
    const heroProgress = PlayerData.heroes[heroId];
    
    let instance = {
        id: heroData.id,
        name: heroData.name,
        resourceName: heroData.resource,
        resourceColor: heroData.resourceColor,
        level: heroProgress.level,
        xp: heroProgress.xp,
        xpToNextLevel: heroProgress.xpToNextLevel,
        skill: heroData.skill,
        items: [{...Items.HEALTH_POTION, quantity: 1}],
        stats: { ...heroData.baseStats },
        maxStats: { ...heroData.baseStats }
    };

    // Apply level-up stats
    for (let i = 1; i < instance.level; i++) {
        instance.stats.hp += heroData.statGainsPerLevel.hp;
        instance.stats.atk += heroData.statGainsPerLevel.atk;
        instance.stats.def += heroData.statGainsPerLevel.def;
        instance.maxStats.hp += heroData.statGainsPerLevel.hp;
    }
    instance.currentHp = instance.stats.hp;
    instance.currentResource = instance.stats.resource;

    return instance;
}

// ===================================================================
//  UI HELPER CLASS
// ===================================================================
class UIHelper {
    constructor(scene) {
        this.scene = scene;
    }

    createText(x, y, text, size, color = '#ffffff', originX = 0.5, originY = 0.5) {
        return this.scene.add.text(x, y, text, {
            fontFamily: '"Cinzel", serif',
            fontSize: `${size}px`,
            color: color,
            align: 'center'
        }).setOrigin(originX, originY);
    }

    createButton(x, y, text, callback, width = 200, height = 50) {
        const container = this.scene.add.container(x, y);
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x4a2a0a, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        bg.lineStyle(2, 0x9a6a3a, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);

        const buttonText = this.createText(0, 0, text, 24, '#f1c40f');

        container.add([bg, buttonText]);
        container.setSize(width, height);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => bg.fillStyle(0x6a4a2a, 1).fillRoundedRect(-width / 2, -height / 2, width, height, 10));
        container.on('pointerout', () => bg.fillStyle(0x4a2a0a, 1).fillRoundedRect(-width / 2, -height / 2, width, height, 10));
        container.on('pointerdown', () => callback());

        return container;
    }
}


// ===================================================================
//  PHASER SCENES
// ===================================================================

class MainMenuScene extends Phaser.Scene {
    constructor() { super('MainMenuScene'); }

    create() {
        const { width, height } = this.scale;
        this.ui = new UIHelper(this);
        
        this.ui.createText(width / 2, height * 0.3, Localization[currentLang].gameTitle, 48, '#f1c40f');
        this.ui.createButton(width / 2, height * 0.6, Localization[currentLang].playButton, () => {
            this.scene.start('CharacterSelectScene');
        });
    }
}

class CharacterSelectScene extends Phaser.Scene {
    constructor() { super('CharacterSelectScene'); }

    create() {
        const { width, height } = this.scale;
        this.ui = new UIHelper(this);
        
        this.ui.createText(width / 2, 80, Localization[currentLang].charSelectTitle, 36, '#f1c40f');

        const characterKeys = Object.keys(Characters);
        characterKeys.forEach((key, index) => {
            const charData = Characters[key];
            const yPos = 200 + index * 180;
            
            // Character display box
            const bg = this.add.graphics();
            bg.fillStyle(0x1a1a1a, 0.8);
            bg.fillRoundedRect(width/2 - 180, yPos - 70, 360, 140, 15);
            bg.lineStyle(2, 0x4a2a0a, 1);
            bg.strokeRoundedRect(width/2 - 180, yPos - 70, 360, 140, 15);

            const name = currentLang === 'ar' ? charData.name_ar : charData.name;
            this.ui.createText(width / 2, yPos - 40, name, 32, '#f1c40f');
            
            const heroProgress = PlayerData.heroes[charData.id];
            this.ui.createText(width / 2, yPos, `Level: ${heroProgress.level}`, 20, '#ffffff');

            this.ui.createButton(width / 2, yPos + 45, Localization[currentLang].startGameButton, () => {
                GameState.hero = createHeroInstance(charData.id);
                GameState.currentFloor = 1; // Reset floor on new run
                this.scene.start('BattleScene');
            }, 180, 40);
        });
    }
}

class BattleScene extends Phaser.Scene {
    constructor() { super('BattleScene'); }

    init() {
        this.hero = GameState.hero;
        this.enemy = null;
        this.isPlayerTurn = true;
        this.isDefending = false;
        this.isGameOver = false;
    }

    create() {
        this.ui = new UIHelper(this);
        const { width, height } = this.scale;

        this.ui.createText(width / 2, 40, `Floor: ${GameState.currentFloor}`, 32, '#f1c40f');
        
        // --- NEW: BOSS FIGHT LOGIC ---
        // Check if the current floor is a boss floor
        const isBossFloor = GameState.currentFloor > 0 && GameState.currentFloor % GameConfig.PROGRESSION.bossFloorInterval === 0;

        if (isBossFloor) {
            this.spawnBoss();
        } else {
            this.spawnEnemy();
        }
        // --- END OF BOSS FIGHT LOGIC ---

        this.createCharacterUI(this.hero, width / 2, height - 280, true);
        this.createActionButtons();

        this.logText = this.ui.createText(width / 2, height / 2, '', 24, '#ffffff');
    }

    spawnEnemy() {
        const enemyKeys = Object.keys(Enemies);
        const randomKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
        const enemyData = { ...Enemies[randomKey] };

        const scale = 1 + (GameState.currentFloor - 1) * GameConfig.PROGRESSION.enemyScaleFactor;
        
        this.enemy = {
            ...enemyData,
            stats: {
                hp: Math.floor(enemyData.baseStats.hp * scale),
                atk: Math.floor(enemyData.baseStats.atk * scale),
                def: Math.floor(enemyData.baseStats.def * scale),
                resource: enemyData.baseStats.resource
            },
            currentHp: Math.floor(enemyData.baseStats.hp * scale),
            currentResource: enemyData.baseStats.resource
        };
        this.createCharacterUI(this.enemy, this.scale.width / 2, 200, false);
    }
    
    // --- NEW: SPAWN BOSS METHOD ---
    spawnBoss() {
        const bossKeys = Object.keys(Bosses);
        const randomKey = bossKeys[Math.floor(Math.random() * bossKeys.length)]; // In case we add more bosses
        const bossData = { ...Bosses[randomKey] };

        // Bosses scale too, but maybe at a different rate if we want later
        const scale = 1 + (GameState.currentFloor / GameConfig.PROGRESSION.bossFloorInterval - 1) * GameConfig.PROGRESSION.enemyScaleFactor;

        this.enemy = {
            ...bossData,
            stats: {
                hp: Math.floor(bossData.baseStats.hp * scale),
                atk: Math.floor(bossData.baseStats.atk * scale),
                def: Math.floor(bossData.baseStats.def * scale),
                resource: bossData.baseStats.resource
            },
            currentHp: Math.floor(bossData.baseStats.hp * scale),
            currentResource: bossData.baseStats.resource
        };
        
        // Use a different color for the boss name to make it stand out
        const ui = this.createCharacterUI(this.enemy, this.scale.width / 2, 200, false);
        ui.nameText.setColor('#ff4d4d'); // Red color for boss name
    }

    createCharacterUI(character, x, y, isPlayer) {
        const name = currentLang === 'ar' && character.name_ar ? character.name_ar : character.name;
        const nameText = this.ui.createText(x, y, name, 28, isPlayer ? '#66ccff' : '#ff6666');
        
        // Placeholder for character art
        const portrait = this.add.graphics();
        portrait.fillStyle(0x222222);
        portrait.fillRect(x - 50, y + 20, 100, 100);
        portrait.lineStyle(2, 0x555555);
        portrait.strokeRect(x - 50, y + 20, 100, 100);

        const hpBarBg = this.add.graphics().fillStyle(0x333333).fillRect(x - 100, y + 130, 200, 20);
        const hpBar = this.add.graphics().fillStyle(0xff0000).fillRect(x - 100, y + 130, 200, 20);
        const hpText = this.ui.createText(x, y + 140, `${character.currentHp}/${character.stats.hp}`, 16);

        let resourceBar, resourceText;
        if (character.stats.resource > 0) {
            const resourceColor = character.resourceColor ? parseInt(character.resourceColor) : 0x0000ff;
            const resourceBarBg = this.add.graphics().fillStyle(0x333333).fillRect(x - 100, y + 155, 200, 15);
            resourceBar = this.add.graphics().fillStyle(resourceColor).fillRect(x - 100, y + 155, 200, 15);
            resourceText = this.ui.createText(x, y + 162.5, `${character.currentResource}/${character.stats.resource}`, 12);
        }

        character.ui = { nameText, hpBar, hpText, resourceBar, resourceText };
        this.updateCharacterUI(character);
        return character.ui;
    }

    updateCharacterUI(character) {
        if (!character || !character.ui) return;
        character.ui.hpBar.clear().fillStyle(0xff0000).fillRect(character.ui.hpBar.x, character.ui.hpBar.y, 200 * (character.currentHp / character.stats.hp), 20);
        character.ui.hpText.setText(`${character.currentHp}/${character.stats.hp}`);
        
        if (character.ui.resourceBar) {
            const resourceColor = character.resourceColor ? parseInt(character.resourceColor) : 0x0000ff;
            character.ui.resourceBar.clear().fillStyle(resourceColor).fillRect(character.ui.resourceBar.x, character.ui.resourceBar.y, 200 * (character.currentResource / character.stats.resource), 15);
            character.ui.resourceText.setText(`${character.currentResource}/${character.stats.resource}`);
        }
    }

    createActionButtons() {
        const { width, height } = this.scale;
        const yPos = height - 100;
        const btnWidth = 100;
        const btnHeight = 45;
        const spacing = 110;

        this.ui.createButton(width/2 - spacing*1.5, yPos, Localization[currentLang].attackButton, () => this.playerAction('attack'), btnWidth, btnHeight);
        this.ui.createButton(width/2 - spacing*0.5, yPos, Localization[currentLang].defendButton, () => this.playerAction('defend'), btnWidth, btnHeight);
        this.ui.createButton(width/2 + spacing*0.5, yPos, Localization[currentLang].skillButton, () => this.playerAction('skill'), btnWidth, btnHeight);
        this.ui.createButton(width/2 + spacing*1.5, yPos, Localization[currentLang].fleeButton, () => this.playerAction('flee'), btnWidth, btnHeight);
    }

    playerAction(type) {
        if (!this.isPlayerTurn || this.isGameOver) return;
        this.isPlayerTurn = false;

        let actionTaken = false;
        switch(type) {
            case 'attack':
                this.attack(this.hero, this.enemy);
                actionTaken = true;
                break;
            case 'defend':
                this.isDefending = true;
                this.logText.setText('You are defending!');
                actionTaken = true;
                break;
            case 'skill':
                if (this.hero.currentResource >= this.hero.skill.cost) {
                    this.hero.currentResource -= this.hero.skill.cost;
                    this.attack(this.hero, this.enemy, true);
                    actionTaken = true;
                } else {
                    this.logText.setText('Not enough ' + this.hero.resourceName + '!');
                    this.isPlayerTurn = true; // Give turn back
                }
                break;
            case 'flee':
                 if (this.enemy.id.includes('warlord')) { // Cannot flee from bosses
                    this.logText.setText("Cannot flee from a Warlord!");
                    this.isPlayerTurn = true;
                    return;
                }
                if (Math.random() < GameConfig.COMBAT.fleeChance) {
                    this.logText.setText('Successfully fled!');
                    this.endBattle(false, true); // Fled, not a win
                } else {
                    this.logText.setText('Flee attempt failed!');
                    actionTaken = true;
                }
                break;
        }

        if (actionTaken && !this.isGameOver) {
            this.updateCharacterUI(this.hero);
            this.time.delayedCall(1000, this.enemyTurn, [], this);
        }
    }

    enemyTurn() {
        if (this.isGameOver) return;

        const useSkill = Math.random() < GameConfig.COMBAT.enemySkillChance && this.enemy.currentResource >= this.enemy.skill.cost;

        if (useSkill) {
            this.enemy.currentResource -= this.enemy.skill.cost;
            this.attack(this.enemy, this.hero, true);
        } else {
            this.attack(this.enemy, this.hero);
        }

        this.updateCharacterUI(this.enemy);
        this.isDefending = false;
        if (!this.isGameOver) {
            this.isPlayerTurn = true;
        }
    }

    attack(attacker, defender, isSkill = false) {
        const skillName = isSkill ? attacker.skill.name : 'Attack';
        let damage = calculateDamage(attacker, defender, isSkill);
        
        if (defender === this.hero && this.isDefending) {
            damage = Math.floor(damage / 2);
        }
        
        defender.currentHp = Math.max(0, defender.currentHp - damage);
        this.logText.setText(`${attacker.name} uses ${skillName}!\n${defender.name} takes ${damage} damage.`);
        
        this.updateCharacterUI(defender);
        this.checkGameOver();
    }

    checkGameOver() {
        if (this.hero.currentHp <= 0) {
            this.endBattle(false);
        } else if (this.enemy.currentHp <= 0) {
            this.endBattle(true);
        }
    }

    endBattle(playerWon, fled = false) {
        this.isGameOver = true;
        this.isPlayerTurn = false;
        
        if (fled) {
            this.scene.start('CharacterSelectScene'); // Or back to a world map later
            return;
        }

        if (playerWon) {
            this.logText.setText(Localization[currentLang].youWin);
            GameState.currentFloor++;
            
            const heroProgress = PlayerData.heroes[this.hero.id];
            heroProgress.xp += this.enemy.xpValue;
            PlayerData.gold += this.enemy.goldValue;

            // Level up check
            if (heroProgress.xp >= heroProgress.xpToNextLevel) {
                heroProgress.level++;
                heroProgress.xp -= heroProgress.xpToNextLevel;
                heroProgress.xpToNextLevel = Math.floor(heroProgress.xpToNextLevel * 1.5);
                this.logText.setText(`${Localization[currentLang].youWin}\n${Localization[currentLang].levelUp}`);
            }

            this.time.delayedCall(2000, () => {
                this.scene.start('RewardScene');
            });
        } else {
            this.logText.setText(Localization[currentLang].youLose);
            PlayerData.gold = Math.floor(PlayerData.gold * (1 - GameConfig.PROGRESSION.goldLossOnDeathPercent));
            GameState.hero = null; // End run
            this.time.delayedCall(2000, () => {
                this.scene.start('MainMenuScene');
            });
        }
    }
}

class RewardScene extends Phaser.Scene {
    constructor() { super('RewardScene'); }

    create() {
        const { width, height } = this.scale;
        this.ui = new UIHelper(this);
        this.hero = GameState.hero;

        this.ui.createText(width / 2, 100, Localization[currentLang].floorCleared, 32, '#f1c40f');
        this.ui.createText(width / 2, 150, Localization[currentLang].rewardTitle, 28, '#ffffff');

        const rewards = [
            { text: Localization[currentLang].rewardHeal, action: () => this.hero.currentHp = Math.min(this.hero.stats.hp, this.hero.currentHp + Math.floor(this.hero.stats.hp * 0.5)) },
            { text: Localization[currentLang].rewardAtk, action: () => this.hero.stats.atk += 2 },
            { text: Localization[currentLang].rewardDef, action: () => this.hero.stats.def += 2 },
            { text: Localization[currentLang].rewardMaxHp, action: () => { this.hero.stats.hp += 10; this.hero.maxStats.hp += 10; this.hero.currentHp += 10;} },
            { text: Localization[currentLang].rewardMaxResource, action: () => { this.hero.stats.resource += 10; this.hero.maxStats.resource += 10; this.hero.currentResource += 10; } },
            { text: Localization[currentLang].rewardItem, action: () => {
                const potion = this.hero.items.find(item => item.id === 'hp_potion');
                if (potion) potion.quantity++; else this.hero.items.push({...Items.HEALTH_POTION, quantity: 1});
            }}
        ];

        // Shuffle and pick 3 unique rewards
        for (let i = rewards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rewards[i], rewards[j]] = [rewards[j], rewards[i]];
        }
        const chosenRewards = rewards.slice(0, 3);

        chosenRewards.forEach((reward, index) => {
            const yPos = 300 + index * 120;
            this.ui.createButton(width / 2, yPos, reward.text, () => {
                reward.action();
                this.scene.start('BattleScene');
            }, 300, 60);
        });
    }
}

// ===================================================================
//  PHASER GAME CONFIGURATION
// ===================================================================

const config = {
    type: Phaser.AUTO,
    width: 480,
    height: 800,
    backgroundColor: '#0a0806',
    scene: [
        MainMenuScene, // Start with MainMenuScene for normal flow
        CharacterSelectScene,
        BattleScene,
        RewardScene
    ],
    // --- For Testing ---
    // scene: [BattleScene, RewardScene, MainMenuScene, CharacterSelectScene] 
};

const game = new Phaser.Game(config);
