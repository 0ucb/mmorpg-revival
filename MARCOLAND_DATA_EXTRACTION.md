# MarcoLand Implementation Plan - Complete Game Systems Analysis

Based on comprehensive analysis of all scraped JSON data from the original MarcoLand game, here's the accurate implementation roadmap:

## 1. **CORRECTED STATS SYSTEM** (3 Stats, Not 5)
The original game has exactly **3 trainable stats**:
- **Strength**: Affects damage output and equipment requirements
- **Speed**: Affects hit frequency and initiative in combat
- **Intelligence**: Affects critical hit chance, damage multipliers vs opponents, and spell casting

**Training Mechanics**:
- Stats can be raised by praying at Temple of Tiipsi or gaining levels
- Praying costs mana and has diminishing returns based on total stats:
  - Up to 1100 total stats: 3.5 average gain per 50 mana
  - 1100-1300: 2.5 average gain per 50 mana  
  - 1300-1500: 1.5 average gain per 50 mana
  - Over 1500: 1.1 average gain per 50 mana

## 2. **COMPLETE EQUIPMENT SYSTEM**

### **Weapons** (47 weapons total):
From Rusty Dagger (1-5 damage, 0 str req, 100 cost) to Apocalyptica (900-1000 damage, 1000 str req, 10M cost)

### **Armor** (5 body parts, 11 tiers each):
- **Feet**: Sandals → Astral Boots (1-150 protection, 5-200 encumbrance)
- **Hands**: Wool Gloves → Astral Gloves (1-130 protection, 2-170 encumbrance)
- **Head**: Rusty Helm → Astral Helm (2-180 protection, 10-225 encumbrance)
- **Lower Body**: Broken Pants → Astral Leggings (2-150 protection, 5-200 encumbrance)
- **Upper Body**: Old Jacket → Astral Breastplate (2-250 protection, 5-340 encumbrance)

**Encumbrance System**: Total armor encumbrance must be ≤ player's strength

## 3. **PRECISE COMBAT FORMULAS**

### **Core Damage Calculations**:
- **Player vs Monster**: `damage = (Strength + weapon damage) * Speed modifier - opponent's protection`
- **Player vs Player**: `damage = (Strength + weapon damage) * Speed modifier * Intelligence modifier - opponent's protection`

### **Speed Modifier**: 
`0.5 + 0.5*(speed/encumbrance)` (capped at 1.0)

### **Intelligence Modifier** (PvP only):
- Ratio 0.00-0.20: 0.75x damage
- Ratio 0.20-0.40: 0.80x damage  
- Ratio 0.40-0.60: 0.85x damage
- Ratio 0.60-0.80: 0.90x damage
- Ratio 0.80-1.00: 0.95x damage
- Ratio 1.00: 1.00x damage
- Ratio 1.00-2.00: 1.10x damage
- Ratio 2.00-3.00: 1.20x damage
- Ratio 3.00-4.00: 1.30x damage
- Ratio 4.00-5.00: 1.40x damage
- Ratio >5.00: 1.50x damage

## 4. **COMPLETE MONSTER DATABASE** (30 monsters)
From Goblin (10 HP, Level 1, 1-4 damage) to Nazgul (60,000 HP, Level 201, 3900-4200 damage)

## 5. **FORGING SYSTEM**
**Enhancement Costs**:
- Metals: `(Equipment price)/300` (rounded up)
- Gold: `(Equipment price)/1000` (1 Gold minimum)

**Skill Requirements**: Each equipment piece requires specific forging skill percentage (0-100%)

## 6. **COMPLETE LEVEL/XP SYSTEM**
- **Experience needed**: `150 × (Current level)² + 200`
- **Max HP**: `2 × (level)² + 3 × (level)`
- **Max Mana**: `Level × 3 + 50` (up to level 175)

## 7. **CURRENCY & ECONOMY**
**Four Currency Types**:
- **Gold Coins**: Primary currency
- **Metals**: Forging/upgrades
- **Gems**: Healing, premium services
- **Quarzes**: High-level operations

**Healing Costs**:
- Gold: `(Max HP - Current HP)/2.5` (+1 Gem if dead)
- Gems: `(Max HP - Current HP)/500`

## 8. **ADVANCED SYSTEMS TO IMPLEMENT LATER**

### **Golems System**:
- Purchasable AI companions (100K-400K cost)
- Independent leveling, training, combat
- Sage item assistance
- Expensive upkeep (gems for healing, mana daily)

### **Town Wars System**:
- Normal Wars vs Invasions
- 11×11 battlefield grid system
- Siege tools (offensive/defensive)
- Legion formations with targeting AI
- Resource stealing mechanics

### **Creature Training Costs**:
- Metals: `Level × 50 + 0.2 × (Metals in possession)`
- Gold: `Level × 2000 + 0.2 × (Gold in possession)`
- Quartz: `1 + 0.2 × (Quarzes in possession)` (Level 10+)

## **IMMEDIATE NEXT PRIORITIES POST-BEACH**:
1. Implement Temple of Tiipsi for stat training
2. Add complete weapons/armor equipment system  
3. Implement encumbrance mechanics
4. Add forging system with skill requirements
5. Expand monster roster beyond beach creatures
6. Implement PvP combat with intelligence modifiers

This represents the **complete authentic MarcoLand experience** based on the original game data.