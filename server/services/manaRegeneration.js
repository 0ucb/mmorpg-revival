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
                .select('id, level, mana, max_mana');
            
            if (error) {
                console.error('Error fetching players for mana regen:', error);
                return;
            }

            const updates = players.map(player => {
                const maxMana = getMaxMana(player.level);
                return {
                    id: player.id,
                    mana: maxMana,
                    max_mana: maxMana
                };
            });

            if (updates.length > 0) {
                const batchSize = 100;
                for (let i = 0; i < updates.length; i += batchSize) {
                    const batch = updates.slice(i, i + batchSize);
                    
                    const { error: updateError } = await supabaseAdmin
                        .from('players')
                        .upsert(batch, { onConflict: 'id' });
                    
                    if (updateError) {
                        console.error('Error updating mana batch:', updateError);
                    }
                }
                
                console.log(`[${new Date().toISOString()}] Regenerated mana for ${updates.length} players`);
            }

            await this.logRegenerationEvent(updates.length);
            
        } catch (error) {
            console.error('Mana regeneration error:', error);
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

    async start() {
        if (this.isRunning) {
            console.log('Mana regeneration service already running');
            return;
        }

        this.isRunning = true;
        
        await this.regenerateMana();
        
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