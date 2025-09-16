import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/blacksmith - View available weapons only
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

        // Get weapons only
        const { data: weapons, error: weaponsError } = await supabaseAdmin
            .from('weapons')
            .select('*')
            .order('cost_gold');

        if (weaponsError) {
            return res.status(500).json({ error: 'Failed to load weapons' });
        }

        // Add affordability and usability flags
        const weaponsWithFlags = weapons.map(w => ({
            ...w,
            affordable: player.gold >= w.cost_gold,
            can_use: playerStats.strength >= (w.strength_required || 0)
        }));

        res.json({
            success: true,
            weapons: weaponsWithFlags,
            player_gold: player.gold,
            player_strength: playerStats.strength
        });

    } catch (error) {
        console.error('Error fetching blacksmith weapons:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/blacksmith/purchase - Buy weapons only
router.post('/purchase', requireAuth, async (req, res) => {
    try {
        const { equipment_id } = req.body;
        const playerId = req.player.id;

        // Validate input
        if (!equipment_id) {
            return res.status(400).json({ error: 'Equipment ID is required' });
        }

        // Verify it's actually a weapon (not armor)
        const { data: weapon, error: weaponError } = await supabaseAdmin
            .from('weapons')
            .select('id, name')
            .eq('id', equipment_id)
            .single();

        if (weaponError || !weapon) {
            return res.status(400).json({ error: 'Invalid weapon ID - only weapons can be purchased from blacksmith' });
        }

        // Debug logging
        console.log('Blacksmith purchase debug:', {
            playerId,
            equipment_id,
            playerIdType: typeof playerId,
            equipmentIdType: typeof equipment_id
        });

        // Use existing purchase_equipment function (weapons only)
        const { data, error } = await supabaseAdmin.rpc('purchase_equipment', {
            p_player_id: playerId,
            p_weapon_id: equipment_id,
            p_armor_id: null
        });

        if (error) {
            console.error('Weapon purchase error:', error);
            return res.status(500).json({ error: 'Purchase failed due to server error' });
        }

        console.log('Database function response:', { data, error });

        if (!data || !data.success) {
            console.log('Purchase failed with data:', data);
            return res.status(400).json({ 
                error: data?.error || 'Purchase failed',
                details: data
            });
        }

        res.json({
            success: true,
            remaining_gold: data.remaining_gold,
            item_cost: data.item_cost,
            weapon_name: weapon.name,
            message: `Purchased ${weapon.name} from blacksmith`
        });

    } catch (error) {
        console.error('Error during weapon purchase:', error);
        res.status(500).json({ error: 'Internal server error during purchase' });
    }
});

export default router;