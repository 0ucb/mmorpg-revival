import { describe, test, expect } from 'vitest';
import { 
    isPlayerProtected,
    createProtection,
    getProtectionTimeRemaining,
    canAttackTarget
} from '../config/pvp.js';

describe('PvP Protection System', () => {
    describe('Protection Status', () => {
        test('should identify protected players', () => {
            const now = new Date();
            const futureTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
            const pastTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
            
            const protectedPlayer = {
                player_id: 'player1',
                protected_until: futureTime
            };
            
            const unprotectedPlayer = {
                player_id: 'player2',
                protected_until: pastTime
            };
            
            expect(isPlayerProtected(protectedPlayer)).toBe(true);
            expect(isPlayerProtected(unprotectedPlayer)).toBe(false);
        });

        test('should handle null protection gracefully', () => {
            expect(isPlayerProtected(null)).toBe(false);
            expect(isPlayerProtected(undefined)).toBe(false);
        });
    });

    describe('Protection Creation', () => {
        test('should create 10-minute protection after attack', () => {
            const defenderId = 'defender123';
            const attackerId = 'attacker456';
            const now = new Date();
            
            const protection = createProtection(defenderId, attackerId, now);
            
            expect(protection.player_id).toBe(defenderId);
            expect(protection.last_attacker_id).toBe(attackerId);
            
            const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);
            expect(protection.protected_until.getTime()).toBeCloseTo(tenMinutesLater.getTime(), -1000);
        });
    });

    describe('Protection Time Remaining', () => {
        test('should calculate correct time remaining', () => {
            const now = new Date();
            const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
            
            const protection = {
                protected_until: thirtyMinutesFromNow
            };
            
            const timeRemaining = getProtectionTimeRemaining(protection, now);
            expect(timeRemaining).toBeCloseTo(30 * 60 * 1000, 1000); // ~30 minutes in milliseconds
        });

        test('should return 0 for expired protection', () => {
            const now = new Date();
            const pastTime = new Date(now.getTime() - 60 * 1000); // 1 minute ago
            
            const expiredProtection = {
                protected_until: pastTime
            };
            
            const timeRemaining = getProtectionTimeRemaining(expiredProtection, now);
            expect(timeRemaining).toBe(0);
        });

        test('should handle null protection', () => {
            const timeRemaining = getProtectionTimeRemaining(null);
            expect(timeRemaining).toBe(0);
        });
    });

    describe('Attack Validation', () => {
        test('should prevent attacking protected players', () => {
            const now = new Date();
            const attacker = { id: 'attacker', level: 10 };
            
            const protectedTarget = {
                id: 'target',
                level: 10,
                protection: {
                    protected_until: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour
                }
            };
            
            const unprotectedTarget = {
                id: 'target2',
                level: 10,
                protection: null
            };
            
            expect(canAttackTarget(attacker, protectedTarget)).toBe(false);
            expect(canAttackTarget(attacker, unprotectedTarget)).toBe(true);
        });

        test('should allow attacking after protection expires', () => {
            const now = new Date();
            const attacker = { id: 'attacker', level: 10 };
            
            const expiredProtectionTarget = {
                id: 'target',
                level: 10,
                protection: {
                    protected_until: new Date(now.getTime() - 1000) // 1 second ago
                }
            };
            
            expect(canAttackTarget(attacker, expiredProtectionTarget, now)).toBe(true);
        });

        test('should prevent self-attack', () => {
            const player = { id: 'player1', level: 10 };
            
            expect(canAttackTarget(player, player)).toBe(false);
        });

        test('should enforce level range with protection', () => {
            const attacker = { id: 'attacker', level: 10 };
            const tooHighLevelTarget = { 
                id: 'target',
                level: 20, // 100% higher
                protection: null
            };
            
            expect(canAttackTarget(attacker, tooHighLevelTarget)).toBe(false);
        });
    });
});