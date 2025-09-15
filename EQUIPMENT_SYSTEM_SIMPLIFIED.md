# Equipment System Implementation - Simplified Approach

## Overview
Implement MarcoLand's authentic equipment system with focus on core mechanics: purchase, equip, and combat integration. Prioritize simplicity and correctness over advanced features.

## Core Design Principles
- **Authentic to MarcoLand**: Use scraped data as source of truth
- **Simple First**: Ship working system, enhance later
- **TDD Approach**: Write tests first for critical paths
- **Clean Architecture**: Separate concerns, avoid premature optimization

## Database Schema

### Separate Weapon and Armor Tables
```sql
-- Weapons have unique properties
CREATE TABLE weapons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  damage_min INTEGER NOT NULL,
  damage_max INTEGER NOT NULL,
  strength_required INTEGER DEFAULT 0,
  cost_gold INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Armor organized by slot
CREATE TABLE armor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  slot VARCHAR NOT NULL CHECK (slot IN ('head', 'body', 'legs', 'hands', 'feet')),
  protection INTEGER NOT NULL DEFAULT 0,
  encumbrance INTEGER NOT NULL DEFAULT 0,
  strength_required INTEGER DEFAULT 0,
  cost_gold INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Single row per player, NULL means slot empty
CREATE TABLE player_equipped (
  player_id UUID PRIMARY KEY REFERENCES players(id),
  weapon_id UUID REFERENCES weapons(id),
  head_id UUID REFERENCES armor(id),
  body_id UUID REFERENCES armor(id),
  legs_id UUID REFERENCES armor(id),
  hands_id UUID REFERENCES armor(id),
  feet_id UUID REFERENCES armor(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Player's unequipped items (inventory)
CREATE TABLE player_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  weapon_id UUID REFERENCES weapons(id),
  armor_id UUID REFERENCES armor(id),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT check_single_item CHECK (
    (weapon_id IS NOT NULL AND armor_id IS NULL) OR
    (weapon_id IS NULL AND armor_id IS NOT NULL)
  )
);

-- Cached combat stats for performance
CREATE TABLE player_combat_stats (
  player_id UUID PRIMARY KEY REFERENCES players(id),
  total_protection INTEGER DEFAULT 0,
  total_encumbrance INTEGER DEFAULT 0,
  speed_modifier DECIMAL(3,2) DEFAULT 1.00,
  weapon_damage_min INTEGER DEFAULT 0,
  weapon_damage_max INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Database Functions for Atomic Operations
```sql
-- Atomic equipment purchase with gold validation
CREATE OR REPLACE FUNCTION purchase_equipment(
  p_player_id UUID,
  p_weapon_id UUID DEFAULT NULL,
  p_armor_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_cost INTEGER;
  v_player_gold INTEGER;
BEGIN
  -- Get equipment cost
  IF p_weapon_id IS NOT NULL THEN
    SELECT cost_gold INTO v_cost FROM weapons WHERE id = p_weapon_id;
  ELSIF p_armor_id IS NOT NULL THEN
    SELECT cost_gold INTO v_cost FROM armor WHERE id = p_armor_id;
  ELSE
    RAISE EXCEPTION 'No equipment specified';
  END IF;
  
  -- Check player gold
  SELECT gold INTO v_player_gold FROM players WHERE id = p_player_id FOR UPDATE;
  
  IF v_player_gold < v_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient gold');
  END IF;
  
  -- Deduct gold and add to inventory
  UPDATE players SET gold = gold - v_cost WHERE id = p_player_id;
  INSERT INTO player_inventory (player_id, weapon_id, armor_id) 
  VALUES (p_player_id, p_weapon_id, p_armor_id);
  
  RETURN jsonb_build_object('success', true, 'remaining_gold', v_player_gold - v_cost);
END;
$$ LANGUAGE plpgsql;
```

## Phase 1: Data Loading & Core Functions (Day 1)

### 1.1 Equipment Seeder
`/database/seeders/equipment.js`:
```javascript
import { readFileSync } from 'fs';
import { join } from 'path';

export async function seedEquipment(supabase) {
  // Parse authentic MarcoLand data
  const weaponsData = JSON.parse(
    readFileSync(join(process.cwd(), 'scraped-data/wiki/extracted/weapons.json'))
  );
  const armorData = JSON.parse(
    readFileSync(join(process.cwd(), 'scraped-data/wiki/extracted/armor.json'))
  );
  
  // Insert weapons (46 total)
  const { error: weaponError } = await supabase
    .from('weapons')
    .upsert(weaponsData.map(w => ({
      name: w.name,
      damage_min: w.damage_min,
      damage_max: w.damage_max,
      strength_required: w.strength_required || 0,
      cost_gold: w.cost
    })));
    
  // Insert armor (55 total)
  const { error: armorError } = await supabase
    .from('armor')
    .upsert(armorData.map(a => ({
      name: a.name,
      slot: a.slot.toLowerCase(),
      protection: a.protection || 0,
      encumbrance: a.encumbrance || 0,
      strength_required: a.strength_required || 0,
      cost_gold: a.cost
    })));
}
```

### 1.2 Core Game Functions
`/server/config/equipment.js`:
```javascript
// Core calculation - this is THE critical formula
export function calculateSpeedModifier(speed, encumbrance) {
  if (encumbrance === 0) return 1.0;
  if (encumbrance >= speed) return 0.5; // Minimum 50% speed
  return 1.0 - (0.5 * (encumbrance / speed));
}

// Simple validation
export function canEquip(playerStrength, itemStrengthRequired, currentEncumbrance = 0, itemEncumbrance = 0) {
  const totalEncumbrance = currentEncumbrance + itemEncumbrance;
  return playerStrength >= itemStrengthRequired && playerStrength >= totalEncumbrance;
}
```

## Phase 2: Equipment API (Days 2-3)

### 2.1 Simple API Routes
`/server/routes/equipment.js`:
```javascript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
import { calculateSpeedModifier, canEquip } from '../config/equipment.js';

const router = Router();

// GET /api/equipment/shop - View available equipment
router.get('/shop', requireAuth, async (req, res) => {
  const { type = 'all' } = req.query;
  const playerId = req.user.id;
  
  // Get player's current gold and strength
  const { data: player } = await supabase
    .from('players')
    .select('gold, strength')
    .eq('id', playerId)
    .single();
  
  let equipment = [];
  
  if (type === 'all' || type === 'weapons') {
    const { data: weapons } = await supabase
      .from('weapons')
      .select('*')
      .order('cost_gold');
    equipment.push(...weapons.map(w => ({ ...w, type: 'weapon', affordable: player.gold >= w.cost_gold })));
  }
  
  if (type === 'all' || type === 'armor') {
    const { data: armor } = await supabase
      .from('armor')
      .select('*')
      .order('cost_gold');
    equipment.push(...armor.map(a => ({ ...a, type: 'armor', affordable: player.gold >= a.cost_gold })));
  }
  
  res.json({ equipment, player_gold: player.gold });
});

// POST /api/equipment/purchase - Buy equipment
router.post('/purchase', requireAuth, async (req, res) => {
  const { equipment_id, type } = req.body;
  const playerId = req.user.id;
  
  // Use database function for atomic purchase
  const { data, error } = await supabase.rpc('purchase_equipment', {
    p_player_id: playerId,
    p_weapon_id: type === 'weapon' ? equipment_id : null,
    p_armor_id: type === 'armor' ? equipment_id : null
  });
  
  if (error || !data.success) {
    return res.status(400).json({ error: data?.error || 'Purchase failed' });
  }
  
  res.json({ success: true, remaining_gold: data.remaining_gold });
});

// GET /api/equipment/inventory - View owned equipment
router.get('/inventory', requireAuth, async (req, res) => {
  const playerId = req.user.id;
  
  // Get equipped items
  const { data: equipped } = await supabase
    .from('player_equipped')
    .select(`
      weapon:weapons(*),
      head:armor!player_equipped_head_id_fkey(*),
      body:armor!player_equipped_body_id_fkey(*),
      legs:armor!player_equipped_legs_id_fkey(*),
      hands:armor!player_equipped_hands_id_fkey(*),
      feet:armor!player_equipped_feet_id_fkey(*)
    `)
    .eq('player_id', playerId)
    .single();
  
  // Get unequipped items
  const { data: inventory } = await supabase
    .from('player_inventory')
    .select('*, weapon:weapons(*), armor:armor(*)')
    .eq('player_id', playerId);
  
  // Get cached combat stats
  const { data: stats } = await supabase
    .from('player_combat_stats')
    .select('*')
    .eq('player_id', playerId)
    .single();
  
  res.json({ equipped, inventory, combat_stats: stats });
});

// POST /api/equipment/slot/:slot - Equip/unequip in slot
router.post('/slot/:slot', requireAuth, async (req, res) => {
  const { slot } = req.params;
  const { item_id } = req.body; // null to unequip
  const playerId = req.user.id;
  
  // Validate slot
  const validSlots = ['weapon', 'head', 'body', 'legs', 'hands', 'feet'];
  if (!validSlots.includes(slot)) {
    return res.status(400).json({ error: 'Invalid slot' });
  }
  
  // Get player stats
  const { data: player } = await supabase
    .from('players')
    .select('strength')
    .eq('id', playerId)
    .single();
  
  if (item_id) {
    // Equipping: validate ownership and requirements
    const isWeapon = slot === 'weapon';
    const table = isWeapon ? 'weapons' : 'armor';
    
    // Check if player owns the item
    const { data: owned } = await supabase
      .from('player_inventory')
      .select('*')
      .eq('player_id', playerId)
      .eq(isWeapon ? 'weapon_id' : 'armor_id', item_id)
      .single();
    
    if (!owned) {
      return res.status(400).json({ error: 'Item not owned' });
    }
    
    // Get item stats
    const { data: item } = await supabase
      .from(table)
      .select('*')
      .eq('id', item_id)
      .single();
    
    // For armor, check slot matches
    if (!isWeapon && item.slot !== slot) {
      return res.status(400).json({ error: 'Item does not fit in this slot' });
    }
    
    // Calculate current encumbrance
    const { data: currentEquipped } = await supabase
      .from('player_equipped')
      .select(`
        head:armor!player_equipped_head_id_fkey(encumbrance),
        body:armor!player_equipped_body_id_fkey(encumbrance),
        legs:armor!player_equipped_legs_id_fkey(encumbrance),
        hands:armor!player_equipped_hands_id_fkey(encumbrance),
        feet:armor!player_equipped_feet_id_fkey(encumbrance)
      `)
      .eq('player_id', playerId)
      .single();
    
    let currentEncumbrance = 0;
    if (currentEquipped) {
      // Exclude current slot from calculation
      Object.entries(currentEquipped).forEach(([key, armor]) => {
        if (key !== slot && armor?.encumbrance) {
          currentEncumbrance += armor.encumbrance;
        }
      });
    }
    
    // Validate requirements
    const itemEncumbrance = item.encumbrance || 0;
    if (!canEquip(player.strength, item.strength_required || 0, currentEncumbrance, itemEncumbrance)) {
      return res.status(400).json({ error: 'Insufficient strength to equip' });
    }
    
    // Move current equipped item to inventory if exists
    const { data: currentlyEquipped } = await supabase
      .from('player_equipped')
      .select(`${slot}_id`)
      .eq('player_id', playerId)
      .single();
    
    if (currentlyEquipped?.[`${slot}_id`]) {
      await supabase.from('player_inventory').insert({
        player_id: playerId,
        weapon_id: slot === 'weapon' ? currentlyEquipped[`${slot}_id`] : null,
        armor_id: slot !== 'weapon' ? currentlyEquipped[`${slot}_id`] : null
      });
    }
    
    // Equip new item
    await supabase
      .from('player_equipped')
      .upsert({
        player_id: playerId,
        [`${slot}_id`]: item_id
      });
    
    // Remove from inventory
    await supabase
      .from('player_inventory')
      .delete()
      .eq('id', owned.id);
      
  } else {
    // Unequipping: move to inventory
    const { data: equipped } = await supabase
      .from('player_equipped')
      .select(`${slot}_id`)
      .eq('player_id', playerId)
      .single();
    
    if (equipped?.[`${slot}_id`]) {
      await supabase.from('player_inventory').insert({
        player_id: playerId,
        weapon_id: slot === 'weapon' ? equipped[`${slot}_id`] : null,
        armor_id: slot !== 'weapon' ? equipped[`${slot}_id`] : null
      });
      
      await supabase
        .from('player_equipped')
        .update({ [`${slot}_id`]: null })
        .eq('player_id', playerId);
    }
  }
  
  // Update cached combat stats
  await updateCombatStats(playerId);
  
  res.json({ success: true });
});

// Helper: Update combat stats cache
async function updateCombatStats(playerId) {
  const { data: equipped } = await supabase
    .from('player_equipped')
    .select(`
      weapon:weapons(damage_min, damage_max),
      head:armor!player_equipped_head_id_fkey(protection, encumbrance),
      body:armor!player_equipped_body_id_fkey(protection, encumbrance),
      legs:armor!player_equipped_legs_id_fkey(protection, encumbrance),
      hands:armor!player_equipped_hands_id_fkey(protection, encumbrance),
      feet:armor!player_equipped_feet_id_fkey(protection, encumbrance)
    `)
    .eq('player_id', playerId)
    .single();
  
  const { data: player } = await supabase
    .from('players')
    .select('speed')
    .eq('id', playerId)
    .single();
  
  let totalProtection = 0;
  let totalEncumbrance = 0;
  
  ['head', 'body', 'legs', 'hands', 'feet'].forEach(slot => {
    if (equipped?.[slot]) {
      totalProtection += equipped[slot].protection || 0;
      totalEncumbrance += equipped[slot].encumbrance || 0;
    }
  });
  
  const speedModifier = calculateSpeedModifier(player.speed, totalEncumbrance);
  
  await supabase
    .from('player_combat_stats')
    .upsert({
      player_id: playerId,
      total_protection: totalProtection,
      total_encumbrance: totalEncumbrance,
      speed_modifier: speedModifier,
      weapon_damage_min: equipped?.weapon?.damage_min || 0,
      weapon_damage_max: equipped?.weapon?.damage_max || 0,
      updated_at: new Date()
    });
}

export default router;
```

## Phase 3: Combat Integration (Days 4-5)

### 3.1 Enhanced Combat System
Update `/server/routes/beach.js`:
```javascript
// Add to existing combat simulation
export async function simulateCombatWithEquipment(playerId, monster) {
  // Get player base stats
  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .single();
  
  // Get cached combat stats
  const { data: combatStats } = await supabase
    .from('player_combat_stats')
    .select('*')
    .eq('player_id', playerId)
    .single();
  
  const stats = combatStats || {
    total_protection: 0,
    speed_modifier: 1.0,
    weapon_damage_min: 0,
    weapon_damage_max: 0
  };
  
  // Calculate player damage
  const weaponDamage = stats.weapon_damage_min + 
    Math.floor(Math.random() * (stats.weapon_damage_max - stats.weapon_damage_min + 1));
  const playerDamage = Math.floor((player.strength + weaponDamage) * stats.speed_modifier);
  
  // Calculate monster damage after protection
  const monsterDamage = Math.max(1, monster.damage - stats.total_protection);
  
  // Run combat simulation
  let playerHp = player.health;
  let monsterHp = monster.health;
  let rounds = 0;
  const log = [];
  
  while (playerHp > 0 && monsterHp > 0 && rounds < 100) {
    rounds++;
    
    // Player attacks
    monsterHp -= playerDamage;
    log.push(`Round ${rounds}: You deal ${playerDamage} damage (${weaponDamage} from weapon)`);
    
    if (monsterHp <= 0) {
      log.push(`Victory! ${monster.name} defeated in ${rounds} rounds`);
      return { victory: true, rounds, gold_earned: monster.gold_reward, log };
    }
    
    // Monster attacks
    playerHp -= monsterDamage;
    log.push(`${monster.name} deals ${monsterDamage} damage (${stats.total_protection} blocked)`);
    
    if (playerHp <= 0) {
      log.push(`Defeat! You were defeated in ${rounds} rounds`);
      return { victory: false, rounds, gold_earned: 0, log };
    }
  }
  
  return { victory: false, rounds, gold_earned: 0, log };
}
```

## Phase 4: Testing (Days 6-7)

### 4.1 Core Tests
`/server/tests/equipment.test.js`:
```javascript
import { describe, test, expect, beforeAll } from 'vitest';
import { calculateSpeedModifier, canEquip } from '../config/equipment.js';

describe('Equipment Core Functions', () => {
  test('speed modifier calculation', () => {
    expect(calculateSpeedModifier(100, 0)).toBe(1.0);
    expect(calculateSpeedModifier(100, 50)).toBe(0.75);
    expect(calculateSpeedModifier(100, 100)).toBe(0.5);
    expect(calculateSpeedModifier(100, 200)).toBe(0.5); // Minimum
  });
  
  test('equipment validation', () => {
    // Player with 50 strength
    expect(canEquip(50, 30, 10, 10)).toBe(true); // Can equip
    expect(canEquip(50, 60, 0, 0)).toBe(false); // Too high requirement
    expect(canEquip(50, 30, 30, 30)).toBe(false); // Too much encumbrance
  });
});

describe('Equipment API', () => {
  test('purchase requires gold', async () => {
    // Test insufficient gold
    const response = await request(app)
      .post('/api/equipment/purchase')
      .send({ equipment_id: 'expensive-sword', type: 'weapon' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Insufficient gold');
  });
  
  test('equip validates strength', async () => {
    // Test strength requirements
    const response = await request(app)
      .post('/api/equipment/slot/weapon')
      .send({ item_id: 'heavy-sword' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Insufficient strength to equip');
  });
  
  test('combat uses equipment stats', async () => {
    // Equip weapon and armor
    // Run combat
    // Verify damage and protection applied
  });
});
```

## Phase 5: Balance Verification (Days 8-9)

### 5.1 Economy Balance Check
```javascript
// Verify equipment progression matches gold rewards
describe('Equipment Progression', () => {
  test('starter equipment affordable after 10 beach battles', async () => {
    const goldPerBattle = 50; // Average
    const starterWeaponCost = 500;
    expect(goldPerBattle * 10).toBeGreaterThanOrEqual(starterWeaponCost);
  });
  
  test('mid-tier requires temple progression', async () => {
    // Mid-tier armor requires 75+ strength
    // Temple prayers needed to reach this
  });
});
```

## Success Metrics

### Must Have (MVP)
- [x] 46 weapons + 55 armor pieces loaded from scraped data
- [x] Purchase equipment with gold
- [x] Equip/unequip with validation
- [x] Combat uses weapon damage and armor protection
- [x] Speed modifier from encumbrance works
- [x] Atomic transactions prevent corruption

### Nice to Have (Post-MVP)
- [ ] Equipment comparison tool
- [ ] Shop filtering and sorting
- [ ] Equipment recommendations
- [ ] Visual equipment slots UI
- [ ] Equipment sets and bonuses

## Timeline: 9 Days

- **Day 1**: Database schema, seeders
- **Days 2-3**: Core API endpoints
- **Days 4-5**: Combat integration
- **Days 6-7**: Testing suite
- **Days 8-9**: Balance verification and polish

## Key Simplifications from Original Plan

1. **Cleaner Schema**: Separate weapon/armor tables instead of unified
2. **Cached Stats**: Don't recalculate combat stats every battle
3. **Single Slot Endpoint**: `/slot/:slot` handles both equip and unequip
4. **Atomic Purchases**: Database function prevents race conditions
5. **Deferred Features**: Comparison, recommendations, advanced shop

## Next Steps After MVP

1. **Forging System**: Enhance equipment with metals
2. **Durability**: Equipment degradation over time
3. **Trading**: Player-to-player equipment exchange
4. **Special Effects**: Unique weapon abilities

This simplified approach delivers core equipment functionality in less time with fewer edge cases. Focus on getting the basics right before adding complexity.