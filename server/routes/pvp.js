import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/errorHandler.js';
import {
    pvpConfig,
    canUsePvPMana,
    canAttackTarget,
    simulatePvPCombat,
    calculateResourceTheft,
    createBattleRecord,
    updatePvPStats,
    createProtection,
    isPlayerProtected,
    getProtectionTimeRemaining,
    formatPvPManaDisplay
} from '../config/pvp.js';

const router = express.Router();

// Rate limiting for PvP attacks
import rateLimit from 'express-rate-limit';
const pvpLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: pvpConfig.attacksPerMinute,
    message: { error: 'Too many attacks, please wait before attacking again' },
    standardHeaders: true,
    legacyHeaders: false
});

// GET /api/pvp/targets - Find attackable players
router.get('/targets', requireAuth, async (req, res) => {
    try {
        const attackerId = req.player.id;
        const attackerLevel = req.player.level;
        const attackerPvPMana = req.player.pvp_mana || 0;
        
        // Calculate level range
        const levelRange = Math.ceil(attackerLevel * pvpConfig.levelRangePercent);
        const minLevel = attackerLevel - levelRange;
        const maxLevel = attackerLevel + levelRange;
        
        // Get potential targets
        const { data: potentialTargets, error } = await supabaseAdmin
            .from('players')
            .select(`
                id, username, level, health, max_health,
                pvp_protection!pvp_protection_player_id_fkey(protected_until, last_attacker_id)
            `)
            .neq('id', attackerId) // Exclude self
            .gte('level', minLevel)
            .lte('level', maxLevel)
            .gt('health', 0) // Only alive players
            .order('level', { ascending: true })
            .limit(50);
        
        if (error) {
            console.error('Error fetching PvP targets:', error);
            return sendError(res, 500, 'Failed to fetch targets');
        }
        
        // Filter out protected players and recently attacked
        const now = new Date();
        const validTargets = potentialTargets.filter(target => {
            // Check protection
            if (target.pvp_protection && target.pvp_protection.length > 0) {
                const protection = target.pvp_protection[0];
                if (isPlayerProtected(protection, now)) {
                    return false;
                }
            }
            return true;
        });
        
        // Format targets for response
        const formattedTargets = validTargets.map(target => ({
            id: target.id,
            username: target.username,
            level: target.level,
            health: target.health,
            max_health: target.max_health,
            health_percentage: Math.round((target.health / target.max_health) * 100)
        }));
        
        res.json({
            success: true,
            targets: formattedTargets,
            pvp_mana: attackerPvPMana,
            pvp_mana_display: formatPvPManaDisplay(attackerPvPMana),
            can_attack: attackerPvPMana >= pvpConfig.pvpManaCost,
            level_range: { min: minLevel, max: maxLevel }
        });
        
    } catch (error) {
        console.error('Error in PvP targets:', error);
        return sendError(res, 500, 'Internal server error');
    }
});

// POST /api/pvp/attack/:username - Attack a player
router.post('/attack/:username', requireAuth, pvpLimiter, async (req, res) => {
    try {
        const attackerId = req.player.id;
        const targetUsername = req.params.username;
        
        // Validate attacker has PvP mana
        if (!canUsePvPMana(req.player, pvpConfig.pvpManaCost)) {
            return sendError(res, 400, 'Insufficient PvP mana');
        }
        
        // Validate attacker is alive
        if (req.player.health <= 0) {
            return sendError(res, 400, 'You must be alive to attack other players');
        }
        
        // Validate not attacking self
        if (req.player.username === targetUsername) {
            return sendError(res, 400, 'You cannot attack yourself');
        }
        
        // Get target player with protection info
        const { data: targetData, error: targetError } = await supabaseAdmin
            .from('players')
            .select(`
                id, username, level, health, max_health, gold, gems, metals,
                pvp_protection!pvp_protection_player_id_fkey(protected_until, last_attacker_id)
            `)
            .eq('username', targetUsername)
            .single();
        
        if (targetError || !targetData) {
            return sendError(res, 404, 'Target player not found');
        }
        
        // Check if target can be attacked
        const target = {
            ...targetData,
            protection: targetData.pvp_protection?.[0] || null
        };
        
        if (!canAttackTarget(req.player, target)) {
            if (target.protection && isPlayerProtected(target.protection)) {
                const timeRemaining = getProtectionTimeRemaining(target.protection);
                const minutes = Math.ceil(timeRemaining / (60 * 1000));
                return sendError(res, 400, `Target is protected for ${minutes} more minutes`);
            }
            if (req.player.level > 5 && target.level <= 5) {
                return sendError(res, 400, 'Cannot attack new players (level 5 or lower)');
            }
            return sendError(res, 400, 'Cannot attack this target (level range restriction)');
        }
        
        // Get both players' stats and equipment
        const { data: attackerStats } = await supabaseAdmin
            .from('player_stats')
            .select('*')
            .eq('player_id', attackerId)
            .single();
        
        const { data: defenderStats } = await supabaseAdmin
            .from('player_stats')
            .select('*')
            .eq('player_id', target.id)
            .single();
        
        // Get both players' equipment stats
        const [{ data: attackerEquipment }, { data: defenderEquipment }] = await Promise.all([
            supabaseAdmin
                .from('player_combat_stats')
                .select('*')
                .eq('player_id', attackerId)
                .single(),
            supabaseAdmin
                .from('player_combat_stats')
                .select('*')
                .eq('player_id', target.id)
                .single()
        ]);
        
        // Simulate combat with both equipment sets
        const combatResult = simulatePvPCombat(
            req.player,
            attackerStats || { strength: 10, speed: 10, intelligence: 10 },
            target,
            defenderStats || { strength: 10, speed: 10, intelligence: 10 },
            attackerEquipment,
            defenderEquipment
        );
        
        // Calculate resource theft
        const resourcesStolen = calculateResourceTheft(target, combatResult.isKill);
        
        // Prepare data for atomic transaction
        const newAttackerPvPMana = req.player.pvp_mana - pvpConfig.pvpManaCost;
        const protection = createProtection(target.id, attackerId);
        
        // Calculate final resource amounts
        const attackerGoldAfter = req.player.gold + (combatResult.isKill ? resourcesStolen.gold : 0);
        const attackerGemsAfter = req.player.gems + (combatResult.isKill ? resourcesStolen.gems : 0);
        const attackerMetalsAfter = req.player.metals + (combatResult.isKill ? resourcesStolen.metals : 0);
        
        const defenderGoldAfter = target.gold - (combatResult.isKill ? resourcesStolen.gold : 0);
        const defenderGemsAfter = target.gems - (combatResult.isKill ? resourcesStolen.gems : 0);
        const defenderMetalsAfter = target.metals - (combatResult.isKill ? resourcesStolen.metals : 0);
        
        // Execute atomic transaction via database function
        const { data: transactionResult, error: transactionError } = await supabaseAdmin.rpc('execute_pvp_battle', {
            p_attacker_id: attackerId,
            p_defender_id: target.id,
            p_attacker_damage: combatResult.damage,
            p_defender_health_before: target.health,
            p_defender_health_after: combatResult.defenderHealthAfter,
            p_intelligence_modifier: combatResult.intelligenceModifier,
            p_gold_stolen: resourcesStolen.gold,
            p_gems_stolen: resourcesStolen.gems,
            p_metals_stolen: resourcesStolen.metals,
            p_is_kill: combatResult.isKill,
            p_attacker_pvp_mana_after: newAttackerPvPMana,
            p_attacker_gold_after: attackerGoldAfter,
            p_attacker_gems_after: attackerGemsAfter,
            p_attacker_metals_after: attackerMetalsAfter,
            p_defender_gold_after: defenderGoldAfter,
            p_defender_gems_after: defenderGemsAfter,
            p_defender_metals_after: defenderMetalsAfter,
            p_protection_until: protection.protected_until.toISOString()
        });
        
        if (transactionError) {
            console.error('Error executing PvP battle transaction:', transactionError);
            return sendError(res, 500, 'Failed to process attack');
        }
        
        // Log the PvP action
        try {
            await supabaseAdmin.from('game_logs').insert({
                player_id: attackerId,
                action_type: 'pvp_attack',
                details: {
                    target_id: target.id,
                    target_username: target.username,
                    damage: combatResult.damage,
                    is_kill: combatResult.isKill,
                    resources_stolen: resourcesStolen,
                    intelligence_modifier: combatResult.intelligenceModifier,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (logError) {
            console.warn('Failed to log PvP attack:', logError);
        }
        
        // Format response
        const response = {
            success: true,
            combat_result: {
                damage: combatResult.damage,
                intelligence_modifier: combatResult.intelligenceModifier,
                is_kill: combatResult.isKill,
                defender_health_after: combatResult.defenderHealthAfter,
                resources_stolen: resourcesStolen
            },
            pvp_mana_remaining: newAttackerPvPMana,
            pvp_mana_display: formatPvPManaDisplay(newAttackerPvPMana),
            protection_given: {
                duration_minutes: pvpConfig.protectionMinutes,
                expires_at: protection.protected_until
            }
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Error in PvP attack:', error);
        return sendError(res, 500, 'Internal server error');
    }
});

// GET /api/pvp/history - Get battle history
router.get('/history', requireAuth, async (req, res) => {
    try {
        const playerId = req.player.id;
        // Validate and bound the limit parameter to prevent DoS attacks
        const rawLimit = parseInt(req.query.limit) || 50;
        const limit = Math.min(100, Math.max(1, rawLimit));
        
        // Get battles where player was attacker or defender
        const { data: battles, error } = await supabaseAdmin
            .from('pvp_battles')
            .select(`
                *,
                attacker:players!attacker_id(username),
                defender:players!defender_id(username)
            `)
            .or(`attacker_id.eq.${playerId},defender_id.eq.${playerId}`)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('Error fetching PvP history:', error);
            return sendError(res, 500, 'Failed to fetch battle history');
        }
        
        // Format battles for response
        const formattedBattles = battles.map(battle => ({
            id: battle.id,
            date: battle.created_at,
            was_attacker: battle.attacker_id === playerId,
            opponent: battle.attacker_id === playerId ? battle.defender.username : battle.attacker.username,
            damage: battle.attacker_damage,
            was_kill: battle.is_kill,
            resources_stolen: {
                gold: battle.gold_stolen,
                gems: battle.gems_stolen,
                metals: battle.metals_stolen
            },
            intelligence_modifier: battle.intelligence_modifier
        }));
        
        res.json({
            success: true,
            battles: formattedBattles
        });
        
    } catch (error) {
        console.error('Error in PvP history:', error);
        return sendError(res, 500, 'Internal server error');
    }
});

// GET /api/pvp/status - Get current PvP status
router.get('/status', requireAuth, async (req, res) => {
    try {
        const playerId = req.player.id;
        
        // Get protection info
        const { data: protection } = await supabaseAdmin
            .from('pvp_protection')
            .select('*')
            .eq('player_id', playerId)
            .single();
        
        // Get PvP stats
        const { data: stats } = await supabaseAdmin
            .from('player_stats')
            .select('pvp_kills, pvp_deaths, pvp_damage_dealt, pvp_damage_taken')
            .eq('player_id', playerId)
            .single();
        
        const pvpMana = req.player.pvp_mana || 0;
        const now = new Date();
        
        let protectionStatus = null;
        if (protection && isPlayerProtected(protection, now)) {
            protectionStatus = {
                protected_until: protection.protected_until,
                protection_time_remaining: getProtectionTimeRemaining(protection, now),
                last_attacker_id: protection.last_attacker_id
            };
        }
        
        res.json({
            success: true,
            pvp_mana: pvpMana,
            pvp_mana_display: formatPvPManaDisplay(pvpMana),
            protected_until: protectionStatus?.protected_until || null,
            protection_time_remaining: protectionStatus?.protection_time_remaining || 0,
            stats: {
                kills: stats?.pvp_kills || 0,
                deaths: stats?.pvp_deaths || 0,
                damage_dealt: stats?.pvp_damage_dealt || 0,
                damage_taken: stats?.pvp_damage_taken || 0,
                kd_ratio: stats?.pvp_deaths > 0 ? (stats?.pvp_kills / stats?.pvp_deaths).toFixed(2) : (stats?.pvp_kills || 0).toString()
            },
            player: {
                id: req.player.id,
                username: req.player.username,
                level: req.player.level,
                health: req.player.health,
                max_health: req.player.max_health,
                gold: req.player.gold,
                gems: req.player.gems,
                metals: req.player.metals
            }
        });
        
    } catch (error) {
        console.error('Error in PvP status:', error);
        return sendError(res, 500, 'Internal server error');
    }
});

export default router;