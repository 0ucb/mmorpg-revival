import { getIntelligenceModifier } from './game.js';

// PvP Configuration
export const pvpConfig = {
    pvpManaCost: parseInt(process.env.PVP_MANA_COST || '1'),
    pvpManaMax: parseInt(process.env.PVP_MANA_MAX || '5'),
    pvpManaRegenPerHour: parseInt(process.env.PVP_MANA_REGEN || '1'),
    levelRangePercent: parseFloat(process.env.PVP_LEVEL_RANGE || '0.40'),
    protectionMinutes: parseInt(process.env.PVP_PROTECTION_MINUTES || '10'),
    maxResourceLossPercent: parseFloat(process.env.PVP_MAX_LOSS || '0.05'),
    attacksPerMinute: parseInt(process.env.PVP_RATE_LIMIT || '2'),
    
    // Resource theft caps
    maxGoldStolen: parseInt(process.env.PVP_MAX_GOLD_STOLEN || '100'),
    maxGemsStolen: parseInt(process.env.PVP_MAX_GEMS_STOLEN || '5'),
    maxMetalsStolen: parseInt(process.env.PVP_MAX_METALS_STOLEN || '10')
};

// PvP Mana Functions
export function canUsePvPMana(player, amount = 1) {
    const currentMana = player.pvp_mana || 0;
    return currentMana >= amount;
}

export function deductPvPMana(player, amount = 1) {
    const currentMana = player.pvp_mana || 0;
    return {
        ...player,
        pvp_mana: Math.max(0, currentMana - amount)
    };
}

export function regeneratePvPMana(player) {
    const currentMana = player.pvp_mana || 0;
    const lastRegen = player.last_pvp_mana_regen ? new Date(player.last_pvp_mana_regen) : new Date(0);
    const now = new Date();
    const hoursPassed = Math.floor((now.getTime() - lastRegen.getTime()) / (60 * 60 * 1000));
    
    if (hoursPassed >= 1) {
        const newMana = Math.min(pvpConfig.pvpManaMax, currentMana + hoursPassed);
        return {
            ...player,
            pvp_mana: newMana,
            last_pvp_mana_regen: now
        };
    }
    
    return player;
}

export function getPvPManaNeeded(attacks = 1) {
    return attacks * pvpConfig.pvpManaCost;
}

// Target Validation
export function isValidPvPTarget(attacker, target) {
    // Can't attack yourself
    if (attacker.id === target.id) {
        return false;
    }
    
    // Protect new players: players above level 5 cannot attack level 5 or lower
    if (attacker.level > 5 && target.level <= 5) {
        return false;
    }
    
    // Level range validation (±40%)
    const levelDiff = Math.abs(attacker.level - target.level);
    const maxLevelDiff = Math.ceil(attacker.level * pvpConfig.levelRangePercent);
    
    return levelDiff <= maxLevelDiff;
}

// Protection System
export function isPlayerProtected(protection, currentTime = new Date()) {
    if (!protection || !protection.protected_until) {
        return false;
    }
    
    const protectedUntil = new Date(protection.protected_until);
    return protectedUntil > currentTime;
}

export function createProtection(defenderId, attackerId, currentTime = new Date()) {
    const protectionDuration = pvpConfig.protectionMinutes * 60 * 1000;
    const protectedUntil = new Date(currentTime.getTime() + protectionDuration);
    
    return {
        player_id: defenderId,
        protected_until: protectedUntil,
        last_attacker_id: attackerId,
        updated_at: currentTime
    };
}

export function getProtectionTimeRemaining(protection, currentTime = new Date()) {
    if (!protection || !protection.protected_until) {
        return 0;
    }
    
    const protectedUntil = new Date(protection.protected_until);
    const remaining = protectedUntil.getTime() - currentTime.getTime();
    
    return Math.max(0, remaining);
}

export function canAttackTarget(attacker, target, currentTime = new Date()) {
    // Basic validations
    if (!isValidPvPTarget(attacker, target)) {
        return false;
    }
    
    // Check if target is protected
    if (target.protection && isPlayerProtected(target.protection, currentTime)) {
        return false;
    }
    
    return true;
}

// Combat Calculations
export function simulatePvPCombat(attacker, attackerStats, defender, defenderStats, attackerEquipment = null, defenderEquipment = null) {
    // Base damage calculation using attacker's strength
    const baseStrengthDamage = attackerStats.strength || 10;
    
    // Add weapon damage if equipment is provided
    let weaponDamage = 0;
    if (attackerEquipment && attackerEquipment.weapon_damage_min && attackerEquipment.weapon_damage_max) {
        weaponDamage = Math.floor(Math.random() * (attackerEquipment.weapon_damage_max - attackerEquipment.weapon_damage_min + 1)) + attackerEquipment.weapon_damage_min;
    }
    
    // Calculate raw damage
    const rawDamage = baseStrengthDamage + weaponDamage;
    
    // Apply speed modifier if equipment stats available
    let speedModifier = 1.0;
    if (attackerEquipment && attackerEquipment.speed_modifier) {
        speedModifier = attackerEquipment.speed_modifier;
    }
    
    // Apply intelligence modifier (PvP only)
    const intelligenceModifier = getIntelligenceModifier(
        attackerStats.intelligence || 10, 
        defenderStats.intelligence || 10
    );
    
    // Calculate final damage
    let finalDamage = Math.floor(rawDamage * speedModifier * intelligenceModifier);
    
    // Apply defender's protection if available (FIXED: was using attacker's protection)
    if (defenderEquipment && defenderEquipment.total_protection) {
        finalDamage = Math.max(1, finalDamage - defenderEquipment.total_protection);
    }
    
    // Ensure minimum 1 damage
    finalDamage = Math.max(1, finalDamage);
    
    // Calculate defender's health after damage
    const defenderHealthAfter = Math.max(0, defender.health - finalDamage);
    const isKill = defenderHealthAfter === 0;
    
    return {
        damage: finalDamage,
        weaponDamage,
        rawDamage,
        speedModifier,
        intelligenceModifier,
        defenderHealthAfter,
        defenderProtection: defenderEquipment?.total_protection || 0,
        isKill
    };
}

// Resource Theft
export function calculateResourceTheft(defender, isKill) {
    if (!isKill) {
        return { gold: 0, gems: 0, metals: 0 };
    }
    
    // Calculate 5% of each resource, with caps
    const goldStolen = Math.min(
        pvpConfig.maxGoldStolen,
        Math.floor((defender.gold || 0) * pvpConfig.maxResourceLossPercent)
    );
    
    const gemsStolen = Math.min(
        pvpConfig.maxGemsStolen,
        Math.floor((defender.gems || 0) * pvpConfig.maxResourceLossPercent)
    );
    
    const metalsStolen = Math.min(
        pvpConfig.maxMetalsStolen,
        Math.floor((defender.metals || 0) * pvpConfig.maxResourceLossPercent)
    );
    
    return {
        gold: goldStolen,
        gems: gemsStolen,
        metals: metalsStolen
    };
}

// Battle Logging
export function createBattleRecord(attacker, defender, combatResult, resourcesStolen) {
    return {
        attacker_id: attacker.id,
        defender_id: defender.id,
        attacker_damage: combatResult.damage,
        defender_health_before: defender.health,
        defender_health_after: combatResult.defenderHealthAfter,
        intelligence_modifier: combatResult.intelligenceModifier,
        gold_stolen: resourcesStolen.gold,
        gems_stolen: resourcesStolen.gems,
        metals_stolen: resourcesStolen.metals,
        is_kill: combatResult.isKill,
        created_at: new Date()
    };
}

// Stats Updates
export function updatePvPStats(playerStats, isAttacker, isKill, damageDealt = 0, damageTaken = 0) {
    const updates = {
        pvp_damage_dealt: playerStats.pvp_damage_dealt + (isAttacker ? damageDealt : 0),
        pvp_damage_taken: playerStats.pvp_damage_taken + (isAttacker ? 0 : damageTaken)
    };
    
    if (isKill) {
        if (isAttacker) {
            updates.pvp_kills = playerStats.pvp_kills + 1;
        } else {
            updates.pvp_deaths = playerStats.pvp_deaths + 1;
        }
    }
    
    return updates;
}

// Utility Functions
export function formatPvPManaDisplay(pvpMana) {
    return `${pvpMana}/${pvpConfig.pvpManaMax}`;
}

export function calculateTimeUntilPvPManaRegen(player) {
    if (!player.last_pvp_mana_regen) {
        return 0; // Can regen immediately
    }
    
    const lastRegen = new Date(player.last_pvp_mana_regen);
    const now = new Date();
    const oneHourFromLastRegen = new Date(lastRegen.getTime() + 60 * 60 * 1000);
    
    return Math.max(0, oneHourFromLastRegen.getTime() - now.getTime());
}

export function getNextPvPManaRegenTime(player) {
    const timeUntilRegen = calculateTimeUntilPvPManaRegen(player);
    
    if (timeUntilRegen === 0) {
        return 'Now';
    }
    
    const minutes = Math.ceil(timeUntilRegen / (60 * 1000));
    if (minutes < 60) {
        return `${minutes} minutes`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}