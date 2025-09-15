import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// Get current authenticated player info
router.get('/me', async (req, res) => {
    try {
        const token = req.cookies.session_token;
        
        if (!token) {
            return res.status(401).json({ error: 'No active session' });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid session' });
        }

        const { data: player, error } = await supabaseAdmin
            .from('players')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching player:', error);
            return res.status(500).json({ error: 'Failed to fetch player data' });
        }

        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.json(player);
    } catch (error) {
        console.error('Player me error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current authenticated player stats
router.get('/me/stats', async (req, res) => {
    try {
        const token = req.cookies.session_token;
        
        if (!token) {
            return res.status(401).json({ error: 'No active session' });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid session' });
        }

        const { data: stats, error } = await supabaseAdmin
            .from('player_stats')
            .select('*')
            .eq('player_id', user.id)
            .single();

        if (error) {
            console.error('Error fetching player stats:', error);
            return res.status(500).json({ error: 'Failed to fetch player stats' });
        }

        res.json(stats || {
            strength: 10,
            speed: 10,
            intelligence: 10,
            stat_points: 0
        });
    } catch (error) {
        console.error('Player stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get player profile by username
router.get('/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        const { data, error } = await supabase
            .rpc('get_player_profile', { player_username: username });
        
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Player not found' });
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update player profile
router.put('/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const updates = req.body;
        
        // Verify authentication
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header' });
        }
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError) throw authError;
        
        // Update player data
        const { data, error } = await supabase
            .from('players')
            .update(updates)
            .eq('username', username)
            .eq('id', user.id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get player inventory
router.get('/:username/inventory', async (req, res) => {
    try {
        const { username } = req.params;
        
        const { data, error } = await supabase
            .rpc('get_player_inventory', { player_username: username });
        
        if (error) throw error;
        
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get player stats
router.get('/:username/stats', async (req, res) => {
    try {
        const { username } = req.params;
        
        // First get player ID
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('id')
            .eq('username', username)
            .single();
        
        if (playerError) throw playerError;
        if (!player) return res.status(404).json({ error: 'Player not found' });
        
        // Get stats
        const { data: stats, error } = await supabase
            .from('player_stats')
            .select('*')
            .eq('player_id', player.id)
            .single();
        
        if (error) throw error;
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Execute player action
router.post('/:username/action', async (req, res) => {
    try {
        const { username } = req.params;
        const { action_type, action_data } = req.body;
        
        // Verify authentication
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header' });
        }
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError) throw authError;
        
        // Execute action
        const { data, error } = await supabase
            .rpc('execute_player_action', {
                player_id_param: user.id,
                action_type,
                action_data
            });
        
        if (error) throw error;
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const { sort_by = 'level', limit = 100 } = req.query;
        
        const { data, error } = await supabase
            .rpc('get_leaderboard', {
                sort_by,
                limit_count: parseInt(limit)
            });
        
        if (error) throw error;
        
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get players in area
router.get('/area/:map/:x/:y', async (req, res) => {
    try {
        const { map, x, y } = req.params;
        const radius = parseInt(req.query.radius) || 5;
        
        const { data, error } = await supabase
            .from('players')
            .select('username, display_name, level, class, location_x, location_y')
            .eq('current_map', map)
            .gte('location_x', parseInt(x) - radius)
            .lte('location_x', parseInt(x) + radius)
            .gte('location_y', parseInt(y) - radius)
            .lte('location_y', parseInt(y) + radius)
            .gte('last_active', new Date(Date.now() - 5 * 60 * 1000).toISOString());
        
        if (error) throw error;
        
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;