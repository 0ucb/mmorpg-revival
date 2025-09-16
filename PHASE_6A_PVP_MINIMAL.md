# Phase 6A: Minimal PvP System - PR #1 of 4

## Executive Summary
Introduce a **minimal PvP combat system** that reuses existing game mechanics while adding a separate PvP mana pool to prevent PvE/PvP resource conflicts. This PR focuses solely on player-versus-player combat with simple, fair mechanics.

**Duration**: 1 week  
**Complexity**: Low (reuses 85% existing code)  
**Risk**: Minimal (extends proven systems)

## Design Principles
1. **DRY**: Reuse existing combat calculations from PvE
2. **TDD**: Write tests before implementation
3. **Simple**: Minimal new concepts (just PvP mana)
4. **Fair**: Reasonable protection and limits
5. **Data-driven**: Monitor and adjust based on metrics

## What We're Building

### Core Features (ONLY)
1. Separate PvP mana system (5 max, 1 per attack, regenerates 1/hour)
2. Attack another player (costs 1 PvP mana)
3. Find valid targets (±25% level range)
4. View combat history
5. Basic protection after being attacked (1 hour)

### What We're NOT Building (Yet)
- ❌ Buddy/blacklist systems
- ❌ Revenge mechanics
- ❌ Complex leaderboards
- ❌ Real-time notifications
- ❌ PvP mana scaling with level
- ❌ Death penalties to PvP mana

## Database Changes (Minimal)

```sql
-- Add PvP mana to players table (simple addition)
ALTER TABLE players ADD COLUMN IF NOT EXISTS
    pvp_mana INTEGER DEFAULT 5,
    last_pvp_mana_regen TIMESTAMP DEFAULT NOW();

-- Single new table for PvP-specific data
CREATE TABLE pvp_battles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attacker_id UUID REFERENCES players(id) NOT NULL,
    defender_id UUID REFERENCES players(id) NOT NULL,
    
    -- Combat details
    attacker_damage INTEGER NOT NULL,
    defender_health_before INTEGER NOT NULL,
    defender_health_after INTEGER NOT NULL,
    intelligence_modifier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    
    -- Resource changes (capped at 5%)
    gold_stolen INTEGER DEFAULT 0,
    gems_stolen INTEGER DEFAULT 0,
    metals_stolen INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    is_kill BOOLEAN DEFAULT FALSE,
    
    -- Indexes for performance
    INDEX idx_attacker_time (attacker_id, created_at DESC),
    INDEX idx_defender_time (defender_id, created_at DESC),
    INDEX idx_recent_battles (created_at DESC)
);

-- Protection tracking (simple)
CREATE TABLE pvp_protection (
    player_id UUID PRIMARY KEY REFERENCES players(id),
    protected_until TIMESTAMP NOT NULL,
    last_attacker_id UUID REFERENCES players(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add PvP stats to existing player_stats table (don't create new table)
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS
    pvp_kills INTEGER DEFAULT 0,
    pvp_deaths INTEGER DEFAULT 0,
    pvp_damage_dealt BIGINT DEFAULT 0,
    pvp_damage_taken BIGINT DEFAULT 0;
```

## API Design (Following Existing Patterns)

### Routes (`server/routes/pvp.js`)
```javascript
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { pvpLimiter } from '../middleware/rateLimiting.js';

const router = express.Router();

// GET /api/pvp/targets - Find attackable players
router.get('/targets', requireAuth, async (req, res) => {
    // Returns players within ±25% level range
    // Excludes protected players
    // Excludes players attacked by you in last hour
    // Shows your current PvP mana
});

// POST /api/pvp/attack/:username - Attack a player
router.post('/attack/:username', requireAuth, pvpLimiter, async (req, res) => {
    // Validate: 1 PvP mana available
    // Validate: target in level range
    // Validate: target not protected
    // Execute: Use existing simulateCombat with PvP modifier
    // Update: Both players' health/resources
    // Deduct: 1 PvP mana from attacker
    // Protection: Give defender 1-hour shield
});

// GET /api/pvp/history - Your recent battles
router.get('/history', requireAuth, async (req, res) => {
    // Last 50 battles as attacker or defender
    // Include combat logs
});

// GET /api/pvp/status - Check PvP status
router.get('/status', requireAuth, async (req, res) => {
    // Returns: pvp_mana, protection status, stats
});
```

## PvP Mana Regeneration (Piggyback on Existing System)

```javascript
// server/services/manaRegeneration.js - Add 2 lines to existing service
const updateQuery = `
    UPDATE players 
    SET 
        mana = LEAST(mana + ?, max_mana),
        pvp_mana = LEAST(pvp_mana + 1, 5),  -- Add this line
        last_mana_regen = NOW(),
        last_pvp_mana_regen = NOW()          -- Add this line
    WHERE 
        last_mana_regen < NOW() - INTERVAL '1 hour'
        AND health > 0
`;
```

## Combat Calculation (Reuse Existing)

```javascript
// server/config/pvp.js - Minimal new code
import { simulateCombat, getIntelligenceModifier } from './game.js';

export function simulatePvPCombat(attacker, attackerStats, defender, defenderStats) {
    // 1. Use existing simulateCombat as base
    const baseResult = simulateCombat(attacker, attackerStats, {
        name: defender.username,
        health: defender.health,
        defense: 0, // Players have no base defense
        damage: defenderStats.strength,
        loot_table: {}
    });
    
    // 2. Apply intelligence modifier (only PvP difference)
    const intModifier = getIntelligenceModifier(
        attackerStats.intelligence, 
        defenderStats.intelligence
    );
    
    // 3. Calculate final damage with INT modifier
    const finalDamage = Math.floor(baseResult.damageDealt * intModifier);
    
    // 4. Return simple result
    return {
        damage: finalDamage,
        defenderHealthAfter: Math.max(0, defender.health - finalDamage),
        isKill: defender.health - finalDamage <= 0,
        intelligenceModifier: intModifier
    };
}
```

## Resource Theft (Simple & Fair)

```javascript
// 5% cap on resource loss (not 20% - too punitive)
export function calculateResourceTheft(defender, isKill) {
    if (!isKill) return { gold: 0, gems: 0, metals: 0 };
    
    return {
        gold: Math.min(100, Math.floor(defender.gold * 0.05)),
        gems: Math.min(5, Math.floor(defender.gems * 0.05)),
        metals: Math.min(10, Math.floor(defender.metals * 0.05))
    };
}
```

## Test-Driven Development

### Test Files Structure
```
server/tests/
├── pvp-combat.test.js      # Core combat calculations
├── pvp-mana.test.js        # PvP mana system
├── pvp-protection.test.js  # Protection system
├── pvp-api.test.js         # API endpoints
└── pvp-integration.test.js # Full flow tests
```

### Example Test Suite (`pvp-combat.test.js`)
```javascript
import { describe, test, expect } from 'vitest';
import { simulatePvPCombat, calculateResourceTheft } from '../config/pvp.js';

describe('PvP Mana System', () => {
    test('should start new players with 5 PvP mana', () => {
        const newPlayer = createTestPlayer();
        expect(newPlayer.pvp_mana).toBe(5);
    });
    
    test('should deduct 1 PvP mana per attack', () => {
        const player = { pvp_mana: 5 };
        const afterAttack = deductPvPMana(player);
        expect(afterAttack.pvp_mana).toBe(4);
    });
    
    test('should regenerate 1 PvP mana per hour', async () => {
        // Set last_pvp_mana_regen to 2 hours ago
        const player = { pvp_mana: 2, last_pvp_mana_regen: twoHoursAgo };
        const regenerated = await regeneratePvPMana(player);
        expect(regenerated.pvp_mana).toBe(4); // +2, capped at 5
    });
    
    test('should cap PvP mana at 5', () => {
        const player = { pvp_mana: 5 };
        const regenerated = addPvPMana(player, 3);
        expect(regenerated.pvp_mana).toBe(5); // Still 5, not 8
    });
});

describe('PvP Combat Calculations', () => {
    describe('Intelligence Modifier', () => {
        test('should apply correct modifier based on INT ratio', () => {
            const testCases = [
                { attackerInt: 10, defenderInt: 10, expectedMod: 1.00 },
                { attackerInt: 5, defenderInt: 10, expectedMod: 0.85 },
                { attackerInt: 20, defenderInt: 10, expectedMod: 1.10 },
                { attackerInt: 50, defenderInt: 10, expectedMod: 1.40 }
            ];
            
            testCases.forEach(({ attackerInt, defenderInt, expectedMod }) => {
                const result = simulatePvPCombat(
                    { health: 100 },
                    { strength: 10, intelligence: attackerInt },
                    { username: 'target', health: 100 },
                    { strength: 10, intelligence: defenderInt }
                );
                expect(result.intelligenceModifier).toBe(expectedMod);
            });
        });
    });
    
    describe('Resource Theft', () => {
        test('should cap theft at 5% of resources', () => {
            const richPlayer = { gold: 10000, gems: 1000, metals: 500 };
            const stolen = calculateResourceTheft(richPlayer, true);
            
            expect(stolen.gold).toBe(100); // Capped at 100
            expect(stolen.gems).toBe(5);   // Capped at 5
            expect(stolen.metals).toBe(10); // Capped at 10
        });
        
        test('should steal nothing on non-kill', () => {
            const player = { gold: 1000, gems: 100, metals: 50 };
            const stolen = calculateResourceTheft(player, false);
            
            expect(stolen.gold).toBe(0);
            expect(stolen.gems).toBe(0);
            expect(stolen.metals).toBe(0);
        });
    });
});
```

### API Test Suite (`pvp-api.test.js`)
```javascript
import request from 'supertest';
import app from '../index.js';

describe('PvP API Endpoints', () => {
    let authCookie;
    let testPlayer;
    
    beforeEach(async () => {
        // Setup test players and auth
    });
    
    describe('POST /api/pvp/attack/:username', () => {
        test('should require 1 PvP mana to attack', async () => {
            // Set player PvP mana to 0
            const res = await request(app)
                .post('/api/pvp/attack/target')
                .set('Cookie', authCookie);
                
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/pvp mana/i);
        });
        
        test('should enforce level range ±25%', async () => {
            // Create level 10 attacker, level 20 target
            const res = await request(app)
                .post('/api/pvp/attack/highlevel')
                .set('Cookie', authCookie);
                
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/level range/i);
        });
        
        test('should protect defender for 1 hour after attack', async () => {
            // First attack succeeds
            const attack1 = await request(app)
                .post('/api/pvp/attack/target')
                .set('Cookie', authCookie);
            expect(attack1.status).toBe(200);
            
            // Second attack fails due to protection
            const attack2 = await request(app)
                .post('/api/pvp/attack/target')
                .set('Cookie', authCookie);
            expect(attack2.status).toBe(400);
            expect(attack2.body.error).toMatch(/protected/i);
        });
    });
});
```

## Rate Limiting & Anti-Abuse

```javascript
// server/middleware/rateLimiting.js (add to existing file)
export const pvpLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 2, // 2 attacks per minute max
    message: 'Too many attacks, please wait',
    standardHeaders: true,
    legacyHeaders: false
});

// Additional protections in attack endpoint:
// - Can't attack same player twice within 1 hour
// - Can't attack while under protection yourself
// - Can't attack if defender has <10% health
```

## Frontend Integration (Minimal UI)

### New Screen: `client/src/components/screens/PvPScreen.jsx`
```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function PvPScreen() {
    const { player, refreshPlayer } = useAuth();
    const [targets, setTargets] = useState([]);
    const [pvpStatus, setPvpStatus] = useState({ pvp_mana: 0 });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Show PvP mana at top: "PvP Mana: 3/5"
    // Simple target list with [attack] links
    // Follow existing green-link pattern from BeachScreen
    // Disable attack links when pvp_mana = 0
}
```

### Add to City Screen
```jsx
// In CityScreen.jsx, add one link:
<Link to="/pvp" className="city-link">Arena (PvP)</Link>
```

## Implementation Timeline

### Day 1-2: TDD Foundation
- [ ] Write all test suites (mana, combat, protection, API)
- [ ] Run tests (all should fail initially)
- [ ] Create database migrations (add pvp_mana columns)

### Day 3-4: Core Implementation
- [ ] Add PvP mana to player model
- [ ] Extend mana regeneration service (2 lines)
- [ ] Implement PvP combat calculations
- [ ] Create API endpoints
- [ ] Make tests pass one by one

### Day 5: Protection & Limits
- [ ] Add 1-hour protection system
- [ ] Implement rate limiting
- [ ] Add level range validation
- [ ] Test PvP mana deduction

### Day 6: Frontend
- [ ] Create minimal PvP screen with mana display
- [ ] Add to navigation
- [ ] Test full flow

### Day 7: Polish & Monitoring
- [ ] Add logging for analysis
- [ ] Performance testing
- [ ] Deploy to staging

## Success Metrics

### Must Have (Week 1)
- [ ] Players can attack each other using PvP mana
- [ ] PvP mana regenerates separately from regular mana
- [ ] Protection prevents griefing (1 hour)
- [ ] Resource loss is capped at 5%
- [ ] All tests passing
- [ ] No performance degradation

### Nice to Have (If Time)
- [ ] Basic attack notifications
- [ ] Simple win/loss counter
- [ ] Attack success message

### Explicitly Excluded (Future PRs)
- [ ] Buddy lists
- [ ] Revenge systems
- [ ] Complex leaderboards
- [ ] PvP mana scaling with level
- [ ] Death penalties affecting PvP mana
- [ ] Daily limits beyond rate limiting

## Monitoring & Adjustment Plan

```javascript
// Log every PvP action for analysis
await supabaseAdmin.from('game_logs').insert({
    action_type: 'pvp_attack',
    details: {
        attacker_id,
        defender_id,
        damage,
        resources_stolen,
        level_difference,
        intelligence_ratio
    }
});
```

### Week 1 Analysis Points
1. Average attacks per player per day
2. Resource loss distribution
3. Protection effectiveness
4. Level range appropriateness
5. Player retention impact

### Adjustment Levers (Config-driven)
```javascript
// config/pvp.js - Easy to adjust without code changes
export const pvpConfig = {
    pvpManaCost: parseInt(process.env.PVP_MANA_COST || '1'),
    pvpManaMax: parseInt(process.env.PVP_MANA_MAX || '5'),
    pvpManaRegenPerHour: parseInt(process.env.PVP_MANA_REGEN || '1'),
    levelRangePercent: parseFloat(process.env.PVP_LEVEL_RANGE || '0.25'),
    protectionHours: parseInt(process.env.PVP_PROTECTION_HOURS || '1'),
    maxResourceLossPercent: parseFloat(process.env.PVP_MAX_LOSS || '0.05'),
    attacksPerMinute: parseInt(process.env.PVP_RATE_LIMIT || '2')
};
```

## Why This Approach Is Better

1. **Simplicity**: One week to ship working PvP with separate resource pool
2. **Reusability**: 85% existing code, 15% new (mostly PvP mana)
3. **Testability**: TDD ensures quality from day 1
4. **Adjustability**: Config-driven for easy balancing
5. **Player-friendly**: 5% loss cap prevents rage-quits, separate mana prevents PvE/PvP conflict
6. **Incremental**: Foundation for future features

## Next PRs Preview

**PR #2**: Social Features (Week 2)
- Buddy lists
- Attack notifications
- Player search

**PR #3**: Daily Activities (Week 3)
- Daily voting
- Mana tree
- Login bonuses

**PR #4**: Advanced PvP (Week 4)
- Revenge system
- Leaderboards
- PvP events

## Conclusion

This minimal PvP implementation delivers core multiplayer interaction without overwhelming complexity. By adding a simple PvP mana system (just 20-30 lines of code), we prevent resource conflicts between PvE and PvP gameplay while maintaining simplicity. The system reuses existing combat mechanics and follows TDD principles to ship a stable, balanced PvP system in one week.

The key insight: **Start simple, monitor closely, iterate based on data.** The separate PvP mana pool is the one "complex" addition that prevents countless future headaches.