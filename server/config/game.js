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
        ],
        
        // Beach combat settings
        manaPerFight: 1,
        baseDamageVariance: 0.2, // ±20% damage variance
        gemDropRate: 0.05 // 5% chance for gem drops
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

// Combat Functions
export function calculatePlayerDamage(playerStats, weaponDamage = 0) {
    const baseDamage = playerStats.strength + weaponDamage;
    const variance = gameConfig.combat.baseDamageVariance;
    const minDamage = Math.floor(baseDamage * (1 - variance));
    const maxDamage = Math.ceil(baseDamage * (1 + variance));
    return Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
}

export function calculateMonsterDamage(monster) {
    if (!monster.loot_table?.damage_range) {
        return monster.damage;
    }
    
    const { min, max } = monster.loot_table.damage_range;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function applyDefense(damage, defense) {
    return Math.max(1, damage - defense);
}

export function checkGemDrop(monster) {
    const dropRate = gameConfig.combat.gemDropRate;
    return Math.random() < dropRate;
}

export function simulateCombat(player, playerStats, monster, equipmentStats = null) {
    const combatLog = [];
    let playerHp = player.health;
    let monsterHp = monster.health;
    
    // Use equipment stats if provided, otherwise use defaults for backwards compatibility
    const stats = equipmentStats || {
        total_protection: 0,
        speed_modifier: 1.0,
        weapon_damage_min: 0,
        weapon_damage_max: 0
    };
    
    while (playerHp > 0 && monsterHp > 0) {
        // Player attacks first - calculate damage with equipment
        const weaponDamage = stats.weapon_damage_min + 
            Math.floor(Math.random() * (stats.weapon_damage_max - stats.weapon_damage_min + 1));
        const baseDamage = playerStats.strength + weaponDamage;
        const effectiveDamage = Math.floor(baseDamage * stats.speed_modifier);
        const damageDealt = applyDefense(effectiveDamage, monster.defense);
        monsterHp = Math.max(0, monsterHp - damageDealt);
        
        combatLog.push({
            attacker: 'player',
            damage: damageDealt,
            weaponDamage: weaponDamage,
            baseDamage: baseDamage,
            effectiveDamage: effectiveDamage,
            weapon: weaponDamage > 0 ? 'equipped weapon' : 'fists',
            target: monster.name,
            targetHpRemaining: monsterHp
        });
        
        if (monsterHp <= 0) break;
        
        // Monster counterattacks - apply armor protection
        const rawMonsterDamage = calculateMonsterDamage(monster);
        const protectedDamage = Math.max(1, rawMonsterDamage - stats.total_protection);
        const damageReceived = applyDefense(protectedDamage, playerStats.defense);
        playerHp = Math.max(0, playerHp - damageReceived);
        
        combatLog.push({
            attacker: 'monster',
            damage: damageReceived,
            rawDamage: rawMonsterDamage,
            protectedDamage: protectedDamage,
            protection: stats.total_protection,
            weapon: `its claws`,
            target: 'you',
            targetHpRemaining: playerHp
        });
    }
    
    const playerWon = monsterHp <= 0;
    const rewards = playerWon ? {
        experience: monster.experience_reward,
        gold: monster.gold_reward,
        gems: checkGemDrop(monster) ? 1 : 0
    } : null;
    
    return {
        playerWon,
        playerHpAfter: playerHp,
        combatLog,
        rewards
    };
}

export function checkLevelUp(currentLevel, currentExp, newExp) {
    let newLevel = currentLevel;
    let expForNextLevel = getExperienceToNextLevel(currentLevel);
    
    while (newExp >= expForNextLevel) {
        newLevel++;
        expForNextLevel = getExperienceToNextLevel(newLevel);
    }
    
    const leveledUp = newLevel > currentLevel;
    return {
        newLevel,
        leveledUp,
        levelsGained: newLevel - currentLevel
    };
}

// Temple Prayer Functions
export function distributeStatsWeighted(totalPoints) {
    // Don't distribute if no points to distribute
    if (totalPoints <= 0) {
        return { strength: 0, speed: 0, intelligence: 0 };
    }
    
    // Better random distribution using weighted approach
    const weights = [Math.random(), Math.random(), Math.random()];
    const sum = weights.reduce((a, b) => a + b);
    const normalized = weights.map(w => w / sum);
    
    // Distribute points based on weights
    let distributed = {
        strength: Math.floor(totalPoints * normalized[0]),
        speed: Math.floor(totalPoints * normalized[1]),
        intelligence: Math.floor(totalPoints * normalized[2])
    };
    
    // Handle rounding remainder by randomly distributing leftover points
    let remainder = totalPoints - (distributed.strength + distributed.speed + distributed.intelligence);
    const stats = ['strength', 'speed', 'intelligence'];
    
    while (remainder > 0) {
        const randomStat = stats[Math.floor(Math.random() * 3)];
        distributed[randomStat]++;
        remainder--;
    }
    
    return distributed;
}

export function calculateStatGains(currentTotalStats, manaSpent) {
    // Don't process if less than 5 mana
    if (manaSpent < 5) {
        return { strength: 0, speed: 0, intelligence: 0 };
    }
    
    // Round down to nearest 5 mana (original game only accepts multiples of 5)
    const effectiveMana = Math.floor(manaSpent / 5) * 5;
    
    // Get base efficiency (per 50 mana)
    const efficiency = getPrayingEfficiency(currentTotalStats);
    
    // Calculate expected gains
    const expectedTotal = (effectiveMana / 50) * efficiency;
    
    // Add variance: ±20% as per original MarcoLand
    const variance = 0.8 + (Math.random() * 0.4);
    const actualTotal = Math.max(0, Math.round(expectedTotal * variance));
    
    // Distribute randomly among the three stats
    return distributeStatsWeighted(actualTotal);
}

export function calculateStatGainsWithDiminishing(currentTotalStats, manaSpent) {
    // For large mana amounts, account for diminishing returns as stats increase
    if (manaSpent < 5) {
        return { strength: 0, speed: 0, intelligence: 0, totalGains: 0 };
    }
    
    // Round down to nearest 5 mana
    let remaining = Math.floor(manaSpent / 5) * 5;
    let totalGains = { strength: 0, speed: 0, intelligence: 0 };
    let runningTotal = currentTotalStats;
    
    // Process in 50-mana chunks for efficiency calculations
    while (remaining > 0) {
        const chunk = Math.min(remaining, 50);
        const efficiency = getPrayingEfficiency(runningTotal);
        const expectedGains = (chunk / 50) * efficiency;
        
        // Add variance for this chunk
        const variance = 0.8 + (Math.random() * 0.4);
        const actualGains = Math.max(0, Math.round(expectedGains * variance));
        
        // Distribute this chunk's gains
        const distributed = distributeStatsWeighted(actualGains);
        
        // Add to totals
        Object.keys(distributed).forEach(stat => {
            totalGains[stat] += distributed[stat];
        });
        
        // Update running total for next chunk's efficiency calculation
        runningTotal += actualGains;
        remaining -= chunk;
    }
    
    // Add convenience property for total gains
    totalGains.totalGains = totalGains.strength + totalGains.speed + totalGains.intelligence;
    return totalGains;
}