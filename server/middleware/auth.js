import { supabaseAdmin } from '../config/supabase.js';

export const requireAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }

        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const { data: player, error: playerError } = await supabaseAdmin
            .from('players')
            .select('*')
            .eq('id', user.id)
            .single();

        if (playerError || !player) {
            return res.status(404).json({ error: 'Player character not found' });
        }

        req.user = user;
        req.player = player;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
};

export const optionalAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            req.user = null;
            req.player = null;
            return next();
        }

        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (!error && user) {
            const { data: player } = await supabaseAdmin
                .from('players')
                .select('*')
                .eq('id', user.id)
                .single();

            req.user = user;
            req.player = player;
        } else {
            req.user = null;
            req.player = null;
        }
        
        next();
    } catch (error) {
        console.error('Optional auth error:', error);
        req.user = null;
        req.player = null;
        next();
    }
};

export const requireAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }

        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const isAdmin = user.user_metadata?.is_admin || 
                       user.email?.endsWith('@admin.marcoland.com') ||
                       false;

        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.user = user;
        req.isAdmin = true;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
};