import { supabaseAdmin } from '../config/supabase.js';
import { gameConfig, getMaxMana } from '../config/game.js';

class ManaRegenerationService {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
    }

    async regenerateMana() {
        try {
            console.log(`[${new Date().toISOString()}] Starting mana regeneration...`);
            
            const { data: players, error } = await supabaseAdmin
                .from('players')
                .select('id, level, mana, max_mana, pvp_mana, last_pvp_mana_regen');
            
            if (error) {
                console.error('Error fetching players for mana regen:', error);
                return;
            }

            const updates = players.map(player => {
                const maxMana = getMaxMana(player.level);
                return {
                    id: player.id,
                    mana: maxMana,
                    max_mana: maxMana,
                    pvp_mana: player.pvp_mana || 5 // Default to 5 if null
                };
            });

            if (updates.length > 0) {
                for (const update of updates) {
                    const { error: updateError } = await supabaseAdmin
                        .from('players')
                        .update({
                            mana: update.mana,
                            max_mana: update.max_mana,
                            last_mana_regen: new Date().toISOString()
                        })
                        .eq('id', update.id);
                    
                    if (updateError) {
                        console.error(`Error updating mana for player ${update.id}:`, updateError);
                    }
                }
                
                console.log(`[${new Date().toISOString()}] Regenerated mana for ${updates.length} players`);
            }

            // Separately handle PvP mana (hourly regeneration)
            await this.regeneratePvPMana();
            await this.logRegenerationEvent(updates.length);
            
        } catch (error) {
            console.error('Mana regeneration error:', error);
        }
    }

    async regeneratePvPMana() {
        try {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            
            // Update players who haven't had PvP mana regeneration in the last hour
            const { data, error } = await supabaseAdmin
                .from('players')
                .select('id, pvp_mana, last_pvp_mana_regen')
                .or(`last_pvp_mana_regen.is.null,last_pvp_mana_regen.lte.${oneHourAgo.toISOString()}`)
                .lt('pvp_mana', 5); // Only regen if less than max
            
            if (error) {
                console.error('Error fetching players for PvP mana regen:', error);
                return;
            }

            let regenCount = 0;
            for (const player of data) {
                const currentPvPMana = player.pvp_mana || 0;
                const lastRegen = player.last_pvp_mana_regen ? new Date(player.last_pvp_mana_regen) : new Date(0);
                const timeSinceLastRegen = now.getTime() - lastRegen.getTime();
                const hoursToRegen = Math.floor(timeSinceLastRegen / (60 * 60 * 1000));
                
                if (hoursToRegen >= 1) {
                    const newPvPMana = Math.min(5, currentPvPMana + hoursToRegen);
                    
                    const { error: updateError } = await supabaseAdmin
                        .from('players')
                        .update({
                            pvp_mana: newPvPMana,
                            last_pvp_mana_regen: now.toISOString()
                        })
                        .eq('id', player.id);
                    
                    if (!updateError) {
                        regenCount++;
                    } else {
                        console.error(`Error updating PvP mana for player ${player.id}:`, updateError);
                    }
                }
            }
            
            if (regenCount > 0) {
                console.log(`[${new Date().toISOString()}] Regenerated PvP mana for ${regenCount} players`);
            }
            
        } catch (error) {
            console.error('PvP mana regeneration error:', error);
        }
    }

    async logRegenerationEvent(playerCount) {
        try {
            await supabaseAdmin
                .from('system_logs')
                .insert({
                    event_type: 'mana_regeneration',
                    details: {
                        players_updated: playerCount,
                        timestamp: new Date().toISOString()
                    }
                });
        } catch (error) {
            console.error('Error logging regeneration event:', error);
        }
    }

    calculateNextRegenerationTime() {
        const now = new Date();
        const hours = gameConfig.mana.regenerationHours;
        
        const nextRegen = new Date(now);
        nextRegen.setHours(Math.ceil(now.getHours() / hours) * hours, 0, 0, 0);
        
        if (nextRegen <= now) {
            nextRegen.setHours(nextRegen.getHours() + hours);
        }
        
        return nextRegen;
    }

    getMillisecondsUntilNextRegen() {
        const next = this.calculateNextRegenerationTime();
        return next.getTime() - Date.now();
    }

    async checkMissedRegenerations() {
        try {
            const { data: players, error } = await supabaseAdmin
                .from('players')
                .select('id, level, mana, max_mana, last_mana_regen, pvp_mana, last_pvp_mana_regen');
            
            if (error) {
                console.error('Error checking missed regenerations:', error);
                return;
            }

            const now = new Date();
            const regenHours = gameConfig.mana.regenerationHours * 60 * 60 * 1000; // Convert to ms
            let regeneratedCount = 0;
            let pvpRegeneratedCount = 0;

            for (const player of players) {
                // Regular mana regeneration
                const lastRegen = player.last_mana_regen ? new Date(player.last_mana_regen) : new Date(0);
                const timeSinceLastRegen = now.getTime() - lastRegen.getTime();
                
                let updateData = {};
                
                // If it's been more than regenHours since last regeneration, regenerate
                if (timeSinceLastRegen >= regenHours) {
                    const maxMana = getMaxMana(player.level);
                    updateData.mana = maxMana;
                    updateData.max_mana = maxMana;
                    updateData.last_mana_regen = now.toISOString();
                    regeneratedCount++;
                }
                
                // PvP mana regeneration (hourly)
                const lastPvPRegen = player.last_pvp_mana_regen ? new Date(player.last_pvp_mana_regen) : new Date(0);
                const timeSincePvPRegen = now.getTime() - lastPvPRegen.getTime();
                const hoursToRegenPvP = Math.floor(timeSincePvPRegen / (60 * 60 * 1000));
                
                if (hoursToRegenPvP >= 1) {
                    const currentPvPMana = player.pvp_mana || 0;
                    const newPvPMana = Math.min(5, currentPvPMana + hoursToRegenPvP);
                    updateData.pvp_mana = newPvPMana;
                    updateData.last_pvp_mana_regen = now.toISOString();
                    pvpRegeneratedCount++;
                }
                
                // Apply updates if any
                if (Object.keys(updateData).length > 0) {
                    const { error: updateError } = await supabaseAdmin
                        .from('players')
                        .update(updateData)
                        .eq('id', player.id);
                    
                    if (updateError) {
                        console.error(`Error updating player ${player.id}:`, updateError);
                    }
                }
            }

            if (regeneratedCount > 0) {
                console.log(`Regenerated mana for ${regeneratedCount} players who missed regeneration while server was down`);
            }
            if (pvpRegeneratedCount > 0) {
                console.log(`Regenerated PvP mana for ${pvpRegeneratedCount} players who missed regeneration while server was down`);
            }
        } catch (error) {
            console.error('Error in checkMissedRegenerations:', error);
        }
    }

    async start() {
        if (this.isRunning) {
            console.log('Mana regeneration service already running');
            return;
        }

        this.isRunning = true;
        console.log('Mana regeneration service started - checking for missed regenerations');
        
        // Check if we missed any regenerations while the server was down
        await this.checkMissedRegenerations();
        
        const scheduleNextRegen = () => {
            const msUntilNext = this.getMillisecondsUntilNextRegen();
            const nextTime = new Date(Date.now() + msUntilNext);
            
            console.log(`Next mana regeneration scheduled for: ${nextTime.toISOString()}`);
            
            this.intervalId = setTimeout(async () => {
                await this.regenerateMana();
                scheduleNextRegen();
            }, msUntilNext);
        };
        
        scheduleNextRegen();
        
        console.log('Mana regeneration service started');
    }

    stop() {
        if (!this.isRunning) {
            console.log('Mana regeneration service not running');
            return;
        }

        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = false;
        console.log('Mana regeneration service stopped');
    }

    async checkPlayerManaStatus(playerId) {
        try {
            const { data: player, error } = await supabaseAdmin
                .from('players')
                .select('mana, max_mana, level, last_active')
                .eq('id', playerId)
                .single();

            if (error || !player) {
                return null;
            }

            const nextRegen = this.calculateNextRegenerationTime();
            const msUntilRegen = nextRegen.getTime() - Date.now();
            const hoursUntilRegen = Math.floor(msUntilRegen / (1000 * 60 * 60));
            const minutesUntilRegen = Math.floor((msUntilRegen % (1000 * 60 * 60)) / (1000 * 60));

            return {
                currentMana: player.mana,
                maxMana: player.max_mana,
                nextRegeneration: nextRegen.toISOString(),
                timeUntilRegen: `${hoursUntilRegen}h ${minutesUntilRegen}m`
            };
        } catch (error) {
            console.error('Error checking player mana status:', error);
            return null;
        }
    }
}

export const manaRegenerationService = new ManaRegenerationService();