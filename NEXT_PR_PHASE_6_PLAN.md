# Next PR: Phase 6 - PvP Combat & Daily Engagement Systems

## Executive Summary
With the market system complete and production-ready, Phase 6 will transform MarcoLand from a single-player experience into a true multiplayer game. This PR focuses on PvP combat, daily activities, and social features that create engaging gameplay loops and player retention mechanics.

**Target Duration**: 2-3 weeks  
**Priority**: Transform to multiplayer gameplay  
**Risk Level**: Medium (new game systems, but building on solid foundation)

## Current State Analysis

### What We Have (Phase 5 Complete)
- ✅ **Combat Foundation**: Beach PvE with 30 monsters, damage formulas, stat calculations
- ✅ **Economic Foundation**: Market system, NPC shops, gold/gems/metals economy
- ✅ **Character Progression**: Stats, equipment, temple prayers, mana regeneration
- ✅ **Technical Foundation**: Auth, API, React frontend, Supabase backend

### What Players Need Next
1. **Multiplayer Interaction** - Currently a lonely single-player experience
2. **Daily Goals** - Reasons to log in every day
3. **Progression Targets** - Something to work toward beyond basic stats
4. **Social Features** - Ways to interact with other players

## Phase 6A: Core Multiplayer Systems (This PR)

### 1. PvP Combat System

#### Database Schema
```sql
-- PvP-specific player stats
ALTER TABLE players ADD COLUMN IF NOT EXISTS 
    pvp_mana INTEGER DEFAULT 5,
    pvp_max_mana INTEGER DEFAULT 5,
    pvp_kills INTEGER DEFAULT 0,
    pvp_deaths INTEGER DEFAULT 0,
    pvp_win_streak INTEGER DEFAULT 0,
    pvp_last_death TIMESTAMP,
    pvp_protection_until TIMESTAMP;

-- PvP combat logs
CREATE TABLE pvp_battles (
    id SERIAL PRIMARY KEY,
    attacker_id UUID REFERENCES players(id),
    defender_id UUID REFERENCES players(id),
    attacker_damage INTEGER,
    defender_health_before INTEGER,
    defender_health_after INTEGER,
    intelligence_modifier DECIMAL(3,2),
    resources_stolen JSON, -- {gold: 100, gems: 5, metals: 2}
    battle_time TIMESTAMP DEFAULT NOW(),
    is_kill BOOLEAN DEFAULT FALSE
);

-- PvP target tracking (blacklist/revenge)
CREATE TABLE pvp_relationships (
    id SERIAL PRIMARY KEY,
    player_id UUID REFERENCES players(id),
    target_id UUID REFERENCES players(id),
    relationship_type VARCHAR(20), -- 'blacklist', 'buddy', 'revenge'
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(player_id, target_id, relationship_type)
);
```

#### API Endpoints
```javascript
// PvP Combat Routes
GET  /api/pvp/targets        // Find valid PvP targets (level range ±60%)
POST /api/pvp/attack/:id     // Attack a player (costs PvP mana)
GET  /api/pvp/history        // View attack history
GET  /api/pvp/stats          // Leaderboard and personal stats

// Social Routes  
GET  /api/social/buddies     // Buddy list with online status
POST /api/social/buddy/:id   // Add buddy
GET  /api/social/blacklist   // Blacklist for targeting
POST /api/social/blacklist/:id // Add to blacklist
DELETE /api/social/blacklist/:id // Remove from blacklist
```

#### Key Mechanics (from scraped data)
- **Level Range**: Can only attack players within ±60% of your level
- **Intelligence Modifier**: Damage × (Your INT / Defender INT) ^ 0.5
  - Min 0.75x, Max 1.50x damage modifier
- **PvP Mana**: Separate from regular mana, 5-50 capacity
- **Death Penalty**: Lose 0.2 PvP mana, 20% of resources
- **Protection**: 5-minute shield after being killed
- **Resource Theft**: 20% of defender's gold/gems/metals on kill

### 2. Daily Activity System

#### Database Schema
```sql
-- Daily voting tracking
CREATE TABLE daily_votes (
    id SERIAL PRIMARY KEY,
    player_id UUID REFERENCES players(id),
    vote_date DATE DEFAULT CURRENT_DATE,
    gold_reward INTEGER,
    bonus_reward VARCHAR(50), -- 'mana_refill', 'extra_gold', null
    vote_streak INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(player_id, vote_date)
);

-- Mana Tree purchases
CREATE TABLE mana_tree_purchases (
    id SERIAL PRIMARY KEY,
    player_id UUID REFERENCES players(id),
    purchase_date DATE DEFAULT CURRENT_DATE,
    gems_spent INTEGER DEFAULT 100,
    mana_gained INTEGER DEFAULT 1,
    total_purchases INTEGER DEFAULT 0,
    UNIQUE(player_id, purchase_date)
);
```

#### API Endpoints
```javascript
// Daily Activities
POST /api/daily/vote         // Cast daily vote (once per day)
GET  /api/daily/vote/status  // Check if voted today
POST /api/daily/mana-tree    // Buy mana from tree (100 gems)
GET  /api/daily/status       // All daily activity statuses
```

#### Rewards Structure
- **Daily Vote**: 500-1000 gold base + streak bonuses
- **Vote Streaks**: +100 gold per day streak (max 30 days)
- **Rare Rewards**: 5% chance of full mana refill
- **Mana Tree**: 100 gems = +1 max mana (once daily)

### 3. Skills System - Gems Finding (Foundation)

#### Database Schema
```sql
-- Player skills
CREATE TABLE player_skills (
    id SERIAL PRIMARY KEY,
    player_id UUID REFERENCES players(id),
    skill_type VARCHAR(50), -- 'gems_finding', 'master_forging' (future)
    skill_level INTEGER DEFAULT 0,
    experience INTEGER DEFAULT 0,
    last_used DATE,
    consecutive_days INTEGER DEFAULT 0,
    total_days_used INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 10.00, -- percentage
    purchased_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(player_id, skill_type)
);

-- Skill usage logs
CREATE TABLE skill_usage (
    id SERIAL PRIMARY KEY,
    player_id UUID REFERENCES players(id),
    skill_type VARCHAR(50),
    mana_cost INTEGER,
    success BOOLEAN,
    reward JSON, -- {gems: 15, bonus: 'double_find'}
    used_at TIMESTAMP DEFAULT NOW()
);
```

#### API Endpoints
```javascript
// Skills System
GET  /api/skills             // List all available skills
POST /api/skills/purchase    // Buy a skill (20,000 gold for gems_finding)
POST /api/skills/use/:type   // Use daily skill (5 mana)
GET  /api/skills/stats       // Skill statistics and history
```

#### Gems Finding Mechanics
- **Purchase Cost**: 20,000 gold (one-time)
- **Daily Use**: Costs 5 mana, once per day
- **Base Success**: 10% chance to find gems
- **Progression**: +2% per consecutive day, -1% per missed day
- **Rewards**: 5-30 gems on success (scales with streak)
- **Max Success Rate**: 90% (after 40 consecutive days)

### 4. Enhanced Player Profiles

#### Database Updates
```sql
ALTER TABLE players ADD COLUMN IF NOT EXISTS
    profile_views INTEGER DEFAULT 0,
    profile_title VARCHAR(100),
    profile_message TEXT,
    last_seen TIMESTAMP DEFAULT NOW(),
    online_status BOOLEAN DEFAULT FALSE;
```

#### API Endpoints
```javascript
// Player Profiles
GET  /api/players/:id        // View player profile
POST /api/players/investigate // Investigate player (costs 2×level metals)
GET  /api/players/online     // List online players
GET  /api/players/rankings   // Various leaderboards
```

## Phase 6B: Supporting Systems (Next Sprint)

### Quick Wins (1 week)
1. **Market Equipment Trading** - Extend market to weapons/armor
2. **Market Analytics** - Price history, trends, profit tracking
3. **Chat System** - Global and private messaging
4. **Player Search** - Find players by name/level

### Medium Features (2 weeks)
1. **Basic Towns/Guilds** - Create, join, shared armory
2. **Advanced PvP** - Revenge system, hit lists, bounties
3. **Achievement System** - Badges and rewards for milestones

## Implementation Order

### Week 1: PvP Foundation
1. **Day 1-2**: Database migrations, PvP schema
2. **Day 3-4**: PvP combat calculations and API
3. **Day 5**: Target finding and level restrictions
4. **Day 6-7**: Testing and balance adjustments

### Week 2: Daily Systems
1. **Day 1-2**: Daily voting system
2. **Day 3**: Mana Tree implementation
3. **Day 4-5**: Gems Finding skill
4. **Day 6-7**: Skill progression and rewards

### Week 3: Social & Polish
1. **Day 1-2**: Buddy/Blacklist system
2. **Day 3-4**: Player profiles and investigation
3. **Day 5**: Leaderboards and rankings
4. **Day 6-7**: UI polish and integration testing

## Technical Considerations

### Performance
- **Caching**: Redis for online players, PvP targets
- **Indexes**: On level ranges, online status, battle logs
- **Rate Limiting**: PvP attacks (max 1 per 30 seconds)

### Security
- **PvP Validation**: Server-side damage calculations only
- **Resource Limits**: Cap stolen resources to prevent abuse
- **Anti-Farming**: Cooldowns on attacking same player

### UI/UX Updates
- **PvP Screen**: Target list, battle log, stats
- **Daily Hub**: Central location for all daily activities
- **Skills Tab**: Purchase, use, track progression
- **Social Panel**: Buddies, blacklist, online players

## Success Criteria

### Metrics
- [ ] Players can engage in PvP combat with proper calculations
- [ ] Daily activities create retention (players return daily)
- [ ] Skills system provides long-term progression goals
- [ ] Social features enable player interaction
- [ ] All systems integrate smoothly with existing game

### Testing Requirements
- [ ] 50+ PvP battles tested with various stat combinations
- [ ] Daily reset mechanics work correctly across timezones
- [ ] Skill progression saves and loads properly
- [ ] Concurrent PvP attacks handled correctly
- [ ] Resource theft calculations are accurate

## Risk Mitigation

### Potential Issues
1. **PvP Balance**: May need rapid adjustments post-launch
   - Solution: Make formulas configurable via environment variables

2. **Database Load**: PvP queries could be expensive
   - Solution: Implement caching layer early

3. **Exploit Prevention**: Players might find loopholes
   - Solution: Comprehensive logging, rate limiting, validation

4. **User Experience**: PvP might frustrate new players
   - Solution: Protection periods, level restrictions

## Future Expansion Paths

After Phase 6 completion:
1. **Phase 7**: Towns, Guilds, and Town Wars
2. **Phase 8**: Creature/Golem System
3. **Phase 9**: Master Forging and Advanced Crafting
4. **Phase 10**: Dungeons and Quest System

## Conclusion

Phase 6 transforms MarcoLand from a single-player grind into an engaging multiplayer experience. By focusing on PvP combat, daily activities, and social features, we create the core gameplay loops that will keep players engaged and returning daily. The systems are designed to complement each other - daily voting provides resources for skills, skills generate gems for the market, and PvP creates demand for better equipment.

This PR establishes the foundation for all future multiplayer features while maintaining the authentic MarcoLand experience documented in the scraped game data.