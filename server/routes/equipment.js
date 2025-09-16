import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateSpeedModifier, canEquip } from '../config/equipment.js';

const router = express.Router();

// Unified equipment shop removed - use separate NPC shops:
// - /api/blacksmith (weapons only)
// - /api/armourer (armor only)
// - /api/gems-store (daily gems purchasing)

// GET /api/equipment/inventory - View player's equipment and stats
router.get('/inventory', requireAuth, async (req, res) => {
    try {
        const playerId = req.player.id;

        // Get equipped items with all item details
        const { data: equipped, error: equippedError } = await supabaseAdmin
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

        if (equippedError && equippedError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Error fetching equipped items:', equippedError);
            return res.status(500).json({ error: 'Failed to load equipped items' });
        }

        // Get unequipped items (inventory)
        const { data: inventory, error: inventoryError } = await supabaseAdmin
            .from('player_inventory')
            .select(`
                id,
                weapon:weapons(*),
                armor:armor(*)
            `)
            .eq('player_id', playerId);

        if (inventoryError) {
            console.error('Error fetching inventory:', inventoryError);
            return res.status(500).json({ error: 'Failed to load inventory' });
        }

        // Get cached combat stats
        const { data: combatStats, error: statsError } = await supabaseAdmin
            .from('player_combat_stats')
            .select('*')
            .eq('player_id', playerId)
            .single();

        if (statsError && statsError.code !== 'PGRST116') { // Allow no stats (new player)
            console.error('Error fetching combat stats:', statsError);
            return res.status(500).json({ error: 'Failed to load combat stats' });
        }

        // Format inventory items
        const formattedInventory = inventory.map(item => ({
            inventory_id: item.id,
            item_id: item.weapon?.id || item.armor?.id, // This is what equip function needs
            item: item.weapon || item.armor,
            type: item.weapon ? 'weapon' : 'armor'
        }));

        console.log('Equipment inventory debug:', {
            inventoryRaw: inventory?.slice(0, 3), // First 3 items
            formattedInventory: formattedInventory?.slice(0, 3) // First 3 formatted
        });

        res.json({
            success: true,
            equipped: equipped || {},
            inventory: formattedInventory,
            combat_stats: combatStats || {
                total_protection: 0,
                total_encumbrance: 0,
                speed_modifier: 1.0,
                weapon_damage_min: 0,
                weapon_damage_max: 0
            }
        });

    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/equipment/slot/:slot - Equip/unequip items
router.post('/slot/:slot', requireAuth, async (req, res) => {
    try {
        const { slot } = req.params;
        const { item_id } = req.body; // null or undefined to unequip
        const playerId = req.player.id;

        // Validate slot
        const validSlots = ['weapon', 'head', 'body', 'legs', 'hands', 'feet'];
        if (!validSlots.includes(slot)) {
            return res.status(400).json({ error: 'Invalid slot. Must be one of: ' + validSlots.join(', ') });
        }

        let result;

        if (item_id) {
            // Equipping an item
            // Determine item type based on slot
            const itemType = slot === 'weapon' ? 'weapon' : 'armor';

            // Debug logging
            console.log('Equip item debug:', {
                playerId,
                item_id,
                itemType,
                slot,
                playerIdType: typeof playerId,
                itemIdType: typeof item_id
            });

            // Use database function for atomic equip operation
            result = await supabaseAdmin.rpc('equip_item', {
                p_player_id: playerId,
                p_item_id: item_id,
                p_item_type: itemType,
                p_slot: slot === 'weapon' ? null : slot
            });

            if (result.error) {
                console.error('Equip error:', result.error);
                return res.status(500).json({ error: 'Equip failed due to server error' });
            }

            console.log('Equip result:', { data: result.data, error: result.error });

            if (!result.data || !result.data.success) {
                console.log('Equip failed with data:', result.data);
                return res.status(400).json({ 
                    error: result.data?.error || 'Failed to equip item',
                    details: result.data
                });
            }

        } else {
            // Unequipping an item
            result = await supabaseAdmin.rpc('unequip_item', {
                p_player_id: playerId,
                p_slot: slot
            });

            if (result.error) {
                console.error('Unequip error:', result.error);
                return res.status(500).json({ error: 'Unequip failed due to server error' });
            }

            if (!result.data || !result.data.success) {
                return res.status(400).json({ 
                    error: result.data?.error || 'Failed to unequip item',
                    details: result.data
                });
            }
        }

        // Get updated combat stats to return
        const { data: updatedStats, error: statsError } = await supabaseAdmin
            .from('player_combat_stats')
            .select('*')
            .eq('player_id', playerId)
            .single();

        res.json({
            success: true,
            message: item_id ? 'Item equipped successfully' : 'Item unequipped successfully',
            action: item_id ? 'equipped' : 'unequipped',
            slot: slot,
            item_id: item_id,
            updated_combat_stats: updatedStats || null
        });

    } catch (error) {
        console.error('Error during slot operation:', error);
        res.status(500).json({ error: 'Internal server error during equipment operation' });
    }
});

// POST /api/equipment/sell - Sell equipment from inventory
router.post('/sell', requireAuth, async (req, res) => {
    try {
        const { inventory_id } = req.body;
        const playerId = req.player.id;

        // Validate input
        if (!inventory_id) {
            return res.status(400).json({ error: 'Inventory ID is required' });
        }

        // Get player's current gold before selling
        const { data: player, error: playerError } = await supabaseAdmin
            .from('players')
            .select('gold')
            .eq('id', playerId)
            .single();

        if (playerError || !player) {
            return res.status(500).json({ error: 'Failed to load player data' });
        }

        // Use database function for atomic sell operation
        const { data, error } = await supabaseAdmin.rpc('sell_equipment', {
            p_player_id: playerId,
            p_inventory_id: inventory_id
        });

        if (error) {
            console.error('Sell error:', error);
            return res.status(500).json({ error: 'Sell failed due to server error' });
        }

        if (!data || !data.success) {
            return res.status(400).json({ 
                error: data?.error || 'Failed to sell item',
                details: data
            });
        }

        res.json({
            success: true,
            gold_earned: data.gold_earned,
            item_name: data.item_name,
            original_cost: data.original_cost,
            new_gold_balance: player.gold + data.gold_earned,
            message: `Sold ${data.item_name} for ${data.gold_earned} gold`
        });

    } catch (error) {
        console.error('Error during sell operation:', error);
        res.status(500).json({ error: 'Internal server error during sell operation' });
    }
});

export default router;