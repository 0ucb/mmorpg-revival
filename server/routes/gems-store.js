import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/gems-store - View daily gems purchase status
router.get('/', requireAuth, async (req, res) => {
    try {
        const playerId = req.player.id;

        // Get player's current gold and gems
        const { data: player, error: playerError } = await supabaseAdmin
            .from('players')
            .select('gold, gems')
            .eq('id', playerId)
            .single();

        if (playerError || !player) {
            return res.status(500).json({ error: 'Failed to load player data' });
        }

        // Get today's gem purchases
        const { data: dailyPurchases, error: purchaseError } = await supabaseAdmin
            .from('player_daily_purchases')
            .select('quantity')
            .eq('player_id', playerId)
            .eq('purchase_type', 'gems')
            .eq('purchase_date', new Date().toISOString().split('T')[0])
            .single();

        const gemsPurchasedToday = dailyPurchases?.quantity || 0;
        const gemsRemaining = Math.max(0, 30 - gemsPurchasedToday);

        res.json({
            success: true,
            gems_purchased_today: gemsPurchasedToday,
            gems_remaining: gemsRemaining,
            daily_limit: 30,
            price_per_gem: 90,
            player_gold: player.gold,
            player_gems: player.gems,
            can_purchase: gemsRemaining > 0 && player.gold >= 90
        });

    } catch (error) {
        console.error('Error fetching gems store status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/gems-store/purchase - Buy gems with daily limit enforcement
router.post('/purchase', requireAuth, async (req, res) => {
    try {
        const { quantity } = req.body;
        const playerId = req.player.id;

        // Validate input
        if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
            return res.status(400).json({ error: 'Quantity must be a positive integer' });
        }

        // Use the purchase_gems database function
        const { data, error } = await supabaseAdmin.rpc('purchase_gems', {
            p_player_id: playerId,
            p_quantity: quantity
        });

        if (error) {
            console.error('Gems purchase error:', error);
            return res.status(500).json({ error: 'Purchase failed due to server error' });
        }

        if (!data || !data.success) {
            return res.status(400).json({ 
                error: data?.error || 'Purchase failed',
                details: data
            });
        }

        // Get updated gem purchases for today
        const { data: updatedPurchases } = await supabaseAdmin
            .from('player_daily_purchases')
            .select('quantity')
            .eq('player_id', playerId)
            .eq('purchase_type', 'gems')
            .eq('purchase_date', new Date().toISOString().split('T')[0])
            .single();

        const totalGemsPurchasedToday = updatedPurchases?.quantity || 0;

        res.json({
            success: true,
            gems_purchased: quantity,
            total_cost: data.total_cost,
            remaining_gold: data.remaining_gold,
            gems_purchased_today: totalGemsPurchasedToday,
            gems_remaining: Math.max(0, 30 - totalGemsPurchasedToday),
            message: `Purchased ${quantity} gems for ${data.total_cost} gold`
        });

    } catch (error) {
        console.error('Error during gems purchase:', error);
        res.status(500).json({ error: 'Internal server error during purchase' });
    }
});

export default router;