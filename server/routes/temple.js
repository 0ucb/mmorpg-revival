import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { 
    calculateStatGainsWithDiminishing,
    getPrayingEfficiency 
} from '../config/game.js';

const router = express.Router();

// POST /api/temple/pray - Spend mana to gain random stat points
router.post('/pray', requireAuth, async (req, res) => {
    try {
        const { manaAmount, stat } = req.body; // "5", "50", or "all" + stat name
        const playerId = req.player.id;
        
        // Validate stat parameter
        const validStats = ['strength', 'speed', 'intelligence'];
        if (!stat || !validStats.includes(stat)) {
            return res.status(400).json({ 
                error: 'Invalid stat. Must be strength, speed, or intelligence'
            });
        }
        
        // Validate player is alive
        if (req.player.health <= 0) {
            return res.status(400).json({ 
                error: 'You must be alive to pray at the temple'
            });
        }
        
        // Calculate actual mana to spend
        let manaToSpend;
        if (manaAmount === 'all') {
            manaToSpend = req.player.mana;
        } else if (manaAmount === '5' || manaAmount === '50') {
            manaToSpend = parseInt(manaAmount);
        } else {
            return res.status(400).json({ 
                error: 'Invalid mana amount. Use "5", "50", or "all"'
            });
        }
        
        // Validate sufficient mana
        if (req.player.mana < manaToSpend) {
            return res.status(400).json({ 
                error: 'Insufficient mana',
                required: manaToSpend,
                available: req.player.mana
            });
        }
        
        // Must have at least 5 mana to pray
        if (manaToSpend < 5) {
            return res.status(400).json({ 
                error: 'Minimum 5 mana required to pray'
            });
        }

        // Get current stats for efficiency calculation
        const { data: playerStats, error: statsError } = await supabaseAdmin
            .from('player_stats')
            .select('*')
            .eq('player_id', playerId)
            .single();
            
        if (statsError) {
            console.error('Error fetching player stats:', statsError);
            return res.status(500).json({ error: 'Failed to load player stats' });
        }

        const currentTotalStats = playerStats.strength + playerStats.speed + playerStats.intelligence;
        
        // Calculate total stat gains with diminishing returns
        const totalGains = calculateStatGainsWithDiminishing(currentTotalStats, manaToSpend);
        const totalStatGain = totalGains.totalGains;
        
        // Focus all gains on the chosen stat (preserve decimal precision)
        const statGains = {
            strength: stat === 'strength' ? totalStatGain : 0,
            speed: stat === 'speed' ? totalStatGain : 0,
            intelligence: stat === 'intelligence' ? totalStatGain : 0
        };
        
        // Round to 3 decimal places for display/storage consistency
        Object.keys(statGains).forEach(key => {
            statGains[key] = Math.round(statGains[key] * 1000) / 1000;
        });
        
        console.log('Temple prayer debug:', {
            playerId,
            stat,
            manaAmount,
            manaToSpend,
            currentTotalStats,
            totalStatGain,
            statGains,
            oldStats: {
                strength: playerStats.strength,
                speed: playerStats.speed,
                intelligence: playerStats.intelligence
            }
        });
        
        // Prepare new stat values (round to 3 decimal places to avoid floating point errors)
        const newStats = {
            strength: Math.round((playerStats.strength + statGains.strength) * 1000) / 1000,
            speed: Math.round((playerStats.speed + statGains.speed) * 1000) / 1000,
            intelligence: Math.round((playerStats.intelligence + statGains.intelligence) * 1000) / 1000
        };
        
        console.log('New stats after prayer:', newStats);
        
        // Use transaction-like approach: update stats first, then mana
        // If mana update fails, rollback stats
        console.log('Updating player stats:', { playerId, newStats });
        const { error: updateStatsError } = await supabaseAdmin
            .from('player_stats')
            .update(newStats)
            .eq('player_id', playerId);

        if (updateStatsError) {
            console.error('Error updating stats:', updateStatsError);
            return res.status(500).json({ error: 'Failed to update stats' });
        }

        // Update player mana and last_active
        const newMana = req.player.mana - manaToSpend;
        const { error: updateManaError } = await supabaseAdmin
            .from('players')
            .update({ 
                mana: newMana,
                last_active: new Date().toISOString()
            })
            .eq('id', playerId);

        if (updateManaError) {
            // Rollback stats update if mana update fails
            await supabaseAdmin
                .from('player_stats')
                .update({
                    strength: playerStats.strength,
                    speed: playerStats.speed,
                    intelligence: playerStats.intelligence
                })
                .eq('player_id', playerId);
            
            console.error('Error updating mana, rolling back stats:', updateManaError);
            return res.status(500).json({ error: 'Prayer failed, please try again' });
        }

        // Optional: Log prayer for analytics/debugging (don't fail if this fails)
        try {
            await supabaseAdmin
                .from('game_logs')
                .insert({
                    player_id: playerId,
                    action_type: 'temple_pray',
                    details: {
                        mana_spent: manaToSpend,
                        stat_gains: statGains,
                        old_stats: {
                            strength: playerStats.strength,
                            speed: playerStats.speed,
                            intelligence: playerStats.intelligence
                        },
                        new_stats: newStats,
                        efficiency: getPrayingEfficiency(currentTotalStats),
                        timestamp: new Date().toISOString()
                    }
                })
                .single();
        } catch (logError) {
            // Don't fail the prayer if logging fails
            console.warn('Failed to log prayer:', logError);
        }

        res.json({
            success: true,
            mana_spent: manaToSpend,
            stat_gains: {
                strength: statGains.strength,
                speed: statGains.speed,
                intelligence: statGains.intelligence
            },
            total_stat_gains: statGains.totalGains,
            old_stats: {
                strength: playerStats.strength,
                speed: playerStats.speed,
                intelligence: playerStats.intelligence,
                total: currentTotalStats
            },
            new_stats: {
                strength: newStats.strength,
                speed: newStats.speed,
                intelligence: newStats.intelligence,
                total: currentTotalStats + statGains.totalGains
            },
            remaining_mana: newMana,
            efficiency_used: getPrayingEfficiency(currentTotalStats)
        });

    } catch (error) {
        console.error('Prayer error:', error);
        res.status(500).json({ error: 'Internal server error during prayer' });
    }
});

// GET /api/temple/efficiency - Get current prayer efficiency for player
router.get('/efficiency', requireAuth, async (req, res) => {
    try {
        const { data: playerStats, error: statsError } = await supabaseAdmin
            .from('player_stats')
            .select('strength, speed, intelligence')
            .eq('player_id', req.player.id)
            .single();
            
        if (statsError) {
            console.error('Error fetching player stats for efficiency:', statsError);
            return res.status(500).json({ error: 'Failed to get player stats' });
        }
            
        const totalStats = playerStats.strength + playerStats.speed + playerStats.intelligence;
        const efficiency = getPrayingEfficiency(totalStats);
        
        // Determine efficiency tier for UI
        let tier;
        if (totalStats < 1100) tier = 'high';
        else if (totalStats < 1300) tier = 'medium';  
        else if (totalStats < 1500) tier = 'low';
        else tier = 'minimal';
        
        res.json({
            success: true,
            current_stats: {
                strength: playerStats.strength,
                speed: playerStats.speed,
                intelligence: playerStats.intelligence,
                total: totalStats
            },
            efficiency_per_50_mana: efficiency,
            efficiency_tier: tier,
            next_tier_at: totalStats < 1100 ? 1100 : 
                          totalStats < 1300 ? 1300 :
                          totalStats < 1500 ? 1500 : null,
            mana_available: req.player.mana,
            can_pray: req.player.mana >= 5 && req.player.health > 0
        });
    } catch (error) {
        console.error('Efficiency error:', error);
        res.status(500).json({ error: 'Failed to get temple efficiency' });
    }
});

export default router;