# Phase 7: Daily Systems & Spells Framework

## Executive Summary
Implement daily engagement mechanics integrated into existing UI patterns. Daily voting in right panel, Mana Tree and Spell Shop as new City locations, and Spells management in sidebar.

**Target Duration**: 4-5 days  
**Priority**: Daily retention + spell system foundation  
**Risk Level**: Low (follows existing patterns)

## Core Features

### 1. Daily Voting System (Right Panel)

#### Implementation
```javascript
// In RightSidebar.jsx - add to existing component
const [hasVotedToday, setHasVotedToday] = useState(false);
const [voteStreak, setVoteStreak] = useState(0);

// Display in right panel
{!hasVotedToday ? (
  <button onClick={handleDailyVote} className="vote-button">
    [Vote for rewards]
  </button>
) : (
  <span className="vote-completed">✓ Voted today (Streak: {voteStreak})</span>
)}
```

#### Database Schema
```sql
CREATE TABLE daily_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) NOT NULL,
    vote_date DATE NOT NULL DEFAULT CURRENT_DATE,
    gold_reward INTEGER NOT NULL,
    streak_bonus INTEGER DEFAULT 0,
    vote_streak INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(player_id, vote_date)
);

CREATE INDEX idx_daily_votes_lookup ON daily_votes(player_id, vote_date DESC);
```

#### API Endpoints
```javascript
POST /api/daily/vote         // Cast vote, return rewards
GET  /api/daily/vote/status  // Check if voted + current streak
```

#### Mechanics
- **Base Reward**: 500-1000 gold (random)
- **Streak Bonus**: +50 gold per day (max 1500 at 30 days)
- **Simple Display**: Just a button that changes to checkmark after voting
- **Auto-refresh**: Updates sidebar stats immediately after vote

### 2. Mana Tree (New City Location)

#### City Screen Addition
```javascript
// In CityScreen.jsx under "Resources" section
<Link to="/mana-tree" className="city-link">Mana Tree</Link>
```

#### ManaTreeScreen.jsx
```javascript
// New screen following Temple/Beach pattern
function ManaTreeScreen() {
  // Display current mana with tree bonuses
  // Regular Mana: 15/20 (+5 from tree)

  
  // Purchase options
  [Increase Regular Mana] (Cost: 100 gems)

  
  // Show daily purchase status
  ✓ Regular mana purchased today

  
  // Display total purchases
  Total Tree Growth: 7 regular, 2 PvP
}
```

#### Database Schema
```sql
CREATE TABLE mana_tree_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    purchase_type VARCHAR(20) NOT NULL, -- 'regular' or 'pvp'
    gems_spent INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(player_id, purchase_date, purchase_type)
);

ALTER TABLE players ADD COLUMN IF NOT EXISTS
    mana_tree_regular INTEGER DEFAULT 0,
    mana_tree_pvp INTEGER DEFAULT 0;
```

#### API Endpoints
```javascript
GET  /api/mana-tree/status           // Current bonuses & today's purchases
POST /api/mana-tree/purchase/:type   // Buy regular or pvp mana
```

### 3. Spell Shop (New City Location)

#### City Screen Addition
```javascript
// In CityScreen.jsx under "Shops" section
<Link to="/spell-shop" className="city-link">Spell Shop</Link>
```

#### SpellShopScreen.jsx
```javascript
function SpellShopScreen() {
  // List available spells for purchase
  
  Available Spells:
  
  1. Gems Finding
     Cost: 20,000 gold
     Daily skill that can discover 5-30 gems
     Success rate improves with consecutive use
     [Purchase]
  
  2. [Future: Master Forging - Coming Soon]
  3. [Future: Enhanced Recovery - Coming Soon]
  
  // Show owned spells
  Owned Spells:
  ✓ Gems Finding (purchased 3 days ago)
}
```

#### Database Schema
```sql
CREATE TABLE player_spells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) NOT NULL,
    spell_type VARCHAR(50) NOT NULL, -- 'gems_finding', etc
    purchased_at TIMESTAMP DEFAULT NOW(),
    last_used DATE,
    consecutive_days INTEGER DEFAULT 0,
    total_uses INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 10.00,
    UNIQUE(player_id, spell_type)
);

CREATE TABLE spell_definitions (
    spell_type VARCHAR(50) PRIMARY KEY,
    spell_name VARCHAR(100) NOT NULL,
    description TEXT,
    cost_gold INTEGER,
    cost_gems INTEGER,
    mana_cost INTEGER,
    is_available BOOLEAN DEFAULT TRUE
);

-- Seed with initial spell
INSERT INTO spell_definitions VALUES 
('gems_finding', 'Gems Finding', 'Daily chance to discover gems', 20000, 0, 5, true);
```

#### API Endpoints
```javascript
GET  /api/spells/shop           // List available spells
POST /api/spells/purchase/:type // Buy a spell
GET  /api/spells/owned          // List owned spells
```

### 4. Spells Page (Sidebar Link)

#### Sidebar Addition
```javascript
// In Sidebar.jsx - add new navigation item
<Link to="/spells" className="sidebar-link">Spells</Link>
```

#### SpellsScreen.jsx
```javascript
function SpellsScreen() {
  // Show owned spells with daily use buttons
  
  Your Spells:
  
  1. Gems Finding
     Success Rate: 24% (12 day streak)
     Last Used: Today ✓
     Total Gems Found: 147
     [Already used today]
  
  // If no spells owned
  You don't own any spells yet.
  Visit the [Spell Shop] in the city to purchase spells.
}
```

#### Spell Usage Mechanics
```sql
CREATE TABLE spell_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) NOT NULL,
    spell_type VARCHAR(50) NOT NULL,
    used_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mana_cost INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    reward_amount INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(player_id, spell_type, used_date)
);
```

#### API Endpoints
```javascript
POST /api/spells/use/:type  // Use a daily spell
GET  /api/spells/status      // Get all owned spells status
```

### 5. Gems Finding Spell Mechanics

#### Success Rate Progression
- Base: 10% chance
- +2% per consecutive day used (max 90%)
- -5% for missing a day (min 10%)
- Resets to 10% after 3 missed days

#### Rewards
- Success: 5-30 gems (scales with streak)
  - Days 1-10: 5-15 gems
  - Days 11-30: 10-25 gems  
  - Days 31+: 15-30 gems
- Failure: No gems, mana still consumed

#### Daily Usage
- Costs 5 mana
- Once per day per spell
- Must have spell in inventory
- Instant result (no waiting)

## Implementation Order

### Day 1: Database & Core
- [ ] All database migrations
- [ ] Daily reset logic
- [ ] Vote system backend

### Day 2: Daily Voting
- [ ] RightSidebar integration
- [ ] Vote API endpoints
- [ ] Streak calculations
- [ ] Auto-refresh stats

### Day 3: Mana Tree
- [ ] ManaTreeScreen component
- [ ] Purchase validation
- [ ] Mana bonus calculations
- [ ] City navigation link

### Day 4: Spell Shop & System
- [ ] SpellShopScreen component
- [ ] Spell purchase logic
- [ ] SpellsScreen for owned spells
- [ ] Spell definitions table

### Day 5: Testing & Polish
- [ ] Gems Finding mechanics
- [ ] Daily usage tracking
- [ ] Success rate progression
- [ ] Integration testing

## Key Design Principles

1. **Follow Existing Patterns**
   - Simple green text links
   - Black background
   - Minimal UI elements
   - No modern buttons/cards

2. **Integration Points**
   - Daily vote in existing right panel
   - New screens accessible from City
   - Spells in sidebar like other features
   - Immediate stat updates after actions

3. **User Flow**
   - Vote → Get gold → Buy spells → Use spells → Get gems → Buy mana
   - Clear progression loop
   - Daily engagement touchpoints

## Success Criteria

- [ ] Daily vote button works in right panel
- [ ] Mana Tree accessible from City and functional
- [ ] Spell Shop allows purchasing Gems Finding
- [ ] Spells page shows owned spells with usage
- [ ] Daily resets work properly at UTC midnight
- [ ] All mechanics follow scraped MarcoLand rules

## Why This Approach Works

1. **Minimal UI Changes** - Uses existing panels and patterns
2. **Clear Navigation** - Everything accessible from established locations
3. **Immediate Value** - Daily vote works from day 1
4. **Expandable** - Easy to add more spells later
5. **Authentic** - Follows MarcoLand's original daily systems