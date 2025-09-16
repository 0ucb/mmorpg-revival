# Next PR: Authentic MarcoLand City Structure (Architecture Fix)

## Overview

This PR addresses the identified architecture mismatch by implementing the authentic MarcoLand city structure with separate NPC shops. **Corrected scope - no metals store exists in original.**

## Goals

1. **Fix Architecture**: Split unified `/api/equipment/shop` into separate Blacksmith/Armourer endpoints  
2. **Authentic Navigation**: Match original city structure (no extra shops that don't exist)
3. **Add Town Gems Store**: Daily gems purchasing with 30-gem limits
4. **Future-Proof Design**: Build systems that will integrate with future player market

## Non-Goals (Future PRs)

- **Player Market Implementation**: Dedicated PR for complete player trading system
- **Metals Store**: Doesn't exist - metals come from combat/digging/player market
- **Trading Arbitrage**: Requires player market implementation

## Priority Justification

- **High Impact**: Fixes fundamental architecture mismatch affecting all future development
- **Core Gameplay**: Enables the essential daily trading routines that were central to MarcoLand success
- **User Experience**: Provides authentic game feel matching original experience
- **Future Foundation**: Required infrastructure for PvP optimization, creature systems, and advanced strategies

## Database Schema Changes

### 1. Daily Purchase Limits Table
```sql
CREATE TABLE player_daily_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    purchase_type VARCHAR(20) NOT NULL, -- 'gems', 'metals', 'mana', 'mp'
    purchase_date DATE DEFAULT CURRENT_DATE,
    quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(player_id, purchase_type, purchase_date)
);

CREATE INDEX idx_player_daily_purchases ON player_daily_purchases(player_id, purchase_type, purchase_date);
```

### 2. Player Inventory for Gems
```sql
-- Extend existing player table to track gems
ALTER TABLE players 
ADD COLUMN gems INTEGER DEFAULT 0 CHECK (gems >= 0);

-- Update existing players to have 0 gems  
UPDATE players SET gems = 0 WHERE gems IS NULL;

-- Note: Metals are already tracked via combat rewards system
```

### 3. Purchase Functions (Future-Proof)
```sql
-- Purchase gems from NPC store
CREATE OR REPLACE FUNCTION purchase_gems(
    p_player_id UUID,
    p_quantity INTEGER
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT process_daily_purchase(
        p_player_id, 
        'gems', 
        p_quantity, 
        90, -- fixed price per gem
        30  -- daily limit
    ) INTO result;
    
    -- Add gems to player inventory if purchase successful
    IF (result->>'success')::boolean THEN
        UPDATE players 
        SET gems = gems + p_quantity 
        WHERE id = p_player_id;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Note: No metals purchase function needed - metals come from:
-- 1. Combat rewards (already implemented)
-- 2. Rich sands digging (future implementation)  
-- 3. Player market (future implementation)
```

## API Architecture Refactoring

### 1. Remove Unified Equipment Shop
**Files to Modify:**
- `server/routes/equipment.js` - Remove GET `/shop` endpoint
- `client/src/api/equipment.js` - Remove shop API calls
- All tests referencing unified shop

### 2. New NPC Shop Endpoints

#### A. Blacksmith (Weapons Only)
```javascript
// server/routes/blacksmith.js
router.get('/', requireAuth, async (req, res) => {
    // List all weapons with player affordability/requirements
    // Format: weapons only, sorted by cost
});

router.post('/purchase', requireAuth, async (req, res) => {
    // Buy weapon using existing purchase_equipment function
    // Validate weapon_id only (no armor)
});
```

#### B. Armourer (Armor Only)  
```javascript
// server/routes/armourer.js
router.get('/', requireAuth, async (req, res) => {
    // List all armor with player affordability/requirements
    // Format: armor only, grouped by slot, sorted by cost
});

router.post('/purchase', requireAuth, async (req, res) => {
    // Buy armor using existing purchase_equipment function
    // Validate armor_id only (no weapons)
});
```

#### C. Gems Store (Daily Limit)
```javascript
// server/routes/gems-store.js
router.get('/', requireAuth, async (req, res) => {
    // Show daily gem purchase status
    // Return: gems_purchased_today, gems_remaining (max 30)
});

router.post('/purchase', requireAuth, async (req, res) => {
    // Buy gems at fixed 90g each
    // Enforce daily limit (30 max)
    // Use daily_purchases table
});
```

#### D. Market (Placeholder for Future)
```javascript
// server/routes/market.js
router.get('/', requireAuth, async (req, res) => {
    // Placeholder: Future player marketplace implementation
    // For now, return empty listings with infrastructure ready
});

// Note: Full player trading system will be separate PR
```

### 3. Resource Management Endpoints
```javascript
// server/routes/resources.js
router.get('/vote', requireAuth, async (req, res) => {
    // Check if voted today
    // Return voting status and potential rewards
});

router.post('/vote', requireAuth, async (req, res) => {
    // Daily vote: 500-1000g + rare mana reload chance
    // One vote per day limit
});

router.get('/mana-tree', requireAuth, async (req, res) => {
    // Show mana purchase status
    // Return: mana_purchased_today, gems_available
});

router.post('/mana-tree/purchase', requireAuth, async (req, res) => {
    // Buy 1 max mana for 100 gems
    // Daily limit: 1 purchase
    // Increase max_mana permanently
});
```


## Frontend Refactoring

### 1. Update City Navigation Structure
**File: `client/src/components/screens/CityScreen.jsx`**

```jsx
// Replace current placeholder links with proper routing
<div className="city-sections">
  <div className="city-column">
    <h3>In the streets</h3>
    <div className="city-links">
      <Link to="/blacksmith" className="city-link">Blacksmith</Link>
      <Link to="/armourer" className="city-link">Armourer</Link>
      <a href="#" className="city-link disabled">Gambler</a>
      <Link to="/gems-store" className="city-link">Town gems store</Link>
      <a href="#" className="city-link disabled">Food shop</a>
      <Link to="/market" className="city-link">Market</Link>
      <a href="#" className="city-link disabled">Alchemy Shop</a>
      <a href="#" className="city-link disabled">Spell Shop</a>
    </div>
    
    <h3>Fun Zone</h3>
    <div className="city-links">
    </div>
    
    <h3>In the woods</h3>
    <div className="city-links">
      <Link to="/mana-tree" className="city-link">Tall tree of Mana</Link>
      <a href="#" className="city-link disabled">Monk's Alley</a>
      <a href="#" className="city-link disabled">Reviving fruits</a>
      <a href="#" className="city-link disabled">Enchantress</a>
    </div>
  </div>
  
  <div className="city-column">
    <h3>On the town hill</h3>
    <div className="city-links">
      <a href="#" className="city-link disabled">Council building</a>
      <Link to="/temple" className="city-link">Temple of Tiipsi</Link>
      <a href="#" className="city-link disabled">Other Towns</a>
      <a href="#" className="city-link disabled">Jail</a>
      <a href="#" className="city-link disabled">Message board</a>
    </div>
    
    <h3>The underground</h3>
    <div className="city-links">
      <a href="#" className="city-link disabled">Dungeon</a>
      <a href="#" className="city-link disabled">Rich sands</a>
      <a href="#" className="city-link disabled">Daily Arena</a>
      <a href="#" className="city-link disabled">Creatures black market</a>
    </div>
  </div>
</div>
```

### 2. New Shop Components

#### A. Blacksmith Interface
**File: `client/src/components/screens/BlacksmithScreen.jsx`**
- Display weapons only in cost order
- Show affordability and strength requirements
- Purchase confirmation with remaining gold display
- Simple header: "Blacksmith" (descriptions are in your guide, not the UI)

#### B. Armourer Interface  
**File: `client/src/components/screens/ArmourerScreen.jsx`**
- Display armor grouped by slot (head, body, legs, hands, feet)
- Show protection values and encumbrance
- Visual equipment slot indicators
- Simple header: "Armourer" (descriptions are in your guide, not the UI)

#### C. Gems Store Interface
**File: `client/src/components/screens/GemsStoreScreen.jsx`**
```jsx
// Key features:
// - Show gems purchased today / remaining (0-30)
// - Fixed price display: 90 gold each
// - Batch purchase options (1, 5, 10, remaining)
// - Simple header: "Town gems store"
// - Daily reset countdown timer
```

#### D. Market Interface (Placeholder)
**File: `client/src/components/screens/MarketScreen.jsx`**
```jsx
// Placeholder for future player marketplace:
// - Show "Market coming soon" message
// - Explain that this is where players will trade gems, metals, weapons, armor
// - Simple header: "Market"
// - Infrastructure ready for full implementation in future PR
```

### 3. Resource Management UI Components

#### Daily Status Dashboard
```jsx
// Component: DailyResourceStatus
// Show daily routine progress:
// ✅ Voted (500g earned)
// ⏳ Buy gems (27/30 remaining today)
// ❌ Buy mana (need 73 more gems)
// Current gems: 27, Current metals: 15 (from combat)
```

## Database Functions Required

### 1. Daily Purchase Tracking
```sql
CREATE OR REPLACE FUNCTION check_daily_limit(
    p_player_id UUID,
    p_purchase_type VARCHAR(20),
    p_quantity INTEGER,
    p_daily_limit INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    current_purchases INTEGER;
BEGIN
    SELECT COALESCE(quantity, 0) INTO current_purchases
    FROM player_daily_purchases
    WHERE player_id = p_player_id 
      AND purchase_type = p_purchase_type
      AND purchase_date = CURRENT_DATE;
    
    RETURN (current_purchases + p_quantity) <= p_daily_limit;
END;
$$ LANGUAGE plpgsql;
```

### 2. Process Daily Purchase
```sql
CREATE OR REPLACE FUNCTION process_daily_purchase(
    p_player_id UUID,
    p_purchase_type VARCHAR(20),
    p_quantity INTEGER,
    p_cost_per_unit INTEGER,
    p_daily_limit INTEGER
) RETURNS JSON AS $$
DECLARE
    total_cost INTEGER;
    player_gold INTEGER;
    current_purchases INTEGER;
    result JSON;
BEGIN
    -- Calculate total cost
    total_cost := p_quantity * p_cost_per_unit;
    
    -- Check daily limit
    IF NOT check_daily_limit(p_player_id, p_purchase_type, p_quantity, p_daily_limit) THEN
        RETURN json_build_object('success', false, 'error', 'Daily purchase limit exceeded');
    END IF;
    
    -- Check player gold
    SELECT gold INTO player_gold FROM players WHERE id = p_player_id;
    IF player_gold < total_cost THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient gold');
    END IF;
    
    -- Process purchase
    UPDATE players SET gold = gold - total_cost WHERE id = p_player_id;
    
    -- Update daily tracking
    INSERT INTO player_daily_purchases (player_id, purchase_type, quantity)
    VALUES (p_player_id, p_purchase_type, p_quantity)
    ON CONFLICT (player_id, purchase_type, purchase_date)
    DO UPDATE SET quantity = player_daily_purchases.quantity + p_quantity;
    
    RETURN json_build_object(
        'success', true, 
        'remaining_gold', player_gold - total_cost,
        'items_purchased', p_quantity,
        'total_cost', total_cost
    );
END;
$$ LANGUAGE plpgsql;
```

## Testing Strategy

### 1. API Endpoint Tests
```javascript
// test/npc-shops.test.js
describe('NPC Shop Endpoints', () => {
  describe('Blacksmith', () => {
    test('should list weapons only');
    test('should allow weapon purchase with valid gold/strength');
    test('should reject armor purchases');
  });
  
  describe('Armourer', () => {
    test('should list armor only');
    test('should allow armor purchase with valid gold/strength');
    test('should reject weapon purchases');
  });
  
  describe('Town Gems Store', () => {
    test('should enforce 30 daily limit');
    test('should charge 90g per gem');
    test('should reset limit at midnight');
    test('should track daily purchases correctly');
    test('should add gems to player inventory');
  });
});

// test/daily-resources.test.js  
describe('Daily Resource Management', () => {
  test('should complete gems purchase cycle');
  test('should track daily limits across sessions');
  test('should integrate with voting system');
  test('should calculate mana purchase requirements (100 gems)');
});
```

### 2. Integration Tests
```javascript
// test/authentic-city-flow.test.js
describe('Authentic City Navigation', () => {
  test('should navigate to separate shops from city');
  test('should maintain shop-specific inventory displays');
  test('should preserve player state across shop visits');
  test('should match original MarcoLand messaging');
});
```

## Implementation Timeline

### Week 1: Core Architecture (Backend)
- **Day 1-2**: Database schema changes (gems inventory, daily limits)
- **Day 3-4**: Refactor equipment routes into Blacksmith/Armourer
- **Day 5**: Town gems store implementation with daily limits
- **Weekend**: Resource management endpoints (voting, mana tree)

### Week 2: Frontend Implementation  
- **Day 1-2**: Update city navigation with authentic structure
- **Day 3-4**: Build separate shop interfaces (Blacksmith, Armourer, Gems Store)
- **Day 5**: Market placeholder and resource management UI
- **Weekend**: Daily status dashboard and UI polish

### Week 3: Testing & Polish
- **Day 1-2**: Comprehensive testing of refactored shop system
- **Day 3-4**: Integration testing and gems purchase flow validation
- **Day 5**: Performance testing and optimization
- **Weekend**: Documentation and final polish

## Risk Mitigation

### 1. Breaking Changes
- **Risk**: Existing equipment system disruption
- **Mitigation**: Maintain backward compatibility during transition, comprehensive testing

### 2. Daily Limits System
- **Risk**: Timezone issues, limit bypass attempts for gems purchases
- **Mitigation**: Server-side date validation, atomic transactions, thorough limit checking

### 3. Scope Creep
- **Risk**: Attempting to implement full player market in this PR
- **Mitigation**: Clear boundaries - only NPC shops and market placeholder in this PR

## Success Metrics

### 1. Architecture Correctness
- ✅ Separate NPC shops functional (Blacksmith, Armourer, Town gems store)
- ✅ Daily limits enforced correctly for gems (30/day)
- ✅ Market placeholder ready for future implementation
- ✅ Authentic city navigation matches original structure

### 2. Resource Management Functionality  
- ✅ Gems purchase cycle functional with daily limits
- ✅ Daily voting system operational
- ✅ Mana purchasing with gems (100 gems → 1 max mana)
- ✅ Gems inventory tracking working

### 3. User Experience
- ✅ City feels authentic to original MarcoLand
- ✅ Simple, clean shop interfaces
- ✅ Daily resource management possible
- ✅ No regression in existing functionality

## Future Foundation

This PR establishes the infrastructure needed for subsequent systems:

- **Player Market**: Complete trading system (gems, metals, equipment) 
- **Skills System**: Gems finding skill integration with daily gem purchases
- **Advanced Resources**: Voting rewards, mana tree optimization
- **Town Systems**: Equipment sharing via separate shop interfaces
- **Daily Routines**: Foundation for optimal resource management strategies

## Files to Create/Modify

### New Files
- `server/routes/blacksmith.js`
- `server/routes/armourer.js` 
- `server/routes/gems-store.js`
- `server/routes/market.js` (placeholder)
- `server/routes/resources.js`
- `client/src/components/screens/BlacksmithScreen.jsx`
- `client/src/components/screens/ArmourerScreen.jsx`
- `client/src/components/screens/GemsStoreScreen.jsx`
- `client/src/components/screens/MarketScreen.jsx` (placeholder)
- `client/src/components/screens/VoteScreen.jsx`
- `client/src/components/screens/ManaTreeScreen.jsx`
- `client/src/components/common/DailyResourceStatus.jsx`
- `database/migrations/add-gems-inventory.sql`
- `database/migrations/add-daily-limits.sql`
- `test/npc-shops.test.js`
- `test/daily-resources.test.js`
- `test/authentic-city-flow.test.js`

### Modified Files
- `server/routes/equipment.js` (remove unified shop)
- `client/src/components/screens/CityScreen.jsx` (authentic navigation)
- `client/src/api/equipment.js` (remove shop calls)
- `server/index.js` (new route registration)
- `client/src/App.jsx` (new route definitions)

This focused approach fixes the architecture mismatch while building authentic, future-proof infrastructure. No throwaway code - everything implemented will be used long-term.