# Next PR: Shop & Economy System

## Overview
Implement the shop system to complete the equipment acquisition loop. Players can currently fight monsters for gold and equip items, but cannot purchase equipment yet. This PR will add shop functionality to close this gap.

## Current State
✅ **Completed:**
- Equipment database with 51 weapons + 56 armor pieces
- Equipment API endpoints (inventory, equip/unequip)
- Purchase function exists but no shop interface
- Players earn gold from combat
- Equipment affects combat performance

❌ **Missing:**
- Shop endpoints to browse and purchase equipment
- Selling items back to shop
- Price tiers and level requirements
- Shop filtering and sorting

## Scope of This PR

### 1. Shop API Endpoints

#### `GET /api/shop`
Browse available equipment for purchase
- Query parameters:
  - `type`: 'all' | 'weapons' | 'armor' (default: 'all')
  - `slot`: For armor filtering ('head' | 'body' | 'legs' | 'hands' | 'feet')
  - `affordable`: 'true' | 'false' - Filter by player's gold
  - `usable`: 'true' | 'false' - Filter by strength requirements
  - `sort`: 'price_asc' | 'price_desc' | 'power_asc' | 'power_desc'
  - `limit`: Number of items (default: 50)
  - `offset`: Pagination

- Response includes:
  - Item details (name, stats, requirements)
  - Affordability flag based on player's gold
  - Usability flag based on player's strength
  - Current ownership status

#### `POST /api/shop/buy/:itemId`
Purchase equipment from shop
- Uses existing `purchase_equipment` database function
- Validates gold and strength requirements
- Adds to player inventory
- Returns updated gold balance

#### `POST /api/shop/sell/:itemId`
Sell equipment back to shop
- Must be in player's inventory (not equipped)
- Sells for 50% of original price (configurable)
- Updates player gold
- Removes from inventory

### 2. Shop Configuration

Create `/server/config/shop.js`:
```javascript
export const shopConfig = {
  sellBackRate: 0.5, // 50% of original price
  maxItemsPerPage: 50,
  defaultSort: 'price_asc',
  
  // Tier-based visibility (future enhancement)
  tiers: {
    starter: { maxPrice: 5000, maxStrength: 25 },
    intermediate: { maxPrice: 50000, maxStrength: 75 },
    advanced: { maxPrice: 500000, maxStrength: 200 },
    legendary: { maxPrice: Infinity, maxStrength: Infinity }
  }
};
```

### 3. Database Functions

Add to `/database/shop-functions.sql`:
```sql
-- Function to sell equipment back to shop
CREATE OR REPLACE FUNCTION sell_equipment(
    p_player_id UUID,
    p_inventory_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_item RECORD;
    v_sell_price INTEGER;
BEGIN
    -- Get item from inventory
    SELECT * INTO v_item FROM player_inventory 
    WHERE id = p_inventory_id AND player_id = p_player_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Item not in inventory');
    END IF;
    
    -- Calculate sell price (50% of original)
    IF v_item.weapon_id IS NOT NULL THEN
        SELECT cost_gold * 0.5 INTO v_sell_price FROM weapons WHERE id = v_item.weapon_id;
    ELSE
        SELECT cost_gold * 0.5 INTO v_sell_price FROM armor WHERE id = v_item.armor_id;
    END IF;
    
    -- Update player gold
    UPDATE players SET gold = gold + v_sell_price WHERE id = p_player_id;
    
    -- Remove from inventory
    DELETE FROM player_inventory WHERE id = p_inventory_id;
    
    RETURN jsonb_build_object('success', true, 'gold_earned', v_sell_price);
END;
$$ LANGUAGE plpgsql;
```

### 4. Route Implementation

Update `/server/routes/shop.js`:
- Implement all three endpoints
- Use existing authentication middleware
- Validate all inputs
- Handle errors gracefully
- Return consistent response format

### 5. Testing

Create `/server/tests/shop.test.js`:
- Test shop listing with filters
- Test purchasing with various scenarios (success, no gold, no strength)
- Test selling items
- Test pagination
- Test sorting
- Test edge cases

## Implementation Order

1. **Database first** - Add sell_equipment function
2. **Configuration** - Create shop.js config
3. **Routes** - Implement shop endpoints
4. **Integration** - Wire up to existing equipment system
5. **Testing** - Comprehensive test coverage
6. **Documentation** - Update API docs

## Success Criteria

- [ ] Players can browse all equipment in shop
- [ ] Filtering by type, slot, affordability works
- [ ] Sorting by price and power works
- [ ] Players can purchase equipment with gold
- [ ] Players can sell unequipped items
- [ ] All edge cases handled (no gold, requirements not met, etc.)
- [ ] Tests pass with >90% coverage
- [ ] API documentation updated

## Estimated Effort

**Time:** 4-6 hours
**Complexity:** Medium
**Risk:** Low (builds on existing foundation)

## Dependencies

- Existing equipment system (✅ complete)
- Existing auth system (✅ complete)
- Existing database functions (✅ complete)

## Future Enhancements (Not in this PR)

- Shop UI in frontend
- Special deals/discounts
- Limited time offers
- Shop refresh mechanics
- Trading between players
- Auction house
- Crafting materials shop

## Testing Plan

1. **Unit Tests:**
   - Shop configuration values
   - Price calculations
   - Filter logic

2. **Integration Tests:**
   - Full purchase flow
   - Full sell flow
   - Database consistency

3. **Manual Testing:**
   - Browse shop as new player
   - Purchase starter equipment
   - Sell equipment back
   - Try to buy unaffordable items

## Roll-out Strategy

1. Deploy database functions
2. Deploy API endpoints
3. Test in staging environment
4. Release to production
5. Monitor for issues
6. Add frontend UI in next PR

## Notes

- This PR focuses on API only, no frontend changes
- Maintains backwards compatibility
- Uses existing authentication and equipment systems
- Sets foundation for future marketplace features
- Completes the core economic loop (earn → spend → upgrade)