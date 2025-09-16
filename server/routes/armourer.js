import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/armourer - View available armor only
router.get('/', requireAuth, async (req, res) => {
    try {
        const playerId = req.player.id;

        // Get player's current gold and strength
        const { data: player, error: playerError } = await supabaseAdmin
            .from('players')
            .select('gold')
            .eq('id', playerId)
            .single();

        if (playerError || !player) {
            return res.status(500).json({ error: 'Failed to load player data' });
        }

        const { data: playerStats, error: statsError } = await supabaseAdmin
            .from('player_stats')
            .select('strength')
            .eq('player_id', playerId)
            .single();

        if (statsError || !playerStats) {
            return res.status(500).json({ error: 'Failed to load player stats' });
        }

        // Get armor only, grouped by slot
        const { data: armor, error: armorError } = await supabaseAdmin
            .from('armor')
            .select('*')
            .order('slot, cost_gold');

        if (armorError) {
            return res.status(500).json({ error: 'Failed to load armor' });
        }

        // Add affordability and usability flags, group by slot
        const armorWithFlags = armor.map(a => ({
            ...a,
            affordable: player.gold >= a.cost_gold,
            can_use: playerStats.strength >= (a.strength_required || 0)
        }));

        // Group armor by slot for easier frontend display
        const armorBySlot = {
            head: armorWithFlags.filter(a => a.slot === 'head'),
            body: armorWithFlags.filter(a => a.slot === 'body'),
            legs: armorWithFlags.filter(a => a.slot === 'legs'),
            hands: armorWithFlags.filter(a => a.slot === 'hands'),
            feet: armorWithFlags.filter(a => a.slot === 'feet')
        };

        res.json({
            success: true,
            armor: armorWithFlags,
            armor_by_slot: armorBySlot,
            player_gold: player.gold,
            player_strength: playerStats.strength
        });

    } catch (error) {
        console.error('Error fetching armourer inventory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/armourer/purchase - Buy armor only
router.post('/purchase', requireAuth, async (req, res) => {
    try {
        const { equipment_id } = req.body;
        const playerId = req.player.id;

        // Validate input
        if (!equipment_id) {
            return res.status(400).json({ error: 'Equipment ID is required' });
        }

        // Verify it's actually armor (not a weapon)
        const { data: armor, error: armorError } = await supabaseAdmin
            .from('armor')
            .select('id, name, slot')
            .eq('id', equipment_id)
            .single();

        if (armorError || !armor) {
            return res.status(400).json({ error: 'Invalid armor ID - only armor can be purchased from armourer' });
        }

        // Use existing purchase_equipment function (armor only)
        const { data, error } = await supabaseAdmin.rpc('purchase_equipment', {
            p_player_id: playerId,
            p_weapon_id: null,
            p_armor_id: equipment_id
        });

        if (error) {
            console.error('Armor purchase error:', error);
            return res.status(500).json({ error: 'Purchase failed due to server error' });
        }

        if (!data || !data.success) {
            return res.status(400).json({ 
                error: data?.error || 'Purchase failed',
                details: data
            });
        }

        res.json({
            success: true,
            remaining_gold: data.remaining_gold,
            item_cost: data.item_cost,
            armor_name: armor.name,
            armor_slot: armor.slot,
            message: `Purchased ${armor.name} (${armor.slot}) from armourer`
        });

    } catch (error) {
        console.error('Error during armor purchase:', error);
        res.status(500).json({ error: 'Internal server error during purchase' });
    }
});

export default router;