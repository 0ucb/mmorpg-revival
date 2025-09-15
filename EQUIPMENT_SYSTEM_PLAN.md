# Equipment System Implementation Plan - Next PR

## Overview
Implement the complete MarcoLand equipment system, allowing players to purchase, equip, and use weapons/armor that significantly impact combat effectiveness. This builds directly on the completed Temple Prayer System.

## Key Implementation Decisions
- **TDD Approach**: Write comprehensive tests first, then implement
- **5 Equipment Slots**: Weapon, Head, Body, Legs, Hands, Feet
- **Core Mechanic**: Encumbrance vs Speed trade-offs for combat balance
- **46 Weapons + 55 Armor Pieces**: Complete authentic MarcoLand equipment catalog
- **Gold Economy**: Equipment costs from 100 to 10,000,000 gold
- **Combat Integration**: Weapon damage + Armor protection with speed modifiers

## Phase 1: Equipment Database & Core Systems (Days 1-2)

### 1.1 Equipment Database Schema
Create equipment seeder with authentic MarcoLand data:

**Database Tables:**
```sql
-- Equipment master table
equipment (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- 'weapon', 'armor'
  slot VARCHAR NOT NULL, -- 'weapon', 'head', 'body', 'legs', 'hands', 'feet'
  
  -- Weapon stats
  damage_min INTEGER,
  damage_max INTEGER,
  
  -- Armor stats  
  protection INTEGER DEFAULT 0,
  encumbrance INTEGER DEFAULT 0,
  
  -- Requirements
  strength_required INTEGER DEFAULT 0,
  cost_gold INTEGER NOT NULL,
  
  -- Meta
  created_at TIMESTAMP DEFAULT NOW()
);

-- Player equipment inventory
player_equipment (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players(id),
  equipment_id UUID REFERENCES equipment(id),
  equipped_slot VARCHAR, -- NULL if not equipped
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Equipment Seeder (`/database/seeders/equipment.js`)**:
```javascript
// Parse weapons from scraped data and seed 46 weapons
// Parse armor from scraped data and seed 55 armor pieces  
// Include all authentic stats: damage, protection, encumbrance, costs
```

### 1.2 Enhanced Game Config Functions
Add to `/server/config/game.js`:

```javascript
// Speed modifier calculation (critical for combat balance)
export function calculateSpeedModifier(speed, totalEncumbrance) {
    if (totalEncumbrance === 0) return 1.0;
    return Math.min(1.0, 0.5 + 0.5 * (speed / totalEncumbrance));
}

// Equipment validation
export function canEquipWeapon(playerStats, weapon) {
    return playerStats.strength >= weapon.strength_required;
}

export function canEquipArmor(playerStats, armor, currentTotalEncumbrance) {
    const newTotal = currentTotalEncumbrance + armor.encumbrance;
    return playerStats.strength >= newTotal && 
           playerStats.strength >= armor.strength_required;
}

// Total protection calculation
export function calculateTotalProtection(equippedArmor) {
    return equippedArmor.reduce((total, armor) => total + armor.protection, 0);
}

// Total encumbrance calculation  
export function calculateTotalEncumbrance(equippedArmor) {
    return equippedArmor.reduce((total, armor) => total + armor.encumbrance, 0);
}
```

## Phase 2: Inventory & Equipment APIs (Days 2-3)

### 2.1 Equipment API Routes
Create `/server/routes/equipment.js`:

```javascript
// GET /api/equipment - Browse all available equipment
router.get('/', requireAuth, async (req, res) => {
    // Query parameters: type (weapon/armor), slot, minCost, maxCost
    // Return paginated equipment list with player affordability
});

// POST /api/equipment/purchase - Buy equipment with gold
router.post('/purchase', requireAuth, async (req, res) => {
    // Validate player has enough gold
    // Validate equipment exists
    // Add to player inventory
    // Deduct gold from player
});

// GET /api/inventory - Get player's equipment inventory
router.get('/inventory', requireAuth, async (req, res) => {
    // Return equipped items + unequipped items
    // Include current stats: total protection, encumbrance
    // Show what can be equipped based on strength
});

// POST /api/inventory/equip - Equip item from inventory  
router.post('/equip', requireAuth, async (req, res) => {
    // Validate player owns item
    // Validate strength requirements
    // Validate encumbrance limits
    // Unequip existing item in slot if present
    // Equip new item
});

// POST /api/inventory/unequip - Unequip item to inventory
router.post('/unequip', requireAuth, async (req, res) => {
    // Validate item is equipped
    // Move to unequipped inventory
    // Recalculate player combat stats
});
```

### 2.2 Enhanced Combat Integration
Update `/server/routes/beach.js` combat system:

```javascript
// Enhanced combat calculations using real equipment
export function simulateEquippedCombat(player, playerStats, monster) {
    // Get player's equipped weapon and armor
    const weapon = getEquippedWeapon(player.id);
    const armor = getEquippedArmor(player.id);
    
    // Calculate combat stats
    const totalProtection = calculateTotalProtection(armor);
    const totalEncumbrance = calculateTotalEncumbrance(armor);
    const speedModifier = calculateSpeedModifier(playerStats.speed, totalEncumbrance);
    const weaponDamage = weapon ? weapon.damage_min + Math.floor(Math.random() * (weapon.damage_max - weapon.damage_min + 1)) : 0;
    
    // Apply to combat damage calculation
    const playerDamage = (playerStats.strength + weaponDamage) * speedModifier;
    // ... rest of combat simulation
}
```

## Phase 3: Player Equipment Management (Days 3-4)

### 3.1 Equipment Validation System
```javascript
// Comprehensive equipment validation
export function validateEquipmentChange(playerId, equipmentId, action) {
    // Get player stats
    // Get target equipment
    // Get currently equipped items
    // Calculate new totals
    // Validate all requirements
    // Return detailed validation result
}

// Equipment requirements checker
export function getEquipmentRequirements(equipment, currentEquipment) {
    return {
        strengthRequired: equipment.strength_required,
        strengthAvailable: playerStats.strength,
        canEquip: playerStats.strength >= equipment.strength_required,
        encumbranceAfter: calculateNewEncumbrance(equipment, currentEquipment),
        speedModifierAfter: calculateSpeedModifier(playerStats.speed, newEncumbrance)
    };
}
```

### 3.2 Equipment Shop System
```javascript
// Shop filtering and recommendations
export function getRecommendedEquipment(playerStats, playerGold) {
    // Filter by affordability
    // Filter by strength requirements
    // Sort by power/cost efficiency
    // Highlight upgrades vs current equipment
}

// Equipment comparison system
export function compareEquipment(currentItem, newItem, playerStats) {
    return {
        damageChange: newItem.damage_max - (currentItem?.damage_max || 0),
        protectionChange: newItem.protection - (currentItem?.protection || 0),
        encumbranceChange: newItem.encumbrance - (currentItem?.encumbrance || 0),
        speedModifierChange: calculateSpeedModifierChange(playerStats, currentItem, newItem),
        costDifference: newItem.cost_gold - (currentItem?.cost_gold || 0)
    };
}
```

## Phase 4: Combat System Enhancement (Days 4-5)

### 4.1 Enhanced Damage Calculations
Update combat to use authentic MarcoLand formulas:

```javascript
// PvE Combat (Player vs Monster)
export function calculatePlayerDamageWithEquipment(playerStats, weapon, armor) {
    const baseStrength = playerStats.strength;
    const weaponDamage = weapon ? getRandomWeaponDamage(weapon) : 0;
    const totalEncumbrance = calculateTotalEncumbrance(armor);
    const speedModifier = calculateSpeedModifier(playerStats.speed, totalEncumbrance);
    
    return (baseStrength + weaponDamage) * speedModifier;
}

// Monster damage vs player protection
export function calculateDamageAfterProtection(damage, playerArmor) {
    const totalProtection = calculateTotalProtection(playerArmor);
    return Math.max(1, damage - totalProtection); // Minimum 1 damage
}
```

### 4.2 Combat Balancing
```javascript
// Show equipment impact in combat logs
export function generateEquipmentCombatLog(player, weapon, totalProtection, speedModifier) {
    return [
        `You attack with your ${weapon?.name || 'bare hands'}`,
        `Your armor provides ${totalProtection} protection`,
        `Speed modifier from encumbrance: ${(speedModifier * 100).toFixed(0)}%`
    ];
}
```

## Phase 5: UI Integration & Polish (Days 5-6)

### 5.1 Equipment API Documentation
Add to server docs:
```javascript
equipment: {
    'GET /api/equipment': 'Browse available equipment with filters',
    'POST /api/equipment/purchase': 'Purchase equipment with gold',
    'GET /api/inventory': 'Get player equipment inventory and stats',
    'POST /api/inventory/equip': 'Equip item from inventory',
    'POST /api/inventory/unequip': 'Unequip item to inventory'
}
```

### 5.2 Equipment Testing Suite
Create `/server/tests/equipment.test.js`:

```javascript
describe('Equipment System', () => {
    describe('Core Mechanics', () => {
        test('speed modifier calculation matches MarcoLand formula');
        test('encumbrance limits prevent over-equipping');
        test('strength requirements enforced for all equipment');
    });
    
    describe('Equipment Database', () => {
        test('all 46 weapons loaded with correct stats');
        test('all 55 armor pieces loaded with correct stats');
        test('equipment costs match scraped data');
    });
    
    describe('Combat Integration', () => {
        test('weapon damage properly applied to combat');
        test('armor protection reduces incoming damage');  
        test('speed modifier affects damage output');
        test('minimum 1 damage rule enforced');
    });
    
    describe('API Endpoints', () => {
        test('equipment purchase requires sufficient gold');
        test('equipping validates strength requirements');
        test('encumbrance limits prevent invalid combinations');
        test('unequipping frees up encumbrance capacity');
    });
});
```

## Phase 6: Integration & Balance Testing (Days 6-7)

### 6.1 Complete Progression Testing
```javascript
// Test full equipment progression paths
describe('Equipment Progression', () => {
    test('early game equipment affordable with beach rewards');
    test('mid-game requires significant gold accumulation');
    test('high-end equipment requires temple stat progression');
    test('optimal encumbrance vs protection trade-offs');
});
```

### 6.2 Economy Balance Verification
- Verify equipment costs align with beach combat gold rewards
- Test equipment purchase progression feels meaningful
- Ensure temple stat gains unlock better equipment tiers
- Balance speed modifier penalties vs protection benefits

## Success Criteria

### Core Functionality
- [ ] All 46 weapons + 55 armor pieces loaded with authentic stats
- [ ] Equipment purchase system working with gold costs
- [ ] Equip/unequip system with validation (strength, encumbrance)
- [ ] Combat system uses real weapon damage and armor protection
- [ ] Speed modifier properly applies encumbrance penalties
- [ ] Equipment requirements prevent invalid combinations

### Combat Integration  
- [ ] Weapon damage significantly impacts combat effectiveness
- [ ] Armor protection reduces incoming damage meaningfully
- [ ] Encumbrance vs speed trade-off creates strategic decisions
- [ ] Combat logs show equipment impact clearly
- [ ] Stronger equipment enables fighting tougher monsters

### Economy Integration
- [ ] Equipment costs balanced with beach combat gold rewards
- [ ] Temple stat progression unlocks better equipment tiers
- [ ] Players feel motivated to earn gold for equipment upgrades
- [ ] Equipment provides clear power progression path

### API Robustness
- [ ] All equipment endpoints properly authenticated
- [ ] Comprehensive validation prevents invalid equipment states
- [ ] Transaction safety prevents gold/inventory corruption
- [ ] Error handling provides helpful feedback
- [ ] Performance acceptable with full equipment database

## Timeline: 7 Days Total

- **Days 1-2**: Equipment database, seeding, core game logic functions
- **Days 2-3**: Inventory and equipment API endpoints
- **Days 3-4**: Equipment validation and shop system
- **Days 4-5**: Combat integration with authentic formulas
- **Days 5-6**: Testing suite and API documentation  
- **Days 6-7**: Integration testing and balance verification

## Risk Mitigation

### Technical Risks
- **Database Performance**: Index equipment queries, implement pagination
- **Complex Validation**: Comprehensive test coverage for edge cases
- **Combat Balance**: Extensive testing with different equipment combinations

### Game Balance Risks
- **Progression Pacing**: Adjust equipment costs if progression too slow/fast
- **Equipment Variety**: Ensure all equipment tiers provide meaningful choices
- **Power Scaling**: Verify equipment doesn't make earlier content trivial

## Post-Implementation: Next Phase Candidates

With equipment complete, the next logical implementations would be:
1. **Forging System** - Equipment enhancement using metals  
2. **PvP Combat** - Intelligence modifiers and player battles
3. **Advanced Shop Features** - Equipment comparison, recommendations
4. **Equipment Sets** - Bonus effects for wearing complete sets
5. **Durability/Repair** - Equipment degradation mechanics

This equipment system will provide the foundation for all future combat-related features and create a compelling progression path from basic beach combat through high-end equipment acquisition.