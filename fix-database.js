#!/usr/bin/env node

// Fix database issue with null username
import { supabaseAdmin } from './server/config/supabase.js';

async function fixDatabase() {
    try {
        console.log('Checking for players with null usernames...');
        
        // Find players with null usernames
        const { data: playersWithNullUsername, error: findError } = await supabaseAdmin
            .from('players')
            .select('*')
            .is('username', null);
        
        if (findError) {
            console.error('Error finding players:', findError);
            return;
        }
        
        console.log(`Found ${playersWithNullUsername?.length || 0} players with null usernames`);
        
        if (playersWithNullUsername && playersWithNullUsername.length > 0) {
            for (const player of playersWithNullUsername) {
                console.log(`Fixing player ${player.id}...`);
                
                // Generate a username based on player ID or use a default
                const username = `player_${player.id.slice(0, 8)}`;
                
                const { error: updateError } = await supabaseAdmin
                    .from('players')
                    .update({ 
                        username: username,
                        display_name: player.display_name || username
                    })
                    .eq('id', player.id);
                
                if (updateError) {
                    console.error(`Error updating player ${player.id}:`, updateError);
                } else {
                    console.log(`Fixed player ${player.id} with username: ${username}`);
                }
            }
        }
        
        console.log('Database cleanup complete!');
        
    } catch (error) {
        console.error('Database fix error:', error);
    }
}

fixDatabase();