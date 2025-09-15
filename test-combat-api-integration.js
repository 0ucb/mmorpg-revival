// Integration Test for Combat API with Equipment
// This simulates the full API flow but without actual HTTP requests

import { simulateCombat } from './server/config/game.js';

// Simulate the beach.js combat flow
function simulateApiCombatFlow() {
    console.log('🧪 Testing API Combat Flow Integration\n');
    
    // Mock data as would be retrieved from database
    const mockPlayer = {
        id: 'player-123',
        health: 80,
        max_health: 100,
        mana: 10,
        strength: 25,
        level: 6
    };
    
    const mockPlayerStats = {
        strength: 25,
        defense: 12,
        agility: 18,
        intelligence: 14,
        luck: 10
    };
    
    const mockMonster = {
        id: 'monster-456',
        name: 'Orc Warrior',
        level: 5,
        health: 60,
        damage: 18,
        defense: 8,
        experience_reward: 35,
        gold_reward: 15
    };
    
    // Simulate scenarios from beach.js endpoint
    const scenarios = [
        {
            name: 'New Player (No Equipment)',
            combatStats: null, // No entry in player_combat_stats table
        },
        {
            name: 'Player with Basic Weapon',
            combatStats: {
                total_protection: 0,
                speed_modifier: 1.0,
                weapon_damage_min: 3,
                weapon_damage_max: 8
            }
        },
        {
            name: 'Player with Armor Set',
            combatStats: {
                total_protection: 10,
                speed_modifier: 0.75,
                weapon_damage_min: 0,
                weapon_damage_max: 0
            }
        },
        {
            name: 'Fully Equipped Player',
            combatStats: {
                total_protection: 15,
                speed_modifier: 0.6,
                weapon_damage_min: 12,
                weapon_damage_max: 20
            }
        }
    ];
    
    scenarios.forEach((scenario, index) => {
        console.log(`Scenario ${index + 1}: ${scenario.name}`);
        console.log('-'.repeat(40));
        
        // Simulate the equipmentStats logic from beach.js
        const equipmentStats = scenario.combatStats || {
            total_protection: 0,
            speed_modifier: 1.0,
            weapon_damage_min: 0,
            weapon_damage_max: 0
        };
        
        // Run combat simulation
        const combatResult = simulateCombat(mockPlayer, mockPlayerStats, mockMonster, equipmentStats);
        
        // Simulate the log formatting from beach.js
        const formattedLog = combatResult.combatLog.map(entry => {
            if (entry.attacker === 'player') {
                if (entry.weaponDamage > 0) {
                    return `You hit the ${entry.target} with your ${entry.weapon} and caused ${entry.damage} damage (${entry.weaponDamage} from weapon). (${entry.targetHpRemaining} left)`;
                } else {
                    return `You hit the ${entry.target} with your ${entry.weapon} and caused ${entry.damage} damage. (${entry.targetHpRemaining} left)`;
                }
            } else {
                if (entry.protection > 0) {
                    const blocked = entry.rawDamage - entry.protectedDamage;
                    return `The ${mockMonster.name} hit you with ${entry.weapon} and caused ${entry.damage} damage (${blocked} blocked by armor). (${entry.targetHpRemaining} left)`;
                } else {
                    return `The ${mockMonster.name} hit you with ${entry.weapon} and caused ${entry.damage} damage. (${entry.targetHpRemaining} left)`;
                }
            }
        });
        
        // Display results as they would appear in API response
        console.log(`Combat Result: ${combatResult.playerWon ? 'VICTORY' : 'DEFEAT'}`);
        console.log(`Player HP: ${mockPlayer.health} → ${combatResult.playerHpAfter}`);
        console.log('Combat Log:');
        formattedLog.slice(0, 4).forEach(line => console.log(`  ${line}`));
        if (formattedLog.length > 4) {
            console.log(`  ... (${formattedLog.length - 4} more rounds)`);
        }
        
        if (combatResult.playerWon) {
            console.log(`\nRewards:`);
            console.log(`  Experience: ${combatResult.rewards.experience}`);
            console.log(`  Gold: ${combatResult.rewards.gold}`);
            if (combatResult.rewards.gems > 0) {
                console.log(`  Gems: ${combatResult.rewards.gems}`);
            }
        }
        
        console.log('');
    });
    
    // Test edge cases
    console.log('Edge Case Tests:');
    console.log('='.repeat(40));
    
    // Test high protection (should never reduce damage below 1)
    const highProtectionStats = {
        total_protection: 100, // Higher than monster damage
        speed_modifier: 1.0,
        weapon_damage_min: 0,
        weapon_damage_max: 0
    };
    
    const highProtectionResult = simulateCombat(mockPlayer, mockPlayerStats, mockMonster, highProtectionStats);
    const minDamage = Math.min(...highProtectionResult.combatLog
        .filter(entry => entry.attacker === 'monster')
        .map(entry => entry.damage));
    
    console.log(`High Protection Test: Minimum damage = ${minDamage} (should be 1) ${minDamage === 1 ? '✅' : '❌'}`);
    
    // Test zero weapon damage range
    const zeroWeaponStats = {
        total_protection: 0,
        speed_modifier: 1.0,
        weapon_damage_min: 0,
        weapon_damage_max: 0
    };
    
    const zeroWeaponResult = simulateCombat(mockPlayer, mockPlayerStats, mockMonster, zeroWeaponStats);
    const hasWeaponDamage = zeroWeaponResult.combatLog.some(entry => 
        entry.attacker === 'player' && entry.weaponDamage > 0);
    
    console.log(`Zero Weapon Damage Test: No weapon damage ${!hasWeaponDamage ? '✅' : '❌'}`);
    
    console.log('\n🎉 API Integration Tests Complete!');
    console.log('\nThe combat system is ready for:');
    console.log('- Players with no equipment (backwards compatible)');
    console.log('- Players with weapons (bonus damage)');
    console.log('- Players with armor (damage reduction)');
    console.log('- Players with full equipment sets');
    console.log('- Proper combat logging with equipment effects');
}

// Run the integration test
simulateApiCombatFlow();