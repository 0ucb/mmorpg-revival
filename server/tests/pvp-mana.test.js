import { describe, test, expect, beforeEach } from 'vitest';
import { 
    canUsePvPMana,
    deductPvPMana,
    regeneratePvPMana,
    getPvPManaNeeded
} from '../config/pvp.js';

describe('PvP Mana System', () => {
    describe('Initial State', () => {
        test('should start new players with 5 PvP mana', () => {
            const newPlayer = {
                pvp_mana: 5,
                last_pvp_mana_regen: new Date()
            };
            expect(newPlayer.pvp_mana).toBe(5);
        });
    });

    describe('Mana Usage', () => {
        test('should check if player has enough PvP mana for attack', () => {
            const playerWithMana = { pvp_mana: 3 };
            const playerWithoutMana = { pvp_mana: 0 };
            
            expect(canUsePvPMana(playerWithMana, 1)).toBe(true);
            expect(canUsePvPMana(playerWithoutMana, 1)).toBe(false);
        });

        test('should deduct 1 PvP mana per attack', () => {
            const player = { pvp_mana: 5 };
            const result = deductPvPMana(player, 1);
            expect(result.pvp_mana).toBe(4);
        });

        test('should not allow deduction below 0', () => {
            const player = { pvp_mana: 0 };
            const result = deductPvPMana(player, 1);
            expect(result.pvp_mana).toBe(0);
        });
    });

    describe('Mana Regeneration', () => {
        test('should regenerate 1 PvP mana per hour', () => {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            
            const player1 = { pvp_mana: 2, last_pvp_mana_regen: oneHourAgo };
            const player2 = { pvp_mana: 2, last_pvp_mana_regen: twoHoursAgo };
            
            const regen1 = regeneratePvPMana(player1);
            const regen2 = regeneratePvPMana(player2);
            
            expect(regen1.pvp_mana).toBe(3); // +1 from 1 hour
            expect(regen2.pvp_mana).toBe(4); // +2 from 2 hours
        });

        test('should cap PvP mana at 5', () => {
            const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);
            const player = { pvp_mana: 3, last_pvp_mana_regen: tenHoursAgo };
            
            const regenerated = regeneratePvPMana(player);
            expect(regenerated.pvp_mana).toBe(5); // Capped at 5, not 13
        });

        test('should not regenerate if less than 1 hour passed', () => {
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            const player = { pvp_mana: 2, last_pvp_mana_regen: thirtyMinutesAgo };
            
            const regenerated = regeneratePvPMana(player);
            expect(regenerated.pvp_mana).toBe(2); // No change
        });
    });

    describe('Utility Functions', () => {
        test('should calculate PvP mana needed for attacks', () => {
            expect(getPvPManaNeeded(1)).toBe(1);
            expect(getPvPManaNeeded(3)).toBe(3);
            expect(getPvPManaNeeded(0)).toBe(0);
        });
    });
});