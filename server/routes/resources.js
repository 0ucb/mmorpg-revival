import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/resources/vote - View daily voting status
router.get('/vote', requireAuth, async (req, res) => {
    try {
        const playerId = req.player.id;

        // Get player's current gold
        const { data: player, error: playerError } = await supabaseAdmin
            .from('players')
            .select('gold')
            .eq('id', playerId)
            .single();

        if (playerError || !player) {
            return res.status(500).json({ error: 'Failed to load player data' });
        }

        // Check if voted today
        const { data: dailyVote, error: voteError } = await supabaseAdmin
            .from('player_daily_purchases')
            .select('quantity, gold_spent')
            .eq('player_id', playerId)
            .eq('purchase_type', 'vote')
            .eq('purchase_date', new Date().toISOString().split('T')[0])
            .single();

        const votedToday = dailyVote ? true : false;
        const goldEarnedToday = dailyVote ? Math.abs(dailyVote.gold_spent) : 0;

        res.json({
            success: true,
            voted_today: votedToday,
            can_vote: !votedToday,
            gold_earned_today: goldEarnedToday,
            gold_range: '500-1000',
            mana_reload_chance: '5%',
            player_gold: player.gold,
            message: votedToday 
                ? `Already voted today - earned ${goldEarnedToday} gold`
                : 'Vote daily for 500-1000 gold + rare mana reload chance!'
        });

    } catch (error) {
        console.error('Error fetching voting status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/resources/vote - Submit daily vote
router.post('/vote', requireAuth, async (req, res) => {
    try {
        const playerId = req.player.id;

        // Use the daily_vote database function
        const { data, error } = await supabaseAdmin.rpc('daily_vote', {
            p_player_id: playerId
        });

        if (error) {
            console.error('Daily vote error:', error);
            return res.status(500).json({ error: 'Vote failed due to server error' });
        }

        if (!data || !data.success) {
            return res.status(400).json({ 
                error: data?.error || 'Vote failed',
                details: data
            });
        }

        res.json({
            success: true,
            gold_awarded: data.gold_awarded,
            mana_reload: data.mana_reload,
            message: data.message
        });

    } catch (error) {
        console.error('Error during daily vote:', error);
        res.status(500).json({ error: 'Internal server error during vote' });
    }
});

// GET /api/resources/mana-tree - View mana tree purchase status
router.get('/mana-tree', requireAuth, async (req, res) => {
    try {
        const playerId = req.player.id;

        // Get player's current gems and max mana
        const { data: player, error: playerError } = await supabaseAdmin
            .from('players')
            .select('gems, max_mana')
            .eq('id', playerId)
            .single();

        if (playerError || !player) {
            return res.status(500).json({ error: 'Failed to load player data' });
        }

        // Check if purchased mana today
        const { data: dailyMana, error: manaError } = await supabaseAdmin
            .from('player_daily_purchases')
            .select('quantity')
            .eq('player_id', playerId)
            .eq('purchase_type', 'mana')
            .eq('purchase_date', new Date().toISOString().split('T')[0])
            .single();

        const manaPurchasedToday = dailyMana ? dailyMana.quantity : 0;
        const canPurchase = manaPurchasedToday === 0 && player.gems >= 100;

        res.json({
            success: true,
            mana_purchased_today: manaPurchasedToday,
            can_purchase: canPurchase,
            gems_required: 100,
            player_gems: player.gems,
            current_max_mana: player.max_mana,
            daily_limit: 1,
            message: manaPurchasedToday > 0
                ? 'Already purchased mana today'
                : canPurchase
                    ? 'Purchase 1 max mana for 100 gems'
                    : player.gems < 100
                        ? `Need ${100 - player.gems} more gems`
                        : 'Ready to purchase!'
        });

    } catch (error) {
        console.error('Error fetching mana tree status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/resources/mana-tree/purchase - Buy max mana with gems
router.post('/mana-tree/purchase', requireAuth, async (req, res) => {
    try {
        const playerId = req.player.id;

        // Use the purchase_mana_tree database function
        const { data, error } = await supabaseAdmin.rpc('purchase_mana_tree', {
            p_player_id: playerId
        });

        if (error) {
            console.error('Mana tree purchase error:', error);
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
            gems_spent: data.gems_spent,
            max_mana_increased: data.max_mana_increased,
            message: data.message
        });

    } catch (error) {
        console.error('Error during mana tree purchase:', error);
        res.status(500).json({ error: 'Internal server error during purchase' });
    }
});

export default router;