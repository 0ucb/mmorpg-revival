import { describe, test, expect } from 'vitest';
import { 
    simulatePvPCombat,
    calculateResourceTheft,
    isValidPvPTarget,
    getIntelligenceModifier
} from '../config/pvp.js';

describe('PvP Combat Calculations', () => {
    describe('Intelligence Modifier', () => {
        test('should apply correct modifier based on INT ratio', () => {
            const testCases = [
                { attackerInt: 10, defenderInt: 10, expectedMod: 1.00 },
                { attackerInt: 5, defenderInt: 10, expectedMod: 0.85 },
                { attackerInt: 15, defenderInt: 10, expectedMod: 1.00 },
                { attackerInt: 20, defenderInt: 10, expectedMod: 1.10 },
                { attackerInt: 30, defenderInt: 10, expectedMod: 1.20 },
                { attackerInt: 50, defenderInt: 10, expectedMod: 1.40 }
            ];
            
            testCases.forEach(({ attackerInt, defenderInt, expectedMod }) => {
                const modifier = getIntelligenceModifier(attackerInt, defenderInt);
                expect(modifier).toBe(expectedMod);
            });
        });

        test('should cap intelligence modifier at 1.5x', () => {
            const modifier = getIntelligenceModifier(100, 10); // 10:1 ratio
            expect(modifier).toBe(1.50);
        });

        test('should floor intelligence modifier at 0.75x', () => {
            const modifier = getIntelligenceModifier(5, 50); // 1:10 ratio
            expect(modifier).toBe(0.75);
        });
    });

    describe('PvP Combat Simulation', () => {
        test('should calculate damage with intelligence modifier', () => {
            const attacker = { health: 100, username: 'attacker' };
            const attackerStats = { strength: 20, intelligence: 30 };
            const defender = { health: 100, username: 'defender' };
            const defenderStats = { strength: 15, intelligence: 10 };
            
            const result = simulatePvPCombat(attacker, attackerStats, defender, defenderStats);
            
            expect(result.damage).toBeGreaterThan(0);
            expect(result.intelligenceModifier).toBe(1.20); // 3:1 ratio
            expect(typeof result.isKill).toBe('boolean');
            expect(result.defenderHealthAfter).toBeLessThanOrEqual(100);
        });

        test('should handle one-shot kills', () => {
            const attacker = { health: 100, username: 'strong_attacker' };
            const attackerStats = { strength: 200, intelligence: 50 };
            const defender = { health: 10, username: 'weak_defender' };
            const defenderStats = { strength: 5, intelligence: 10 };
            
            const result = simulatePvPCombat(attacker, attackerStats, defender, defenderStats);
            
            expect(result.isKill).toBe(true);
            expect(result.defenderHealthAfter).toBe(0);
        });

        test('should handle weak attacks', () => {
            const attacker = { health: 100, username: 'weak_attacker' };
            const attackerStats = { strength: 1, intelligence: 5 };
            const defender = { health: 100, username: 'strong_defender' };
            const defenderStats = { strength: 50, intelligence: 50 };
            
            const result = simulatePvPCombat(attacker, attackerStats, defender, defenderStats);
            
            expect(result.damage).toBeGreaterThanOrEqual(1); // Minimum 1 damage
            expect(result.isKill).toBe(false);
            expect(result.defenderHealthAfter).toBeGreaterThan(0);
        });
    });

    describe('Resource Theft', () => {
        test('should cap theft at 5% of resources', () => {
            const richPlayer = { 
                gold: 10000, 
                gems: 1000, 
                metals: 500 
            };
            const stolen = calculateResourceTheft(richPlayer, true);
            
            expect(stolen.gold).toBe(100); // Capped at 100
            expect(stolen.gems).toBe(5);   // Capped at 5  
            expect(stolen.metals).toBe(10); // Capped at 10
        });

        test('should steal nothing on non-kill', () => {
            const player = { 
                gold: 1000, 
                gems: 100, 
                metals: 50 
            };
            const stolen = calculateResourceTheft(player, false);
            
            expect(stolen.gold).toBe(0);
            expect(stolen.gems).toBe(0);
            expect(stolen.metals).toBe(0);
        });

        test('should handle poor players gracefully', () => {
            const poorPlayer = { 
                gold: 10, 
                gems: 1, 
                metals: 2 
            };
            const stolen = calculateResourceTheft(poorPlayer, true);
            
            expect(stolen.gold).toBe(0); // 5% of 10 = 0.5, floored to 0
            expect(stolen.gems).toBe(0); // 5% of 1 = 0.05, floored to 0
            expect(stolen.metals).toBe(0); // 5% of 2 = 0.1, floored to 0
        });

        test('should handle zero resources', () => {
            const emptyPlayer = { 
                gold: 0, 
                gems: 0, 
                metals: 0 
            };
            const stolen = calculateResourceTheft(emptyPlayer, true);
            
            expect(stolen.gold).toBe(0);
            expect(stolen.gems).toBe(0);
            expect(stolen.metals).toBe(0);
        });
    });

    describe('Target Validation', () => {
        test('should validate level range ±25%', () => {
            const attacker = { level: 10 };
            
            const validTargets = [
                { level: 8 },  // -20%
                { level: 10 }, // Same level
                { level: 12 }  // +20%
            ];
            
            const invalidTargets = [
                { level: 5 },  // -50%
                { level: 20 }  // +100%
            ];
            
            validTargets.forEach(target => {
                expect(isValidPvPTarget(attacker, target)).toBe(true);
            });
            
            invalidTargets.forEach(target => {
                expect(isValidPvPTarget(attacker, target)).toBe(false);
            });
        });

        test('should handle edge cases for level range', () => {
            const level1Attacker = { level: 1 };
            const level1Target = { level: 1 };
            
            expect(isValidPvPTarget(level1Attacker, level1Target)).toBe(true);
            
            const level100Attacker = { level: 100 };
            const level75Target = { level: 75 };   // 25% below
            const level125Target = { level: 125 }; // 25% above
            
            expect(isValidPvPTarget(level100Attacker, level75Target)).toBe(true);
            expect(isValidPvPTarget(level100Attacker, level125Target)).toBe(true);
        });
    });
});