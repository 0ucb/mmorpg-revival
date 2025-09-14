# Combat System Implementation Plan

## Overview
Implementing Phase 2.2 of the MarcoLand Revival project - the core combat system where players fight monsters at the beach to gain XP, gold, and items.

## 1. Monster Database Setup

### Create Monster Seeder (`/database/seeders/monsters.js`)
- Parse 30 monsters from `/scraped-data/wiki/extracted/extensive_monster_guide.json`
- Clean up monster names for consistency:
  - "lllythid" → "Illithid"
  - Any other typos found in original data
- Map scraped data to `creatures` table structure:
  - `name` - cleaned monster name
  - `level` - monster level
  - `health` - monster HP
  - `damage` - average of damage range for base damage
  - `defense` - protection value from scraped data
  - `experience_reward` - XP per mana from scraped data
  - `gold_reward` - gold per mana from scraped data
  - `creature_type` = "monster"
  - `loot_table` - JSON with gem drop rates

### Run Seeder
- Execute seeder to populate creatures table with all 30 monsters

## 2. Combat API Implementation

### Create Beach Route (`/server/routes/beach.js`)

#### GET /api/beach/monsters
- Return list of all monsters with efficiency stats
- Include: name, level, HP, damage, XP/mana, gold/mana ratios
- Sort by level for easy browsing

#### POST /api/beach/fight
**Parameters:**
- `monsterId` - UUID of monster to fight
- `manaToSpend` - always 1 for single fights

**Combat Flow:**
1. Validate player has mana >= 1 and HP > 0
2. Load monster data from database
3. Simulate turn-based combat:
   - Player attacks first
   - Calculate damage: `playerStrength + weaponDamage - monsterDefense`
   - Random variation within reasonable range
   - Monster counterattacks if alive
   - Calculate damage: `monsterDamage - playerDefense`
   - Continue until someone dies
4. Generate detailed combat log matching original format
5. Handle outcomes:
   - **Player wins**: Award XP, gold, check for gems, check level-up
   - **Player dies**: No rewards, set HP to 0, require healing

**Combat Log Format:**
```
You hit the Goblin with your Rusty Dagger and caused 4 damage. (6 left)
The Goblin hit you with it's Little dagger and caused 3 damage. (7 left)
...
You killed the Goblin!

You get 37 experience and 34 gold coins.
You found 1 gem searching the Goblin's body
```

## 3. Game Configuration Updates

### Add to `/server/config/game.js`
- Combat damage calculation functions
- Random damage range generators
- Level-up stat distribution
- Gem drop rate calculations
- Death/healing mechanics

## 4. Database Integration

### Player State Updates
- Deduct 1 mana per fight
- Update HP after combat
- Award XP and gold on victory
- Handle level-ups with stat increases
- Track gems in inventory

### Level-Up System
- Check if player XP >= next level threshold
- Automatically increase level
- Grant stat points/increases
- Update max HP/mana based on new level
- Log level-up in combat results

## 5. Authentication & Middleware
- All combat endpoints use `requireAuth` middleware
- Access player data via `req.player`
- Validate player state before allowing combat

## 6. Testing Strategy
- Use existing `/public/test-auth.html` for manual testing
- Test combat against different monster levels
- Verify mana consumption and regeneration
- Test death/revival mechanics
- Confirm XP/gold rewards match expected values

## Implementation Order
1. Create monster seeder and populate database
2. Build combat calculation functions in game config
3. Implement beach route with monster listing
4. Add combat simulation logic
5. Integrate with main server and test
6. Add level-up handling
7. Test complete combat loop

## Success Criteria
- Players can view all 30 monsters from original game
- Combat mechanics match original MarcoLand behavior
- Turn-based combat with detailed logs
- Proper XP/gold rewards and level progression
- Death mechanics prevent further combat until healing
- Mana consumption works with existing regeneration system