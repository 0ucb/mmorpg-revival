# Equipment API Integration Guide

This document explains how to integrate the new Equipment API endpoints with the existing MarcoLand game systems.

## Overview

Phase 2 of the equipment system introduces 4 new REST API endpoints that handle equipment purchase, equipping, and inventory management. These endpoints work seamlessly with the existing beach combat and temple prayer systems.

## API Endpoints

### 1. Equipment Shop - `GET /api/equipment/shop`

View available equipment for purchase with affordability calculations.

**Query Parameters:**
- `type` (optional): `all`, `weapons`, or `armor` (default: `all`)

**Response Example:**
```json
{
  "success": true,
  "equipment": [
    {
      "id": "weapon-uuid",
      "name": "Rusty Dagger",
      "damage_min": 1,
      "damage_max": 3,
      "strength_required": 0,
      "cost_gold": 100,
      "type": "weapon",
      "affordable": true,
      "can_use": true
    }
  ],
  "player_gold": 500,
  "player_strength": 15,
  "player_speed": 12
}
```

### 2. Equipment Purchase - `POST /api/equipment/purchase`

Buy equipment with automatic gold and strength validation.

**Request Body:**
```json
{
  "equipment_id": "weapon-uuid",
  "type": "weapon"
}
```

**Response:**
```json
{
  "success": true,
  "remaining_gold": 400,
  "item_cost": 100,
  "message": "Equipment purchased successfully"
}
```

### 3. Equipment Inventory - `GET /api/equipment/inventory`

View player's equipped items, unequipped inventory, and cached combat stats.

**Response Example:**
```json
{
  "success": true,
  "equipped": {
    "weapon": {
      "name": "Rusty Dagger",
      "damage_min": 1,
      "damage_max": 3
    },
    "head": null,
    "body": null,
    "legs": null,
    "hands": null,
    "feet": null
  },
  "inventory": [
    {
      "inventory_id": "inv-uuid",
      "item": {
        "name": "Leather Boots",
        "slot": "feet",
        "protection": 2,
        "encumbrance": 5
      },
      "type": "armor"
    }
  ],
  "combat_stats": {
    "total_protection": 0,
    "total_encumbrance": 0,
    "speed_modifier": 1.0,
    "weapon_damage_min": 1,
    "weapon_damage_max": 3
  }
}
```

### 4. Equipment Slot Management - `POST /api/equipment/slot/:slot`

Equip or unequip items in specific slots.

**Slots:** `weapon`, `head`, `body`, `legs`, `hands`, `feet`

**Equip Request:**
```json
{
  "item_id": "armor-uuid"
}
```

**Unequip Request:**
```json
{
  "item_id": null
}
```

## Integration with Combat System

The equipment system automatically enhances combat through cached combat stats:

```javascript
// In beach.js combat simulation
const { data: combatStats } = await supabase
  .from('player_combat_stats')
  .select('*')
  .eq('player_id', playerId)
  .single();

// Apply weapon damage
const weaponDamage = combatStats.weapon_damage_min + 
  Math.floor(Math.random() * (combatStats.weapon_damage_max - combatStats.weapon_damage_min + 1));

// Apply speed modifier to damage
const effectiveDamage = Math.floor((player.strength + weaponDamage) * combatStats.speed_modifier);

// Apply armor protection
const damageTaken = Math.max(1, monsterDamage - combatStats.total_protection);
```

## Frontend Integration Examples

### Shop Interface
```javascript
// Load equipment shop
async function loadShop(equipmentType = 'all') {
  const response = await fetch(`/api/equipment/shop?type=${equipmentType}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  return data;
}

// Purchase equipment
async function purchaseEquipment(equipmentId, type) {
  const response = await fetch('/api/equipment/purchase', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ equipment_id: equipmentId, type })
  });
  
  return response.json();
}
```

### Inventory Management
```javascript
// Load player inventory
async function loadInventory() {
  const response = await fetch('/api/equipment/inventory', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
}

// Equip an item
async function equipItem(slot, itemId) {
  const response = await fetch(`/api/equipment/slot/${slot}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ item_id: itemId })
  });
  
  return response.json();
}

// Unequip an item
async function unequipItem(slot) {
  return equipItem(slot, null);
}
```

## Database Functions Used

The API uses atomic PostgreSQL functions for data integrity:

1. **`purchase_equipment(player_id, weapon_id, armor_id)`** - Handles gold validation and inventory updates
2. **`equip_item(player_id, item_id, item_type, slot)`** - Validates requirements and swaps equipment
3. **`unequip_item(player_id, slot)`** - Moves equipped item back to inventory
4. **`update_combat_stats(player_id)`** - Recalculates cached combat statistics

## Error Handling

The API provides consistent error responses:

```json
{
  "error": "Insufficient gold",
  "details": {
    "required": 1000,
    "available": 500
  }
}
```

Common error scenarios:
- Insufficient gold for purchase
- Insufficient strength to equip
- Item not owned by player
- Invalid equipment slot
- Encumbrance exceeds strength limit

## Testing

Use the provided test script:

```bash
node test-equipment-api.js
```

Or test manually with curl:

```bash
# Get shop items
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/equipment/shop

# Purchase equipment
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"equipment_id":"uuid","type":"weapon"}' \
  http://localhost:3000/api/equipment/purchase

# View inventory
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/equipment/inventory

# Equip item
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item_id":"uuid"}' \
  http://localhost:3000/api/equipment/slot/weapon
```

## Next Steps

The equipment API is now ready for frontend integration. Key considerations:

1. **UI Design**: Create equipment shop, inventory, and character panels
2. **Real-time Updates**: Consider WebSocket integration for live inventory updates
3. **Equipment Comparison**: Add comparison tooltips for shop items
4. **Visual Feedback**: Show equipment effects on character appearance
5. **Progression**: Connect with forging/enhancement systems in future phases

The API handles all the complex business logic, validation, and database operations, making frontend integration straightforward and reliable.