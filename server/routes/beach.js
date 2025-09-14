import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { 
    gameConfig, 
    simulateCombat, 
    checkLevelUp,
    getMaxHp,
    getMaxMana
} from '../config/game.js';

const router = express.Router();

// Get all monsters available for fighting
router.get('/monsters', requireAuth, async (req, res) => {
    try {
        const { data: monsters, error } = await supabaseAdmin
            .from('creatures')
            .select('*')
            .eq('creature_type', 'monster')
            .order('level', { ascending: true });

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch monsters' });
        }

        // Format monsters with efficiency stats
        const formattedMonsters = monsters.map(monster => ({
            id: monster.id,
            name: monster.name,
            level: monster.level,
            health: monster.health,
            damage_range: monster.loot_table?.damage_range || { min: monster.damage, max: monster.damage },
            defense: monster.defense,
            experience_reward: monster.experience_reward,
            gold_reward: monster.gold_reward,
            xp_per_mana: monster.experience_reward,
            gold_per_mana: monster.gold_reward
        }));

        res.json({
            success: true,
            monsters: formattedMonsters,
            player_mana: req.player.mana,
            mana_per_fight: gameConfig.combat.manaPerFight
        });

    } catch (error) {
        console.error('Error fetching monsters:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fight a monster
router.post('/fight', requireAuth, async (req, res) => {
    try {
        const { monsterId, manaToSpend = 1 } = req.body;
        const playerId = req.player.id;

        // Validate inputs
        if (!monsterId) {
            return res.status(400).json({ error: 'Monster ID is required' });
        }

        if (manaToSpend !== 1) {
            return res.status(400).json({ error: 'Only 1 mana per fight is currently supported' });
        }

        // Check player has enough mana and is alive
        if (req.player.mana < gameConfig.combat.manaPerFight) {
            return res.status(400).json({ 
                error: 'Not enough mana',
                required: gameConfig.combat.manaPerFight,
                available: req.player.mana
            });
        }

        if (req.player.health <= 0) {
            return res.status(400).json({ error: 'You must heal before fighting' });
        }

        // Get monster data
        const { data: monster, error: monsterError } = await supabaseAdmin
            .from('creatures')
            .select('*')
            .eq('id', monsterId)
            .eq('creature_type', 'monster')
            .single();

        if (monsterError || !monster) {
            return res.status(404).json({ error: 'Monster not found' });
        }

        // Get player stats
        const { data: playerStats, error: statsError } = await supabaseAdmin
            .from('player_stats')
            .select('*')
            .eq('player_id', playerId)
            .single();

        if (statsError || !playerStats) {
            return res.status(500).json({ error: 'Failed to load player stats' });
        }

        // Simulate combat
        const combatResult = simulateCombat(req.player, playerStats, monster);
        const newPlayerHp = combatResult.playerHpAfter;
        const newMana = req.player.mana - gameConfig.combat.manaPerFight;

        // Prepare updates
        let playerUpdates = {
            health: newPlayerHp,
            mana: newMana,
            last_active: new Date().toISOString()
        };

        let levelUpResult = null;

        // If player won, award rewards and check for level up
        if (combatResult.playerWon && combatResult.rewards) {
            const newExperience = req.player.experience + combatResult.rewards.experience;
            const newGold = req.player.gold + combatResult.rewards.gold;

            playerUpdates.experience = newExperience;
            playerUpdates.gold = newGold;

            // Check for level up
            levelUpResult = checkLevelUp(req.player.level, req.player.experience, newExperience);
            
            if (levelUpResult.leveledUp) {
                playerUpdates.level = levelUpResult.newLevel;
                playerUpdates.max_health = getMaxHp(levelUpResult.newLevel);
                playerUpdates.max_mana = getMaxMana(levelUpResult.newLevel);
                
                // Grant stat points for level up (simplified - could be more complex)
                await supabaseAdmin
                    .from('player_stats')
                    .update({
                        stat_points: playerStats.stat_points + (levelUpResult.levelsGained * 2)
                    })
                    .eq('player_id', playerId);
            }
        }

        // Update player in database
        const { error: updateError } = await supabaseAdmin
            .from('players')
            .update(playerUpdates)
            .eq('id', playerId);

        if (updateError) {
            console.error('Error updating player:', updateError);
            return res.status(500).json({ error: 'Failed to update player data' });
        }

        // Format combat log for display
        const formattedLog = combatResult.combatLog.map(entry => {
            if (entry.attacker === 'player') {
                return `You hit the ${entry.target} with your ${entry.weapon} and caused ${entry.damage} damage. (${entry.targetHpRemaining} left)`;
            } else {
                return `The ${monster.name} hit you with ${entry.weapon} and caused ${entry.damage} damage. (${entry.targetHpRemaining} left)`;
            }
        });

        if (combatResult.playerWon) {
            formattedLog.push(`You killed the ${monster.name}!`);
            formattedLog.push('');
            formattedLog.push(`You get ${combatResult.rewards.experience} experience and ${combatResult.rewards.gold} gold coins.`);
            
            if (combatResult.rewards.gems > 0) {
                formattedLog.push(`You found ${combatResult.rewards.gems} gem searching the ${monster.name}'s body`);
            }

            if (levelUpResult?.leveledUp) {
                formattedLog.push('');
                formattedLog.push(`*** LEVEL UP! You are now level ${levelUpResult.newLevel}! ***`);
                formattedLog.push(`You gained ${levelUpResult.levelsGained * 2} stat points to distribute.`);
            }
        }

        res.json({
            success: true,
            combat_result: {
                player_won: combatResult.playerWon,
                combat_log: formattedLog,
                rewards: combatResult.rewards,
                level_up: levelUpResult
            },
            player_state: {
                health: newPlayerHp,
                max_health: playerUpdates.max_health || req.player.max_health,
                mana: newMana,
                max_mana: playerUpdates.max_mana || req.player.max_mana,
                level: playerUpdates.level || req.player.level,
                experience: playerUpdates.experience || req.player.experience,
                gold: playerUpdates.gold || req.player.gold
            }
        });

    } catch (error) {
        console.error('Error during combat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;