import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { supabaseAdmin } from '../config/supabase.js';

// Mock app import
// import app from '../index.js';

describe('PvP Integration Tests', () => {
    let testSession = {
        players: {},
        cookies: {}
    };
    
    beforeAll(async () => {
        // Create comprehensive test scenario
        testSession.players.alice = await createFullTestPlayer({
            username: 'alice',
            email: 'alice@test.com',
            level: 15,
            pvp_mana: 5,
            health: 100,
            max_health: 100,
            gold: 5000,
            gems: 50,
            metals: 100,
            stats: { strength: 25, speed: 20, intelligence: 15 }
        });
        
        testSession.players.bob = await createFullTestPlayer({
            username: 'bob',
            email: 'bob@test.com', 
            level: 12,
            pvp_mana: 3,
            health: 80,
            max_health: 100,
            gold: 3000,
            gems: 20,
            metals: 50,
            stats: { strength: 18, speed: 22, intelligence: 20 }
        });
        
        testSession.players.charlie = await createFullTestPlayer({
            username: 'charlie',
            email: 'charlie@test.com',
            level: 25, // Too high level for alice/bob
            pvp_mana: 5,
            health: 100,
            max_health: 100,
            stats: { strength: 40, speed: 35, intelligence: 30 }
        });
        
        // Authenticate all players
        for (const [name, player] of Object.entries(testSession.players)) {
            testSession.cookies[name] = await authenticatePlayer(player);
        }
    });
    
    afterAll(async () => {
        await cleanupIntegrationTest(testSession);
    });

    describe('Complete PvP Flow', () => {
        test('should handle full attack sequence', async () => {
            // 1. Alice checks available targets
            const targetsRes = await request(app)
                .get('/api/pvp/targets')
                .set('Cookie', testSession.cookies.alice);
            
            expect(targetsRes.status).toBe(200);
            expect(targetsRes.body.pvp_mana).toBe(5);
            
            const targets = targetsRes.body.targets;
            expect(targets.find(t => t.username === 'bob')).toBeTruthy();
            expect(targets.find(t => t.username === 'charlie')).toBeFalsy(); // Too high level
            
            // 2. Alice attacks Bob
            const attackRes = await request(app)
                .post('/api/pvp/attack/bob')
                .set('Cookie', testSession.cookies.alice);
            
            expect(attackRes.status).toBe(200);
            const combat = attackRes.body.combat_result;
            expect(combat.damage).toBeGreaterThan(0);
            expect(combat.intelligence_modifier).toBeCloseTo(0.85, 2); // alice(15) / bob(20) = 0.75, maps to 0.85
            
            // 3. Check Alice's PvP mana decreased
            expect(attackRes.body.pvp_mana_remaining).toBe(4);
            
            // 4. Check Bob's protection status
            const bobStatusRes = await request(app)
                .get('/api/pvp/status')
                .set('Cookie', testSession.cookies.bob);
            
            expect(bobStatusRes.status).toBe(200);
            expect(bobStatusRes.body.protected_until).not.toBeNull();
            expect(bobStatusRes.body.protection_time_remaining).toBeGreaterThan(3500000); // ~1 hour minus a few seconds
            
            // 5. Alice can't attack Bob again (protection)
            const blockedAttackRes = await request(app)
                .post('/api/pvp/attack/bob')
                .set('Cookie', testSession.cookies.alice);
            
            expect(blockedAttackRes.status).toBe(400);
            expect(blockedAttackRes.body.error).toMatch(/protected/i);
            
            // 6. Check battle history
            const historyRes = await request(app)
                .get('/api/pvp/history')
                .set('Cookie', testSession.cookies.alice);
            
            expect(historyRes.status).toBe(200);
            expect(historyRes.body.battles).toHaveLength(1);
            
            const battle = historyRes.body.battles[0];
            expect(battle.attacker_id).toBe(testSession.players.alice.id);
            expect(battle.defender_id).toBe(testSession.players.bob.id);
        });

        test('should handle resource theft on kill', async () => {
            // Create a very weak target for guaranteed kill
            const weakPlayer = await createFullTestPlayer({
                username: 'weakplayer',
                email: 'weak@test.com',
                level: 15,
                pvp_mana: 1,
                health: 1, // Will die in one hit
                max_health: 100,
                gold: 10000, // Rich but weak
                gems: 1000,
                metals: 2000,
                stats: { strength: 1, speed: 1, intelligence: 1 }
            });
            
            const weakCookie = await authenticatePlayer(weakPlayer);
            
            // Alice attacks the weak player
            const attackRes = await request(app)
                .post('/api/pvp/attack/weakplayer')
                .set('Cookie', testSession.cookies.alice);
            
            expect(attackRes.status).toBe(200);
            expect(attackRes.body.combat_result.is_kill).toBe(true);
            
            const stolen = attackRes.body.combat_result.resources_stolen;
            expect(stolen.gold).toBe(100); // Capped at 100
            expect(stolen.gems).toBe(5);   // Capped at 5
            expect(stolen.metals).toBe(10); // Capped at 10
            
            // Check Alice gained the resources
            const aliceStatusRes = await request(app)
                .get('/api/pvp/status')
                .set('Cookie', testSession.cookies.alice);
            
            const aliceNewStats = aliceStatusRes.body.player;
            expect(aliceNewStats.gold).toBe(testSession.players.alice.gold + 100);
            
            await cleanupTestPlayer(weakPlayer);
        });

        test('should handle PvP mana depletion', async () => {
            // Deplete Alice's PvP mana to 1
            await updatePlayerPvPMana(testSession.players.alice.id, 1);
            
            // Create a new target (since Bob is protected)
            const newTarget = await createFullTestPlayer({
                username: 'newtarget',
                email: 'newtarget@test.com',
                level: 15,
                pvp_mana: 5,
                health: 100,
                stats: { strength: 20, speed: 20, intelligence: 20 }
            });
            const newCookie = await authenticatePlayer(newTarget);
            
            // Alice can attack once
            const attack1 = await request(app)
                .post('/api/pvp/attack/newtarget')
                .set('Cookie', testSession.cookies.alice);
            expect(attack1.status).toBe(200);
            expect(attack1.body.pvp_mana_remaining).toBe(0);
            
            // Reset target protection and try again - should fail due to no PvP mana
            await clearPlayerProtection(newTarget.id);
            await updatePlayerPvPMana(testSession.players.alice.id, 0);
            
            const attack2 = await request(app)
                .post('/api/pvp/attack/newtarget')
                .set('Cookie', testSession.cookies.alice);
            expect(attack2.status).toBe(400);
            expect(attack2.body.error).toMatch(/pvp mana/i);
            
            await cleanupTestPlayer(newTarget);
        });

        test('should handle concurrent attacks properly', async () => {
            // Reset Alice's PvP mana
            await updatePlayerPvPMana(testSession.players.alice.id, 5);
            
            // Create multiple targets
            const targets = [];
            for (let i = 0; i < 3; i++) {
                const target = await createFullTestPlayer({
                    username: `concurrent${i}`,
                    email: `concurrent${i}@test.com`,
                    level: 15,
                    health: 100,
                    stats: { strength: 20, speed: 20, intelligence: 20 }
                });
                targets.push(target);
            }
            
            // Make concurrent attacks
            const attackPromises = targets.map(target =>
                request(app)
                    .post(`/api/pvp/attack/${target.username}`)
                    .set('Cookie', testSession.cookies.alice)
            );
            
            const results = await Promise.all(attackPromises);
            
            // All attacks should succeed if Alice had enough PvP mana
            const successfulAttacks = results.filter(res => res.status === 200);
            expect(successfulAttacks.length).toBeGreaterThan(0);
            expect(successfulAttacks.length).toBeLessThanOrEqual(3);
            
            // Check final PvP mana is correct
            const finalStatus = await request(app)
                .get('/api/pvp/status')
                .set('Cookie', testSession.cookies.alice);
            
            expect(finalStatus.body.pvp_mana).toBe(5 - successfulAttacks.length);
            
            await Promise.all(targets.map(cleanupTestPlayer));
        });
    });

    describe('Edge Cases', () => {
        test('should handle dead players gracefully', async () => {
            // Set Alice's health to 0
            await updatePlayerHealth(testSession.players.alice.id, 0);
            
            const attackRes = await request(app)
                .post('/api/pvp/attack/bob')
                .set('Cookie', testSession.cookies.alice);
            
            expect(attackRes.status).toBe(400);
            expect(attackRes.body.error).toMatch(/must be alive/i);
            
            // Restore Alice's health
            await updatePlayerHealth(testSession.players.alice.id, 100);
        });

        test('should handle invalid usernames', async () => {
            const attackRes = await request(app)
                .post('/api/pvp/attack/nonexistent_user_12345')
                .set('Cookie', testSession.cookies.alice);
            
            expect(attackRes.status).toBe(404);
            expect(attackRes.body.error).toMatch(/not found/i);
        });

        test('should validate level changes during attack', async () => {
            // This tests race conditions where level changes between target finding and attack
            const targetsRes = await request(app)
                .get('/api/pvp/targets')
                .set('Cookie', testSession.cookies.alice);
            
            expect(targetsRes.body.targets.find(t => t.username === 'bob')).toBeTruthy();
            
            // Change Bob's level to be out of range
            await updatePlayerLevel(testSession.players.bob.id, 50);
            
            // Attack should now fail
            const attackRes = await request(app)
                .post('/api/pvp/attack/bob')
                .set('Cookie', testSession.cookies.alice);
            
            expect(attackRes.status).toBe(400);
            expect(attackRes.body.error).toMatch(/level range/i);
            
            // Restore Bob's level
            await updatePlayerLevel(testSession.players.bob.id, 12);
        });
    });
});

// Integration test utilities
async function createFullTestPlayer(playerData) {
    // Create complete player with auth user, player record, and stats
}

async function authenticatePlayer(player) {
    // Return auth cookie for player
}

async function cleanupIntegrationTest(session) {
    // Clean up all test data
}

async function updatePlayerPvPMana(playerId, mana) {
    // Update player's PvP mana
}

async function clearPlayerProtection(playerId) {
    // Remove protection from player
}

async function updatePlayerHealth(playerId, health) {
    // Update player's health
}

async function updatePlayerLevel(playerId, level) {
    // Update player's level
}

async function cleanupTestPlayer(player) {
    // Remove single test player
}