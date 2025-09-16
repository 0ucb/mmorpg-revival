import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { sendError, sendSuccess } from '../utils/errorHandler.js';

const router = express.Router();

// Set httpOnly session cookie
const setSessionCookie = (res, session) => {
    if (session?.access_token) {
        res.cookie('session_token', session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
    }
};

// Clear session cookie
const clearSessionCookie = (res) => {
    res.clearCookie('session_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
};

router.post('/register', async (req, res) => {
    try {
        const { email, password, username, characterClass = 'warrior' } = req.body;
        
        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({ error: 'Username must be 3-30 characters' });
        }

        const { data: existingUser } = await supabaseAdmin
            .from('players')
            .select('username')
            .eq('username', username)
            .single();
        
        if (existingUser) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) {
            console.error('Auth error:', authError);
            return res.status(400).json({ error: authError.message });
        }

        const { data: player, error: playerError } = await supabaseAdmin
            .from('players')
            .insert({
                id: authData.user.id,
                username,
                display_name: username,
                class: characterClass,
                level: 1,
                experience: 0,
                health: 10,
                max_health: 10,
                mana: 53,
                max_mana: 53,
                gold: 100,
                location_x: 0,
                location_y: 0,
                current_map: 'spawn'
            })
            .select()
            .single();

        if (playerError) {
            console.error('Player creation error:', playerError);
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return res.status(500).json({ error: 'Failed to create character' });
        }

        const { error: statsError } = await supabaseAdmin
            .from('player_stats')
            .insert({
                player_id: authData.user.id,
                strength: 10.000,
                speed: 10.000,
                intelligence: 10.000,
                stat_points: 0
            });

        if (statsError) {
            console.error('Stats creation error:', statsError);
        }

        res.json({
            success: true,
            user: authData.user,
            player,
            message: 'Registration successful'
        });
    } catch (error) {
        console.error('Registration error:', error);
        sendError(res, 500, 'Internal server error');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return sendError(res, 401, 'Invalid credentials');
        }

        const { data: player } = await supabaseAdmin
            .from('players')
            .select('*')
            .eq('id', data.user.id)
            .single();

        // Set httpOnly cookie for session
        setSessionCookie(res, data.session);

        res.json({
            success: true,
            user: data.user,
            player,
            session: { user: data.user } // Don't expose token in response
        });
    } catch (error) {
        console.error('Login error:', error);
        sendError(res, 500, 'Internal server error');
    }
});

router.post('/logout', async (req, res) => {
    try {
        const token = req.cookies.session_token;
        
        if (token) {
            const { error } = await supabaseAdmin.auth.admin.signOut(token);
            if (error) {
                console.error('Logout error:', error);
            }
        }

        clearSessionCookie(res);
        res.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        clearSessionCookie(res);
        sendError(res, 500, 'Internal server error');
    }
});

router.get('/session', async (req, res) => {
    try {
        const token = req.cookies.session_token;
        
        if (!token) {
            return sendError(res, 401, 'No active session');
        }

        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !user) {
            clearSessionCookie(res);
            return sendError(res, 401, 'Invalid session');
        }

        const { data: player } = await supabaseAdmin
            .from('players')
            .select('*')
            .eq('id', user.id)
            .single();

        res.json({
            user,
            player,
            session: { user }
        });
    } catch (error) {
        console.error('Session error:', error);
        sendError(res, 500, 'Internal server error');
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return sendError(res, 400, 'Email is required');
        }

        const { data, error } = await supabaseAdmin.auth.admin.resetPasswordForEmail(email, {
            redirectTo: `${process.env.CLIENT_URL || 'http://localhost:3001'}/reset-password`
        });

        if (error) {
            console.error('Reset password error:', error);
            return sendError(res, 400, 'Failed to send reset email');
        }

        res.json({
            success: true,
            message: 'Password reset email sent'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        sendError(res, 500, 'Internal server error');
    }
});

router.post('/oauth/:provider', async (req, res) => {
    try {
        const { provider } = req.params;
        const validProviders = ['google', 'discord', 'github'];
        
        if (!validProviders.includes(provider)) {
            return res.status(400).json({ error: 'Invalid provider' });
        }

        const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback`
            }
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ url: data.url });
    } catch (error) {
        console.error('OAuth error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/oauth/callback', async (req, res) => {
    try {
        const { access_token, refresh_token } = req.body;
        
        if (!access_token) {
            return res.status(400).json({ error: 'Missing access token' });
        }

        const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { data: existingPlayer } = await supabaseAdmin
            .from('players')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!existingPlayer) {
            const username = user.user_metadata?.username || 
                          user.user_metadata?.name?.replace(/\s+/g, '_').toLowerCase() ||
                          user.email?.split('@')[0] ||
                          `player_${Date.now()}`;

            const { data: player, error: playerError } = await supabaseAdmin
                .from('players')
                .insert({
                    id: user.id,
                    username: username.substring(0, 30),
                    display_name: user.user_metadata?.full_name || username,
                    class: 'warrior',
                    level: 1,
                    experience: 0,
                    health: 10,
                    max_health: 10,
                    mana: 53,
                    max_mana: 53,
                    gold: 100,
                    location_x: 0,
                    location_y: 0,
                    current_map: 'spawn'
                })
                .select()
                .single();

            if (!playerError) {
                await supabaseAdmin
                    .from('player_stats')
                    .insert({
                        player_id: user.id,
                        strength: 10.000,
                        speed: 10.000,
                        intelligence: 10.000,
                        stat_points: 0
                    });
            }

            res.json({
                success: true,
                user,
                player: player || null,
                newPlayer: true
            });
        } else {
            res.json({
                success: true,
                user,
                player: existingPlayer,
                newPlayer: false
            });
        }
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;