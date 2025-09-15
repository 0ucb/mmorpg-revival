# Next PR Plan: Temple of Tiipsi Prayer System

## Overview
With the beach combat system complete, players can now fight monsters and gain XP/gold. The next logical step is implementing the **Temple of Tiipsi prayer system** to allow players to convert mana into stat points for character progression.

## Why This PR Makes Sense
1. **Completes Core Loop**: Fight monsters → gain XP/gold → pray for stats → fight stronger monsters
2. **Self-Contained System**: Temple prayer is independent and can be fully implemented in one PR
3. **Essential Progression**: Players need stat training to progress beyond basic monsters
4. **Foundation for Equipment**: Higher stats enable better weapons/armor (next PR)

## Implementation Plan

### Phase 1: Temple API System

#### 1.1 Create Temple Route (`/server/routes/temple.js`)
- `POST /api/temple/pray` - Convert mana to stat points
- Parameters: `manaAmount` (5, 50, or "all")
- Validation: Ensure player has enough mana
- Authentication: Require valid player session

#### 1.2 Prayer Logic Implementation
**Stat Distribution Algorithm:**
```javascript
// Based on scraped data from formulas.json
function calculatePrayingGains(manaSpent, currentTotalStats) {
    const manaChunks = manaSpent / 50; // Process in 50-mana chunks
    const efficiency = getPrayingEfficiency(currentTotalStats);
    const totalGains = manaChunks * efficiency;
    
    // Randomly distribute among 3 stats: strength, speed, intelligence
    const statGains = {
        strength: 0,
        speed: 0, 
        intelligence: 0
    };
    
    for (let i = 0; i < totalGains; i++) {
        const randomStat = ['strength', 'speed', 'intelligence'][Math.floor(Math.random() * 3)];
        statGains[randomStat]++;
    }
    
    return statGains;
}
```

**Efficiency Caps (from scraped data):**
- Up to 1100 total stats: 3.5 avg gain per 50 mana
- 1100-1300: 2.5 avg gain per 50 mana
- 1300-1500: 1.5 avg gain per 50 mana
- Over 1500: 1.1 avg gain per 50 mana

#### 1.3 Database Updates
- Update `player_stats` table with new stat values
- Deduct mana from player
- Log prayer activity for analytics

### Phase 2: Enhanced Game Configuration

#### 2.1 Update `/server/config/game.js`
- Add `calculatePrayingGains()` function
- Add `getRandomStatDistribution()` function  
- Update praying efficiency constants to match scraped data

#### 2.2 Prayer Response Format
```javascript
{
    success: true,
    prayer_result: {
        mana_spent: 50,
        total_gains: 2.5,
        stat_gains: {
            strength: 1,
            speed: 0,
            intelligence: 1
        },
        efficiency: 3.5,
        remaining_mana: 45
    },
    updated_stats: {
        strength: 25,
        speed: 20, 
        intelligence: 15,
        total_stats: 60
    }
}
```

### Phase 3: Basic Temple UI

#### 3.1 Temple Interface Page
- Simple HTML interface at `/public/temple.html`
- Prayer buttons: "Pray 5 Mana", "Pray 50 Mana", "Pray All Mana"
- Display current stats and total
- Show praying efficiency based on current stats
- Display mana cost and expected gains

#### 3.2 Prayer Results Display
- Show stat gains with animations
- Display efficiency information
- Update player stats in real-time
- Show remaining mana

### Phase 4: Integration & Testing

#### 4.1 API Integration
- Add temple routes to main server
- Update API documentation
- Ensure authentication middleware works

#### 4.2 Testing
- Unit tests for prayer calculations
- API endpoint testing
- Efficiency cap validation
- Edge case handling (not enough mana, etc.)

## Technical Requirements

### Dependencies
- No new dependencies required
- Uses existing Supabase connection
- Leverages current authentication system

### Database Changes
- No schema changes required
- Uses existing `player_stats` table
- Uses existing `players` table for mana tracking

### File Structure
```
/server/routes/temple.js          - Temple API endpoints
/server/config/game.js            - Updated with prayer functions  
/public/temple.html               - Basic temple interface
/public/js/temple.js              - Temple UI logic
```

## Success Criteria
- [ ] Players can spend 5, 50, or all mana to gain stats
- [ ] Stat distribution is random among strength/speed/intelligence
- [ ] Efficiency decreases at 1100/1300/1500+ total stats thresholds
- [ ] Temple interface shows current stats and efficiency
- [ ] Prayer results display gains clearly
- [ ] All edge cases handled (insufficient mana, etc.)
- [ ] API endpoints properly documented and tested

## Timeline Estimate
- **Days 1-2**: Temple API implementation and testing
- **Days 3-4**: Prayer calculation logic and efficiency system
- **Days 5-6**: Basic temple UI and integration
- **Day 7**: Testing, documentation, and PR preparation

## After This PR
With temple prayers complete, the next logical PR would be implementing the equipment system (weapons/armor) so players can use their improved stats to equip better gear and fight stronger monsters.