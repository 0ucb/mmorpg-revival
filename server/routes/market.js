import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/market - Player marketplace placeholder (future implementation)
router.get('/', requireAuth, async (req, res) => {
    try {
        const playerId = req.player.id;

        // Get player's current resources for display
        const { data: player, error: playerError } = await supabaseAdmin
            .from('players')
            .select('gold, gems, metals, quartz')
            .eq('id', playerId)
            .single();

        if (playerError || !player) {
            return res.status(500).json({ error: 'Failed to load player data' });
        }

        res.json({
            success: true,
            message: 'Player marketplace coming soon!',
            description: 'This is where players will trade gems, metals, weapons, armor, and food with each other.',
            planned_features: [
                'List items for sale to other players',
                'Browse all player listings with filters',
                'Purchase from player listings with transaction security', 
                'Price history and market trend analysis',
                'Auction house for special player auctions'
            ],
            listings: [], // Empty for now
            player_resources: {
                gold: player.gold,
                gems: player.gems,
                metals: player.metals,
                quartz: player.quartz
            }
        });

    } catch (error) {
        console.error('Error fetching market:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/market/list - List item for sale (placeholder)
router.post('/list', requireAuth, async (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Player trading not yet implemented',
        description: 'This feature will be available in a future update'
    });
});

// POST /api/market/purchase - Buy from player listing (placeholder)
router.post('/purchase', requireAuth, async (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Player trading not yet implemented',
        description: 'This feature will be available in a future update'
    });
});

// DELETE /api/market/cancel/:listingId - Cancel own listing (placeholder)
router.delete('/cancel/:listingId', requireAuth, async (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Player trading not yet implemented',
        description: 'This feature will be available in a future update'
    });
});

export default router;