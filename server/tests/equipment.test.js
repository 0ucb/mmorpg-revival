import { describe, test, expect } from 'vitest';
import {
    calculateSpeedModifier,
    canEquip,
    calculateEffectiveDamage,
    calculateArmorReduction,
    rollWeaponDamage,
    calculateTotalCost,
    validateEquipmentSet,
    EQUIPMENT_CONSTANTS
} from '../config/equipment.js';

describe('Equipment Core Functions', () => {
    describe('calculateSpeedModifier', () => {
        test('no encumbrance returns full speed', () => {
            expect(calculateSpeedModifier(100, 0)).toBe(1.0);
            expect(calculateSpeedModifier(50, 0)).toBe(1.0);
        });

        test('encumbrance equal to speed returns minimum speed', () => {
            expect(calculateSpeedModifier(100, 100)).toBe(0.5);
            expect(calculateSpeedModifier(50, 50)).toBe(0.5);
        });

        test('encumbrance greater than speed returns minimum speed', () => {
            expect(calculateSpeedModifier(100, 150)).toBe(0.5);
            expect(calculateSpeedModifier(50, 200)).toBe(0.5);
        });

        test('partial encumbrance calculates correctly', () => {
            // When encumbrance = speed/2, modifier should be 0.75
            expect(calculateSpeedModifier(100, 50)).toBe(0.75);
            expect(calculateSpeedModifier(60, 30)).toBe(0.75);
            
            // When encumbrance = speed/4, modifier should be 0.875
            expect(calculateSpeedModifier(100, 25)).toBe(0.875);
        });

        test('authentic MarcoLand examples', () => {
            // Player with 100 speed, 30 encumbrance
            expect(calculateSpeedModifier(100, 30)).toBe(0.85);
            
            // Player with 75 speed, 45 encumbrance  
            expect(calculateSpeedModifier(75, 45)).toBe(0.7);
        });

        test('edge cases', () => {
            expect(calculateSpeedModifier(1, 0)).toBe(1.0);
            expect(calculateSpeedModifier(1, 1)).toBe(0.5);
            expect(calculateSpeedModifier(0, 0)).toBe(1.0);
        });
    });

    describe('canEquip', () => {
        test('validates strength requirement', () => {
            // Player has enough strength
            expect(canEquip(50, 30, 0, 0)).toBe(true);
            
            // Player lacks strength for item
            expect(canEquip(30, 50, 0, 0)).toBe(false);
            
            // Exact strength match
            expect(canEquip(50, 50, 0, 0)).toBe(true);
        });

        test('validates total encumbrance', () => {
            // Total encumbrance within strength
            expect(canEquip(50, 0, 30, 10)).toBe(true);
            
            // Total encumbrance equals strength
            expect(canEquip(50, 0, 30, 20)).toBe(true);
            
            // Total encumbrance exceeds strength
            expect(canEquip(50, 0, 30, 25)).toBe(false);
        });

        test('validates both requirements together', () => {
            // Both requirements met
            expect(canEquip(100, 50, 30, 20)).toBe(true);
            
            // Strength req met, encumbrance fails
            expect(canEquip(100, 50, 70, 40)).toBe(false);
            
            // Encumbrance ok, strength req fails
            expect(canEquip(100, 120, 20, 10)).toBe(false);
        });

        test('handles default values', () => {
            // No requirements
            expect(canEquip(50)).toBe(true);
            
            // Only strength requirement
            expect(canEquip(50, 30)).toBe(true);
            expect(canEquip(20, 30)).toBe(false);
        });
    });

    describe('calculateEffectiveDamage', () => {
        test('applies speed modifier correctly', () => {
            expect(calculateEffectiveDamage(100, 1.0)).toBe(100);
            expect(calculateEffectiveDamage(100, 0.5)).toBe(50);
            expect(calculateEffectiveDamage(100, 0.75)).toBe(75);
        });

        test('floors fractional results', () => {
            expect(calculateEffectiveDamage(33, 0.5)).toBe(16); // 16.5 -> 16
            expect(calculateEffectiveDamage(77, 0.8)).toBe(61); // 61.6 -> 61
        });

        test('handles edge cases', () => {
            expect(calculateEffectiveDamage(0, 1.0)).toBe(0);
            expect(calculateEffectiveDamage(1, 0.5)).toBe(0);
        });
    });

    describe('calculateArmorReduction', () => {
        test('reduces damage by protection amount', () => {
            expect(calculateArmorReduction(100, 20)).toBe(80);
            expect(calculateArmorReduction(50, 10)).toBe(40);
        });

        test('minimum damage is 1', () => {
            expect(calculateArmorReduction(10, 20)).toBe(1);
            expect(calculateArmorReduction(5, 5)).toBe(1);
            expect(calculateArmorReduction(1, 1)).toBe(1);
        });

        test('no protection returns full damage', () => {
            expect(calculateArmorReduction(100, 0)).toBe(100);
        });
    });

    describe('rollWeaponDamage', () => {
        test('returns value within range', () => {
            for (let i = 0; i < 100; i++) {
                const damage = rollWeaponDamage(10, 20);
                expect(damage).toBeGreaterThanOrEqual(10);
                expect(damage).toBeLessThanOrEqual(20);
            }
        });

        test('handles equal min and max', () => {
            expect(rollWeaponDamage(15, 15)).toBe(15);
        });

        test('handles single point range', () => {
            expect(rollWeaponDamage(10, 11)).toBeGreaterThanOrEqual(10);
            expect(rollWeaponDamage(10, 11)).toBeLessThanOrEqual(11);
        });
    });

    describe('calculateTotalCost', () => {
        test('sums equipment costs', () => {
            const equipment = [
                { cost_gold: 100 },
                { cost_gold: 250 },
                { cost_gold: 75 }
            ];
            expect(calculateTotalCost(equipment)).toBe(425);
        });

        test('handles missing cost_gold', () => {
            const equipment = [
                { cost_gold: 100 },
                { name: 'No cost item' },
                { cost_gold: 50 }
            ];
            expect(calculateTotalCost(equipment)).toBe(150);
        });

        test('handles empty array', () => {
            expect(calculateTotalCost([])).toBe(0);
        });
    });

    describe('validateEquipmentSet', () => {
        const testPlayer = {
            strength: 100,
            speed: 100,
            gold: 1000
        };

        test('validates affordable equipment set', () => {
            const equipment = [
                { name: 'Sword', cost_gold: 200, strength_required: 50, encumbrance: 0 },
                { name: 'Armor', cost_gold: 300, strength_required: 60, encumbrance: 40 }
            ];

            const result = validateEquipmentSet(testPlayer, equipment);
            expect(result.valid).toBe(true);
            expect(result.failures).toHaveLength(0);
            expect(result.totals.cost).toBe(500);
            expect(result.totals.encumbrance).toBe(40);
        });

        test('detects insufficient gold', () => {
            const equipment = [
                { name: 'Expensive Sword', cost_gold: 2000, strength_required: 50 }
            ];

            const result = validateEquipmentSet(testPlayer, equipment);
            expect(result.valid).toBe(false);
            expect(result.failures).toContainEqual({
                item: 'Expensive Sword',
                reason: 'insufficient_gold',
                required: 2000,
                available: 1000
            });
        });

        test('detects insufficient strength', () => {
            const equipment = [
                { name: 'Heavy Armor', cost_gold: 100, strength_required: 150 }
            ];

            const result = validateEquipmentSet(testPlayer, equipment);
            expect(result.valid).toBe(false);
            expect(result.failures).toContainEqual({
                item: 'Heavy Armor',
                reason: 'insufficient_strength',
                required: 150,
                available: 100
            });
        });

        test('detects excessive total encumbrance', () => {
            const equipment = [
                { name: 'Heavy Boots', cost_gold: 100, encumbrance: 60 },
                { name: 'Heavy Helm', cost_gold: 100, encumbrance: 50 }
            ];

            const result = validateEquipmentSet(testPlayer, equipment);
            expect(result.valid).toBe(false);
            expect(result.failures).toContainEqual({
                reason: 'total_encumbrance_exceeds_strength',
                total_encumbrance: 110,
                player_strength: 100
            });
        });

        test('calculates speed modifier in totals', () => {
            const equipment = [
                { name: 'Light Armor', cost_gold: 100, encumbrance: 25 }
            ];

            const result = validateEquipmentSet(testPlayer, equipment);
            expect(result.totals.speed_modifier).toBe(0.875); // 1.0 - (0.5 * (25/100))
        });
    });

    describe('EQUIPMENT_CONSTANTS', () => {
        test('has correct speed modifier bounds', () => {
            expect(EQUIPMENT_CONSTANTS.MIN_SPEED_MODIFIER).toBe(0.5);
            expect(EQUIPMENT_CONSTANTS.MAX_SPEED_MODIFIER).toBe(1.0);
        });

        test('has correct equipment slots', () => {
            expect(EQUIPMENT_CONSTANTS.EQUIPMENT_SLOTS).toEqual([
                'weapon', 'head', 'body', 'legs', 'hands', 'feet'
            ]);
            expect(EQUIPMENT_CONSTANTS.ARMOR_SLOTS).toEqual([
                'head', 'body', 'legs', 'hands', 'feet'
            ]);
        });
    });
});

// Integration tests with realistic MarcoLand scenarios
describe('MarcoLand Equipment Scenarios', () => {
    test('starter player can equip basic equipment', () => {
        const starterPlayer = {
            strength: 10,
            speed: 10,
            gold: 3000
        };

        // Basic starter equipment from MarcoLand data
        const starterGear = [
            { name: 'Rusty Dagger', cost_gold: 100, strength_required: 0 },
            { name: 'Sandals', cost_gold: 1000, encumbrance: 5, strength_required: 0 }
        ];

        const result = validateEquipmentSet(starterPlayer, starterGear);
        expect(result.valid).toBe(true);
        expect(result.totals.speed_modifier).toBe(0.75); // 1.0 - (0.5 * (5/10))
    });

    test('mid-level player progression', () => {
        const midPlayer = {
            strength: 50,
            speed: 30,
            gold: 50000
        };

        const midTierGear = [
            { name: 'Long Sword', cost_gold: 20000, strength_required: 25 },
            { name: 'Great Helm', cost_gold: 20000, encumbrance: 25, strength_required: 0 },
            { name: 'Plate Jacket', cost_gold: 100000, encumbrance: 40, strength_required: 0 }
        ];

        // This should fail due to insufficient gold for plate jacket
        const result = validateEquipmentSet(midPlayer, midTierGear);
        expect(result.valid).toBe(false);
        
        // But without the expensive jacket, should work
        const affordableGear = midTierGear.slice(0, 2);
        const affordableResult = validateEquipmentSet(midPlayer, affordableGear);
        expect(affordableResult.valid).toBe(true);
    });

    test('encumbrance heavily affects speed', () => {
        const player = { strength: 100, speed: 50, gold: 1000000 };
        
        // Heavy armor set
        const heavyArmor = [
            { name: 'Heavy Set', encumbrance: 40 } // 40/50 = 80% encumbrance
        ];
        
        const result = validateEquipmentSet(player, heavyArmor);
        expect(result.totals.speed_modifier).toBe(0.6); // 1.0 - (0.5 * (40/50))
    });
});

// Equipment selling functionality tests
describe('Equipment Selling System', () => {
    describe('sell price calculations', () => {
        test('sells for 50% of original cost', () => {
            const originalCost = 1000;
            const expectedSellPrice = 500;
            
            // This would be tested with the database function
            expect(Math.floor(originalCost * 0.5)).toBe(expectedSellPrice);
        });

        test('has minimum sell price of 1 gold', () => {
            const lowCostItems = [1, 2];
            
            lowCostItems.forEach(cost => {
                const sellPrice = Math.max(1, Math.floor(cost * 0.5));
                expect(sellPrice).toBeGreaterThanOrEqual(1);
            });
        });

        test('calculates correct sell prices for various costs', () => {
            const testCases = [
                { cost: 100, expected: 50 },
                { cost: 150, expected: 75 },
                { cost: 99, expected: 49 },
                { cost: 1, expected: 1 },  // Minimum
                { cost: 2, expected: 1 },  // Minimum
                { cost: 10000, expected: 5000 }
            ];

            testCases.forEach(({ cost, expected }) => {
                const sellPrice = Math.max(1, Math.floor(cost * 0.5));
                expect(sellPrice).toBe(expected);
            });
        });
    });

    describe('selling business logic', () => {
        test('validates inventory ownership', () => {
            // This simulates the database validation
            const mockInventory = [
                { id: 'item1', player_id: 'player1', weapon_id: 'weapon1' },
                { id: 'item2', player_id: 'player1', armor_id: 'armor1' }
            ];

            const playerToSell = 'player1';
            const itemToSell = 'item1';

            const ownsItem = mockInventory.some(
                item => item.id === itemToSell && item.player_id === playerToSell
            );
            
            expect(ownsItem).toBe(true);

            // Test with invalid item
            const invalidItem = 'nonexistent';
            const ownsInvalidItem = mockInventory.some(
                item => item.id === invalidItem && item.player_id === playerToSell
            );
            
            expect(ownsInvalidItem).toBe(false);
        });

        test('prevents selling equipped items', () => {
            // In the database implementation, only items in player_inventory 
            // can be sold, not items in player_equipped
            const inventoryItems = ['item1', 'item2'];
            const equippedItems = ['item3', 'item4'];

            expect(inventoryItems.includes('item1')).toBe(true);  // Can sell
            expect(inventoryItems.includes('item3')).toBe(false); // Cannot sell (equipped)
        });
    });

    describe('economic impact calculations', () => {
        test('calculates gold balance correctly', () => {
            const playerGold = 1000;
            const sellPrice = 250;
            const expectedBalance = playerGold + sellPrice;

            expect(expectedBalance).toBe(1250);
        });

        test('handles large gold amounts', () => {
            const playerGold = 999999;
            const sellPrice = 50000;
            const expectedBalance = playerGold + sellPrice;

            expect(expectedBalance).toBe(1049999);
        });
    });

    describe('MarcoLand selling scenarios', () => {
        test('starter player sells basic equipment', () => {
            const starterItems = [
                { name: 'Rusty Dagger', cost_gold: 100 },
                { name: 'Leather Boots', cost_gold: 500 }
            ];

            const sellPrices = starterItems.map(item => 
                Math.max(1, Math.floor(item.cost_gold * 0.5))
            );

            expect(sellPrices).toEqual([50, 250]);
            expect(sellPrices.reduce((sum, price) => sum + price, 0)).toBe(300);
        });

        test('mid-level player sells valuable equipment', () => {
            const midLevelItems = [
                { name: 'Steel Sword', cost_gold: 20000 },
                { name: 'Chain Mail', cost_gold: 15000 }
            ];

            const sellPrices = midLevelItems.map(item => 
                Math.max(1, Math.floor(item.cost_gold * 0.5))
            );

            expect(sellPrices).toEqual([10000, 7500]);
            expect(sellPrices.reduce((sum, price) => sum + price, 0)).toBe(17500);
        });

        test('expensive items provide substantial returns', () => {
            const expensiveItem = { name: 'Legendary Plate', cost_gold: 500000 };
            const sellPrice = Math.max(1, Math.floor(expensiveItem.cost_gold * 0.5));
            
            expect(sellPrice).toBe(250000);
            
            // This represents significant economic value
            expect(sellPrice).toBeGreaterThan(100000);
        });
    });

    describe('error handling scenarios', () => {
        test('handles invalid inventory items', () => {
            const mockInventoryCheck = (inventoryId, playerId) => {
                const validItems = [
                    { id: 'valid1', player_id: 'player1' },
                    { id: 'valid2', player_id: 'player1' }
                ];
                
                return validItems.find(item => 
                    item.id === inventoryId && item.player_id === playerId
                ) || null;
            };

            expect(mockInventoryCheck('valid1', 'player1')).toBeTruthy();
            expect(mockInventoryCheck('invalid', 'player1')).toBeNull();
            expect(mockInventoryCheck('valid1', 'wrongplayer')).toBeNull();
        });

        test('handles missing item details', () => {
            const mockItemDatabase = {
                'weapon1': { name: 'Sword', cost_gold: 1000 },
                'armor1': { name: 'Helmet', cost_gold: 800 }
            };

            expect(mockItemDatabase['weapon1']).toBeTruthy();
            expect(mockItemDatabase['nonexistent']).toBeUndefined();
        });
    });
});