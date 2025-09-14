/**
 * MarcoLand Equipment System - Core Functions
 * 
 * These are the critical calculations that determine equipment behavior.
 * All formulas are based on authentic MarcoLand mechanics.
 */

/**
 * Calculate speed modifier based on encumbrance vs player speed
 * This is THE critical formula from MarcoLand
 * 
 * @param {number} speed - Player's speed stat
 * @param {number} encumbrance - Total encumbrance from equipped armor
 * @returns {number} Speed modifier (0.5 to 1.0)
 */
export function calculateSpeedModifier(speed, encumbrance) {
    // No encumbrance = full speed
    if (encumbrance === 0) return 1.0;
    
    // If encumbrance >= speed, minimum 50% speed
    if (encumbrance >= speed) return 0.5;
    
    // Linear reduction: 1.0 - (0.5 * (encumbrance / speed))
    // When encumbrance = speed/2, modifier = 0.75
    // When encumbrance = speed, modifier = 0.5
    return 1.0 - (0.5 * (encumbrance / speed));
}

/**
 * Check if player can equip an item
 * 
 * @param {number} playerStrength - Player's current strength
 * @param {number} itemStrengthRequired - Item's strength requirement
 * @param {number} currentEncumbrance - Player's current total encumbrance
 * @param {number} itemEncumbrance - Encumbrance of item being equipped
 * @returns {boolean} True if player can equip the item
 */
export function canEquip(playerStrength, itemStrengthRequired = 0, currentEncumbrance = 0, itemEncumbrance = 0) {
    // Check strength requirement for the item itself
    if (playerStrength < itemStrengthRequired) {
        return false;
    }
    
    // Check if total encumbrance would exceed strength
    const totalEncumbrance = currentEncumbrance + itemEncumbrance;
    if (totalEncumbrance > playerStrength) {
        return false;
    }
    
    return true;
}

/**
 * Calculate effective damage with speed modifier
 * Used in combat calculations
 * 
 * @param {number} baseDamage - Base damage from weapon + strength
 * @param {number} speedModifier - Speed modifier from equipment
 * @returns {number} Final damage after speed modification
 */
export function calculateEffectiveDamage(baseDamage, speedModifier) {
    return Math.floor(baseDamage * speedModifier);
}

/**
 * Calculate damage reduction from armor protection
 * 
 * @param {number} incomingDamage - Raw damage before armor
 * @param {number} totalProtection - Total protection from all armor
 * @returns {number} Damage after armor reduction (minimum 1)
 */
export function calculateArmorReduction(incomingDamage, totalProtection) {
    return Math.max(1, incomingDamage - totalProtection);
}

/**
 * Get random weapon damage within min/max range
 * 
 * @param {number} minDamage - Minimum weapon damage
 * @param {number} maxDamage - Maximum weapon damage  
 * @returns {number} Random damage value
 */
export function rollWeaponDamage(minDamage, maxDamage) {
    if (minDamage === maxDamage) return minDamage;
    return minDamage + Math.floor(Math.random() * (maxDamage - minDamage + 1));
}

/**
 * Calculate total equipment cost for a set
 * Utility function for balance checking
 * 
 * @param {Array} equipment - Array of equipment objects with cost_gold
 * @returns {number} Total cost in gold
 */
export function calculateTotalCost(equipment) {
    return equipment.reduce((total, item) => total + (item.cost_gold || 0), 0);
}

/**
 * Validate equipment requirements against player stats
 * 
 * @param {Object} player - Player stats object
 * @param {Array} equipment - Array of equipment to validate
 * @returns {Object} Validation result with details
 */
export function validateEquipmentSet(player, equipment) {
    let totalEncumbrance = 0;
    let totalCost = 0;
    const failed = [];
    
    for (const item of equipment) {
        // Check strength requirement
        if (player.strength < (item.strength_required || 0)) {
            failed.push({
                item: item.name,
                reason: 'insufficient_strength',
                required: item.strength_required,
                available: player.strength
            });
        }
        
        // Check affordability
        if (player.gold < (item.cost_gold || 0)) {
            failed.push({
                item: item.name,
                reason: 'insufficient_gold',
                required: item.cost_gold,
                available: player.gold
            });
        }
        
        totalEncumbrance += item.encumbrance || 0;
        totalCost += item.cost_gold || 0;
    }
    
    // Check total encumbrance
    if (totalEncumbrance > player.strength) {
        failed.push({
            reason: 'total_encumbrance_exceeds_strength',
            total_encumbrance: totalEncumbrance,
            player_strength: player.strength
        });
    }
    
    return {
        valid: failed.length === 0,
        failures: failed,
        totals: {
            encumbrance: totalEncumbrance,
            cost: totalCost,
            speed_modifier: calculateSpeedModifier(player.speed, totalEncumbrance)
        }
    };
}

/**
 * Equipment constants for game balance
 */
export const EQUIPMENT_CONSTANTS = {
    MIN_SPEED_MODIFIER: 0.5,
    MAX_SPEED_MODIFIER: 1.0,
    EQUIPMENT_SLOTS: ['weapon', 'head', 'body', 'legs', 'hands', 'feet'],
    ARMOR_SLOTS: ['head', 'body', 'legs', 'hands', 'feet']
};