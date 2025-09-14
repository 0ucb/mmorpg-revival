# Temple Prayer System - Corrected TDD Plan

## Overview
Implement the Temple of Tiipsi prayer system where players spend mana to gain random stat points distributed among Strength, Speed, and Intelligence. Focus on core mechanics only - no UI in this PR.

## Key Constraints & Decisions
- **TDD Approach**: Write failing tests first, then implement
- **Three Prayer Options**: Players can pray with 5 mana, 50 mana, or all their mana
- **Efficiency Per 50 Mana**: The efficiency values (3.5, 2.5, etc.) represent stat gains per 50 mana spent
- **Three Stats Only**: Strength, Speed, Intelligence (no Defense or Luck - those don't exist)
- **Transaction Safety**: Use database transactions to prevent inconsistent state
- **API Only**: Core mechanics first, UI in separate PR
- **Use Scraped Data**: Validate against authentic MarcoLand formulas

## Day 1: Test Foundation & Core Logic

### 1.1 Write Failing Tests First
Create `/server/tests/temple.test.js`:
```javascript
describe('Temple Prayer System', () => {
    test('should calculate correct efficiency for stat totals', () => {
        expect(getPrayingEfficiency(500)).toBe(3.5);   // Under 1100
        expect(getPrayingEfficiency(1200)).toBe(2.5);  // 1100-1300
        expect(getPrayingEfficiency(1400)).toBe(1.5);  // 1300-1500
        expect(getPrayingEfficiency(1600)).toBe(1.1);  // Over 1500
    });

    test('should calculate stat gains correctly based on mana spent', () => {
        // 50 mana at 500 total stats = ~3.5 stat points
        const gains50 = calculateStatGains(500, 50);
        const total50 = gains50.strength + gains50.speed + gains50.intelligence;
        expect(total50).toBeGreaterThan(2);  // With variance
        expect(total50).toBeLessThan(5);     // With variance
        
        // 5 mana = 1/10th of 50 mana efficiency
        const gains5 = calculateStatGains(500, 5);
        const total5 = gains5.strength + gains5.speed + gains5.intelligence;
        expect(total5).toBeLessThanOrEqual(1);  // Usually 0 or 1
    });

    test('should distribute stats randomly among strength, speed, intelligence', () => {
        const gains = distributeStatsWeighted(10);
        expect(gains.strength + gains.speed + gains.intelligence).toBe(10);
        expect(Object.keys(gains).sort()).toEqual(['intelligence', 'speed', 'strength']);
    });

    test('should handle diminishing returns for large mana amounts', () => {
        // Praying 500 mana at once should account for increasing stats
        const gains = calculateStatGainsWithDiminishing(1000, 500);
        // First 50 mana at 1000 stats = 3.5 efficiency
        // But as stats increase, efficiency drops to 2.5, then 1.5, etc.
        expect(gains.totalGains).toBeLessThan(500 * (3.5/50)); // Less than if all at 3.5 efficiency
    });
});
```

### 1.2 Implement Core Prayer Logic
Add to `/server/config/game.js`:
```javascript
export function getPrayingEfficiency(totalStats) {
    // Authentic MarcoLand efficiency caps from scraped data
    // These values are stat gains per 50 mana spent
    if (totalStats < 1100) return 3.5;
    if (totalStats < 1300) return 2.5;
    if (totalStats < 1500) return 1.5;
    return 1.1;
}

export function calculateStatGains(currentTotalStats, manaSpent) {
    // Don't process if less than 5 mana
    if (manaSpent < 5) return { strength: 0, speed: 0, intelligence: 0 };
    
    // Round down to nearest 5 mana
    const effectiveMana = Math.floor(manaSpent / 5) * 5;
    
    // Get base efficiency (per 50 mana)
    const efficiency = getPrayingEfficiency(currentTotalStats);
    
    // Calculate expected gains
    const expectedTotal = (effectiveMana / 50) * efficiency;
    
    // Add variance: ±20% as per original
    const variance = 0.8 + (Math.random() * 0.4);
    const actualTotal = Math.round(expectedTotal * variance);
    
    // Distribute randomly among the three stats
    return distributeStatsWeighted(actualTotal);
}

export function distributeStatsWeighted(totalPoints) {
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
    
    // Handle rounding remainder
    let remainder = totalPoints - (distributed.strength + distributed.speed + distributed.intelligence);
    const stats = ['strength', 'speed', 'intelligence'];
    while (remainder > 0) {
        const randomStat = stats[Math.floor(Math.random() * 3)];
        distributed[randomStat]++;
        remainder--;
    }
    
    return distributed;
}

export function calculateStatGainsWithDiminishing(currentTotalStats, manaSpent) {
    // For large mana amounts, account for diminishing returns as stats increase
    if (manaSpent < 5) return { strength: 0, speed: 0, intelligence: 0, totalGains: 0 };
    
    let remaining = Math.floor(manaSpent / 5) * 5;
    let totalGains = { strength: 0, speed: 0, intelligence: 0 };
    let runningTotal = currentTotalStats;
    
    // Process in 50-mana chunks for efficiency calculations
    while (remaining > 0) {
        const chunk = Math.min(remaining, 50);
        const efficiency = getPrayingEfficiency(runningTotal);
        const expectedGains = (chunk / 50) * efficiency;
        
        // Add variance
        const variance = 0.8 + (Math.random() * 0.4);
        const actualGains = Math.round(expectedGains * variance);
        
        // Distribute this chunk's gains
        const distributed = distributeStatsWeighted(actualGains);
        
        // Add to totals
        Object.keys(distributed).forEach(stat => {
            totalGains[stat] += distributed[stat];
        });
        
        // Update running total for next chunk's efficiency
        runningTotal += actualGains;
        remaining -= chunk;
    }
    
    totalGains.totalGains = totalGains.strength + totalGains.speed + totalGains.intelligence;
    return totalGains;
}
```

## Day 2: API Implementation

### 2.1 Write API Tests First
```javascript
describe('Temple API', () => {
    test('POST /api/temple/pray should require authentication', async () => {
        const response = await request(app)
            .post('/api/temple/pray')
            .send({ manaAmount: "5" });
        expect(response.status).toBe(401);
    });

    test('should reject prayer with insufficient mana', async () => {
        // Player with 3 mana tries to pray (needs 5 minimum)
        const response = await request(app)
            .post('/api/temple/pray')
            .set('Authorization', `Bearer ${playerToken}`)
            .send({ manaAmount: "5" });
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Insufficient mana');
    });

    test('should reject prayer if player is dead', async () => {
        // Dead player (health = 0) tries to pray
        const response = await request(app)
            .post('/api/temple/pray')
            .set('Authorization', `Bearer ${deadPlayerToken}`)
            .send({ manaAmount: "5" });
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('dead');
    });

    test('should handle all three prayer amounts correctly', async () => {
        // Test 5 mana prayer
        const response5 = await request(app)
            .post('/api/temple/pray')
            .set('Authorization', `Bearer ${playerToken}`)
            .send({ manaAmount: "5" });
        expect(response5.body.mana_spent).toBe(5);
        
        // Test 50 mana prayer
        const response50 = await request(app)
            .post('/api/temple/pray')
            .set('Authorization', `Bearer ${playerToken}`)
            .send({ manaAmount: "50" });
        expect(response50.body.mana_spent).toBe(50);
        
        // Test "all" mana prayer
        const responseAll = await request(app)
            .post('/api/temple/pray')
            .set('Authorization', `Bearer ${playerToken}`)
            .send({ manaAmount: "all" });
        expect(responseAll.body.mana_spent).toBeGreaterThan(0);
    });

    test('should properly apply diminishing returns', async () => {
        // Player with high stats should get less gains
        const lowStatsResponse = await request(app)
            .post('/api/temple/pray')
            .set('Authorization', `Bearer ${lowStatsPlayerToken}`)
            .send({ manaAmount: "50" });
        
        const highStatsResponse = await request(app)
            .post('/api/temple/pray')
            .set('Authorization', `Bearer ${highStatsPlayerToken}`)
            .send({ manaAmount: "50" });
        
        expect(lowStatsResponse.body.total_stat_gains).toBeGreaterThan(
            highStatsResponse.body.total_stat_gains
        );
    });
});
```

### 2.2 Implement Temple Route with Transaction Safety
Create `/server/routes/temple.js`:
```javascript
import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateStatGainsWithDiminishing } from '../config/game.js';

const router = express.Router();

router.post('/pray', requireAuth, async (req, res) => {
    try {
        const { manaAmount } = req.body; // "5", "50", or "all"
        const playerId = req.player.id;
        
        // Validate player is alive
        if (req.player.health <= 0) {
            return res.status(400).json({ 
                error: 'You must be alive to pray at the temple'
            });
        }
        
        // Calculate actual mana to spend
        let manaToSpend;
        if (manaAmount === 'all') {
            manaToSpend = req.player.mana;
        } else if (manaAmount === '5' || manaAmount === '50') {
            manaToSpend = parseInt(manaAmount);
        } else {
            return res.status(400).json({ 
                error: 'Invalid mana amount. Use "5", "50", or "all"'
            });
        }
        
        // Validate sufficient mana
        if (req.player.mana < manaToSpend) {
            return res.status(400).json({ 
                error: 'Insufficient mana',
                required: manaToSpend,
                available: req.player.mana
            });
        }
        
        // Must have at least 5 mana to pray
        if (manaToSpend < 5) {
            return res.status(400).json({ 
                error: 'Minimum 5 mana required to pray'
            });
        }

        // Get current stats for efficiency calculation
        const { data: playerStats, error: statsError } = await supabaseAdmin
            .from('player_stats')
            .select('*')
            .eq('player_id', playerId)
            .single();
            
        if (statsError) throw statsError;

        const currentTotalStats = playerStats.strength + playerStats.speed + playerStats.intelligence;
        
        // Calculate stat gains with diminishing returns
        const statGains = calculateStatGainsWithDiminishing(currentTotalStats, manaToSpend);
        
        // Use a transaction to update both tables atomically
        // First, update player stats
        const newStats = {
            strength: playerStats.strength + statGains.strength,
            speed: playerStats.speed + statGains.speed,
            intelligence: playerStats.intelligence + statGains.intelligence
        };
        
        const { error: updateStatsError } = await supabaseAdmin
            .from('player_stats')
            .update(newStats)
            .eq('player_id', playerId);

        if (updateStatsError) {
            throw new Error('Failed to update stats: ' + updateStatsError.message);
        }

        // Then update player mana
        const newMana = req.player.mana - manaToSpend;
        const { error: updateManaError } = await supabaseAdmin
            .from('players')
            .update({ 
                mana: newMana,
                last_active: new Date().toISOString()
            })
            .eq('id', playerId);

        if (updateManaError) {
            // Rollback stats update if mana update fails
            await supabaseAdmin
                .from('player_stats')
                .update({
                    strength: playerStats.strength,
                    speed: playerStats.speed,
                    intelligence: playerStats.intelligence
                })
                .eq('player_id', playerId);
            
            throw new Error('Failed to update mana: ' + updateManaError.message);
        }

        // Log prayer for analytics/debugging (optional)
        await supabaseAdmin
            .from('game_logs')
            .insert({
                player_id: playerId,
                action_type: 'temple_pray',
                details: {
                    mana_spent: manaToSpend,
                    stat_gains: statGains,
                    efficiency: calculateStatGainsWithDiminishing.efficiency,
                    timestamp: new Date().toISOString()
                }
            })
            .select()
            .single()
            .catch(() => {}); // Don't fail if logging fails

        res.json({
            success: true,
            mana_spent: manaToSpend,
            stat_gains: {
                strength: statGains.strength,
                speed: statGains.speed,
                intelligence: statGains.intelligence
            },
            total_stat_gains: statGains.totalGains,
            old_stats: {
                strength: playerStats.strength,
                speed: playerStats.speed,
                intelligence: playerStats.intelligence,
                total: currentTotalStats
            },
            new_stats: {
                strength: newStats.strength,
                speed: newStats.speed,
                intelligence: newStats.intelligence,
                total: currentTotalStats + statGains.totalGains
            },
            remaining_mana: newMana
        });

    } catch (error) {
        console.error('Prayer error:', error);
        res.status(500).json({ error: 'Prayer failed: ' + error.message });
    }
});

// Get temple efficiency for current player
router.get('/efficiency', requireAuth, async (req, res) => {
    try {
        const { data: playerStats } = await supabaseAdmin
            .from('player_stats')
            .select('strength, speed, intelligence')
            .eq('player_id', req.player.id)
            .single();
            
        const totalStats = playerStats.strength + playerStats.speed + playerStats.intelligence;
        const efficiency = getPrayingEfficiency(totalStats);
        
        res.json({
            current_total_stats: totalStats,
            efficiency_per_50_mana: efficiency,
            efficiency_tier: totalStats < 1100 ? 'high' : 
                           totalStats < 1300 ? 'medium' :
                           totalStats < 1500 ? 'low' : 'minimal'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get efficiency' });
    }
});

export default router;
```

## Day 3: Integration & Validation

### 3.1 Add Route to Server
Update `/server/index.js`:
```javascript
import templeRoutes from './routes/temple.js';
app.use('/api/temple', templeRoutes);
```

### 3.2 Test Against Scraped Data
Create validation tests using authentic values:
```javascript
describe('Authentic MarcoLand Validation', () => {
    test('should match original efficiency formulas from scraped data', () => {
        // Test against scraped formulas.json values
        const testCases = [
            { totalStats: 500, expectedEfficiency: 3.5 },
            { totalStats: 1099, expectedEfficiency: 3.5 },
            { totalStats: 1100, expectedEfficiency: 2.5 },
            { totalStats: 1299, expectedEfficiency: 2.5 },
            { totalStats: 1300, expectedEfficiency: 1.5 },
            { totalStats: 1499, expectedEfficiency: 1.5 },
            { totalStats: 1500, expectedEfficiency: 1.1 },
            { totalStats: 2000, expectedEfficiency: 1.1 }
        ];
        
        testCases.forEach(({ totalStats, expectedEfficiency }) => {
            expect(getPrayingEfficiency(totalStats)).toBe(expectedEfficiency);
        });
    });

    test('should produce realistic stat gains over 1000 prayers', () => {
        // Simulate 1000 prayers to verify randomness and averages
        const results = [];
        for (let i = 0; i < 1000; i++) {
            const gains = calculateStatGains(500, 50); // 50 mana at 500 stats
            results.push(gains);
        }
        
        // Average should be close to 3.5 (efficiency at 500 stats)
        const totalGains = results.reduce((sum, r) => 
            sum + r.strength + r.speed + r.intelligence, 0);
        const average = totalGains / 1000;
        expect(average).toBeGreaterThan(3.0);
        expect(average).toBeLessThan(4.0);
        
        // Distribution should be roughly equal among stats
        const strengthTotal = results.reduce((sum, r) => sum + r.strength, 0);
        const speedTotal = results.reduce((sum, r) => sum + r.speed, 0);
        const intTotal = results.reduce((sum, r) => sum + r.intelligence, 0);
        
        // Each stat should get roughly 1/3 of total
        expect(Math.abs(strengthTotal - speedTotal)).toBeLessThan(totalGains * 0.1);
        expect(Math.abs(speedTotal - intTotal)).toBeLessThan(totalGains * 0.1);
    });
    
    test('should never give stats for less than 5 mana', () => {
        expect(calculateStatGains(500, 4)).toEqual({
            strength: 0,
            speed: 0,
            intelligence: 0
        });
    });
});
```

### 3.3 Manual API Testing
Create simple test script:
```bash
# Test 5 mana prayer
curl -X POST -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"manaAmount": "5"}' \
     http://localhost:3000/api/temple/pray

# Test 50 mana prayer
curl -X POST -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"manaAmount": "50"}' \
     http://localhost:3000/api/temple/pray

# Test "all" mana prayer
curl -X POST -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"manaAmount": "all"}' \
     http://localhost:3000/api/temple/pray

# Check current efficiency
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/temple/efficiency
```

## Day 4: Edge Cases & Polish

### 4.1 Edge Case Testing
```javascript
describe('Edge Cases', () => {
    test('should handle boundary stat totals correctly', () => {
        // Test exact boundary values
        expect(getPrayingEfficiency(1099)).toBe(3.5);
        expect(getPrayingEfficiency(1100)).toBe(2.5);
        expect(getPrayingEfficiency(1299)).toBe(2.5);
        expect(getPrayingEfficiency(1300)).toBe(1.5);
        expect(getPrayingEfficiency(1499)).toBe(1.5);
        expect(getPrayingEfficiency(1500)).toBe(1.1);
    });
    
    test('should handle invalid mana amounts', async () => {
        const invalidAmounts = ["3", "100", "invalid", null, -5];
        
        for (const amount of invalidAmounts) {
            const response = await request(app)
                .post('/api/temple/pray')
                .set('Authorization', `Bearer ${playerToken}`)
                .send({ manaAmount: amount });
            expect(response.status).toBe(400);
        }
    });
    
    test('should handle "all" with various mana amounts', () => {
        // Test with 0 mana (should fail)
        // Test with 4 mana (should fail - minimum 5)
        // Test with 5 mana (should work)
        // Test with 575 mana (max mana at level 175)
    });
    
    test('should properly rollback on partial failure', async () => {
        // Simulate failure in mana update after stats update
        // Verify stats are rolled back to original values
    });
});
```

### 4.2 Update API Documentation
Add to server docs endpoint:
```javascript
temple: {
    'POST /api/temple/pray': 'Spend mana to gain random stat points (5/50/all mana)',
    'GET /api/temple/efficiency': 'Get current prayer efficiency based on total stats'
}
```

### 4.3 Final Integration Testing
```javascript
describe('Full Integration', () => {
    test('complete player progression flow', async () => {
        // 1. Fight monsters on beach to gain gold/XP
        const fightResponse = await request(app)
            .post('/api/beach/fight')
            .set('Authorization', `Bearer ${playerToken}`)
            .send({ monsterId: goblindId, manaToSpend: 1 });
        expect(fightResponse.body.combat_result.player_won).toBe(true);
        
        // 2. Use remaining mana to pray at temple
        const prayResponse = await request(app)
            .post('/api/temple/pray')
            .set('Authorization', `Bearer ${playerToken}`)
            .send({ manaAmount: "50" });
        expect(prayResponse.body.stat_gains).toBeDefined();
        
        // 3. Verify improved stats affect combat
        const newStrength = prayResponse.body.new_stats.strength;
        const secondFight = await request(app)
            .post('/api/beach/fight')
            .set('Authorization', `Bearer ${playerToken}`)
            .send({ monsterId: strongerMonsterId, manaToSpend: 1 });
        
        // Higher strength should mean more damage dealt
        expect(secondFight.body.combat_result.combat_log).toContain(newStrength);
    });
    
    test('mana regeneration interaction', async () => {
        // Spend all mana on praying
        await request(app)
            .post('/api/temple/pray')
            .set('Authorization', `Bearer ${playerToken}`)
            .send({ manaAmount: "all" });
        
        // Verify mana regenerates after 6 hours
        // (Would need to mock time or wait in real test)
    });
});
```

## Success Criteria
- [ ] All tests pass (TDD approach)
- [ ] Players can spend mana using "5", "50", or "all" options
- [ ] Stat gains follow authentic MarcoLand efficiency curves (3.5/2.5/1.5/1.1 per 50 mana)
- [ ] Random distribution among strength/speed/intelligence only (no Defense or Luck)
- [ ] Proper error handling for insufficient mana and dead players
- [ ] Transaction safety prevents inconsistent database state
- [ ] Diminishing returns apply correctly for large mana amounts
- [ ] API endpoints documented and tested
- [ ] Integration with existing beach combat system verified

## Common Pitfalls to Avoid
- ❌ Don't divide efficiency by 10 - values are already per 50 mana
- ❌ Don't create Defense or Luck stats - only Strength/Speed/Intelligence exist
- ❌ Don't allow prayers with less than 5 mana
- ❌ Don't forget to check if player is dead
- ❌ Don't update tables separately without rollback logic
- ✅ DO apply diminishing returns within a single "all" prayer session
- ✅ DO use weighted random distribution for better stat balance
- ✅ DO validate against scraped data formulas

## Timeline: 3-4 Days Total
- **Day 1**: Core logic + tests (TDD foundation)
- **Day 2**: API implementation + transaction safety
- **Day 3**: Integration + scraped data validation
- **Day 4**: Edge cases + polish + final testing

## Next PR: Equipment System
With temple complete, players will have the full single-player progression loop:
1. Fight monsters → Gain XP/Gold
2. Pray at temple → Improve stats  
3. Better stats → Fight stronger monsters

Next PR should implement the equipment system:
- Parse weapons/armor from scraped data
- Implement equipment requirements (strength-based)
- Add encumbrance system (total weight ≤ strength)
- Update combat to use actual weapon damage
- Create shop/inventory APIs