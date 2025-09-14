export const gameConfig = {
    mana: {
        regenerationHours: 6,
        maxManaFormula: (level) => level * 3 + 50,
        maxManaLevel: 175
    },
    
    health: {
        maxHpFormula: (level) => 2 * level * level + 3 * level,
        baseHp: 10
    },
    
    experience: {
        toNextLevelFormula: (level) => 150 * level * level + 200
    },
    
    stats: {
        baseStrength: 10,
        baseDefense: 10,
        baseAgility: 10,
        baseIntelligence: 10,
        baseLuck: 5,
        
        prayingCaps: [
            { maxStats: 1100, statsPerFiftyMana: 3.5 },
            { maxStats: 1300, statsPerFiftyMana: 2.5 },
            { maxStats: 1500, statsPerFiftyMana: 1.5 },
            { maxStats: Infinity, statsPerFiftyMana: 1.1 }
        ]
    },
    
    combat: {
        pvpAttacksPerDay: 10,
        speedModifierFormula: (speed, encumbrance) => Math.min(1, 0.5 + 0.5 * (speed / encumbrance)),
        intelligenceModifiers: [
            { ratio: 0.20, modifier: 0.75 },
            { ratio: 0.40, modifier: 0.80 },
            { ratio: 0.60, modifier: 0.85 },
            { ratio: 0.80, modifier: 0.90 },
            { ratio: 1.00, modifier: 0.95 },
            { ratio: 1.01, modifier: 1.00 },
            { ratio: 2.00, modifier: 1.10 },
            { ratio: 3.00, modifier: 1.20 },
            { ratio: 4.00, modifier: 1.30 },
            { ratio: 5.00, modifier: 1.40 },
            { ratio: Infinity, modifier: 1.50 }
        ]
    },
    
    economy: {
        startingGold: 100,
        healingGoldCost: (missingHp) => Math.ceil(missingHp / 2.5),
        healingGemCost: (missingHp) => Math.ceil(missingHp / 500),
        deathGemPenalty: 1,
        investigationCost: (targetLevel) => targetLevel * 2,
        forgingMetalCost: (itemPrice) => Math.ceil(itemPrice / 300),
        forgingGoldCost: (itemPrice) => Math.max(1, Math.ceil(itemPrice / 1000))
    },
    
    classes: ['warrior', 'mage', 'rogue', 'ranger'],
    
    startingLocation: {
        map: 'spawn',
        x: 0,
        y: 0
    }
};

export function getMaxMana(level) {
    if (level > gameConfig.mana.maxManaLevel) {
        return gameConfig.mana.maxManaFormula(gameConfig.mana.maxManaLevel);
    }
    return gameConfig.mana.maxManaFormula(level);
}

export function getMaxHp(level) {
    return gameConfig.health.maxHpFormula(level);
}

export function getExperienceToNextLevel(level) {
    return gameConfig.experience.toNextLevelFormula(level);
}

export function getIntelligenceModifier(attackerInt, defenderInt) {
    const ratio = attackerInt / defenderInt;
    
    for (const { ratio: maxRatio, modifier } of gameConfig.combat.intelligenceModifiers) {
        if (ratio <= maxRatio) {
            return modifier;
        }
    }
    
    return 1.0;
}

export function getPrayingEfficiency(totalStats) {
    for (const { maxStats, statsPerFiftyMana } of gameConfig.stats.prayingCaps) {
        if (totalStats < maxStats) {
            return statsPerFiftyMana;
        }
    }
    
    return gameConfig.stats.prayingCaps[gameConfig.stats.prayingCaps.length - 1].statsPerFiftyMana;
}