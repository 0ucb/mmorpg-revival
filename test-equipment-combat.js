// Test Equipment Combat Integration
import { simulateCombat } from './server/config/game.js';

// Mock test data
const mockPlayer = {
    id: 'test-player',
    health: 100,
    max_health: 100,
    strength: 20,
    level: 5
};

const mockPlayerStats = {
    strength: 20,
    defense: 10,
    agility: 15,
    intelligence: 12,
    luck: 8
};

const mockMonster = {
    id: 'test-monster',
    name: 'Goblin',
    level: 3,
    health: 50,
    damage: 15,
    defense: 5,
    experience_reward: 25,
    gold_reward: 10
};

// Test scenarios
const testScenarios = [
    {
        name: 'No Equipment (Backwards Compatibility)',
        equipmentStats: null,
        expected: {
            hasWeaponDamage: false,
            hasProtection: false
        }
    },
    {
        name: 'Weapon Only',
        equipmentStats: {
            total_protection: 0,
            speed_modifier: 1.0,
            weapon_damage_min: 5,
            weapon_damage_max: 10
        },
        expected: {
            hasWeaponDamage: true,
            hasProtection: false
        }
    },
    {
        name: 'Armor Only',
        equipmentStats: {
            total_protection: 8,
            speed_modifier: 0.8,
            weapon_damage_min: 0,
            weapon_damage_max: 0
        },
        expected: {
            hasWeaponDamage: false,
            hasProtection: true
        }
    },
    {
        name: 'Full Equipment Set',
        equipmentStats: {
            total_protection: 12,
            speed_modifier: 0.7,
            weapon_damage_min: 8,
            weapon_damage_max: 15
        },
        expected: {
            hasWeaponDamage: true,
            hasProtection: true
        }
    }
];

function runCombatTests() {
    console.log('🧪 Testing Equipment Combat Integration\n');
    
    testScenarios.forEach((scenario, index) => {
        console.log(`Test ${index + 1}: ${scenario.name}`);
        console.log('=' .repeat(50));
        
        try {
            const result = simulateCombat(mockPlayer, mockPlayerStats, mockMonster, scenario.equipmentStats);
            
            // Analyze combat log for equipment effects
            let foundWeaponDamage = false;
            let foundProtection = false;
            
            result.combatLog.forEach(entry => {
                if (entry.attacker === 'player' && entry.weaponDamage > 0) {
                    foundWeaponDamage = true;
                }
                if (entry.attacker === 'monster' && entry.protection > 0) {
                    foundProtection = true;
                }
            });
            
            // Check expectations
            const weaponTest = foundWeaponDamage === scenario.expected.hasWeaponDamage;
            const protectionTest = foundProtection === scenario.expected.hasProtection;
            
            console.log(`   Weapon damage effect: ${foundWeaponDamage ? '✅' : '❌'} ${weaponTest ? 'PASS' : 'FAIL'}`);
            console.log(`   Armor protection effect: ${foundProtection ? '✅' : '❌'} ${protectionTest ? 'PASS' : 'FAIL'}`);
            console.log(`   Player won: ${result.playerWon ? '✅' : '❌'}`);
            console.log(`   Combat rounds: ${result.combatLog.length / 2}`);
            
            if (result.combatLog.length > 0) {
                console.log('   Sample combat log:');
                result.combatLog.slice(0, 2).forEach(entry => {
                    if (entry.attacker === 'player') {
                        console.log(`     - Player dealt ${entry.damage} damage${entry.weaponDamage > 0 ? ` (${entry.weaponDamage} from weapon)` : ''}`);
                    } else {
                        console.log(`     - Monster dealt ${entry.damage} damage${entry.protection > 0 ? ` (${entry.rawDamage - entry.protectedDamage} blocked)` : ''}`);
                    }
                });
            }
            
            console.log('');
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            console.log('');
        }
    });
    
    // Test damage calculations
    console.log('Additional Tests:');
    console.log('=' .repeat(50));
    
    // Test speed modifier impact
    const normalSpeed = simulateCombat(mockPlayer, mockPlayerStats, mockMonster, {
        total_protection: 0,
        speed_modifier: 1.0,
        weapon_damage_min: 10,
        weapon_damage_max: 10
    });
    
    const reducedSpeed = simulateCombat(mockPlayer, mockPlayerStats, mockMonster, {
        total_protection: 0,
        speed_modifier: 0.5,
        weapon_damage_min: 10,
        weapon_damage_max: 10
    });
    
    console.log('Speed modifier impact:');
    if (normalSpeed.combatLog.length > 0 && reducedSpeed.combatLog.length > 0) {
        const normalDamage = normalSpeed.combatLog[0].damage;
        const reducedDamage = reducedSpeed.combatLog[0].damage;
        console.log(`   Normal speed damage: ${normalDamage}`);
        console.log(`   Reduced speed damage: ${reducedDamage}`);
        console.log(`   Speed modifier working: ${reducedDamage < normalDamage ? '✅' : '❌'}`);
    }
    
    console.log('\n🎉 Equipment Combat Integration Tests Complete!');
}

// Run the tests
runCombatTests();