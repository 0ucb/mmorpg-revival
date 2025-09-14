/**
 * Equipment Seeder - Load authentic MarcoLand weapons and armor
 * 
 * Uses the data transformer to parse scraped wiki data and insert into database.
 */

import { transformWeapons, transformArmor } from './dataTransformer.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seed equipment data into the database
 * @param {Object} supabase - Supabase client (optional, will create if not provided)
 */
export async function seedEquipment(supabase = null) {
    // Create Supabase client if not provided
    if (!supabase) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
        }
        
        supabase = createClient(supabaseUrl, supabaseKey);
    }
    
    console.log('Starting equipment seeding process...');
    
    try {
        // Transform the scraped data
        console.log('Transforming weapons data...');
        const weaponsData = transformWeapons();
        console.log(`Found ${weaponsData.length} weapons to insert`);
        
        console.log('Transforming armor data...');
        const armorData = transformArmor();
        console.log(`Found ${armorData.length} armor pieces to insert`);
        
        // Insert weapons
        console.log('Inserting weapons into database...');
        const { data: weaponsInserted, error: weaponError } = await supabase
            .from('weapons')
            .upsert(weaponsData, { 
                onConflict: 'name',
                ignoreDuplicates: false 
            })
            .select();
        
        if (weaponError) {
            console.error('Error inserting weapons:', weaponError);
            throw weaponError;
        }
        
        console.log(`Successfully inserted ${weaponsInserted?.length || weaponsData.length} weapons`);
        
        // Insert armor
        console.log('Inserting armor into database...');
        const { data: armorInserted, error: armorError } = await supabase
            .from('armor')
            .upsert(armorData, { 
                onConflict: 'name',
                ignoreDuplicates: false 
            })
            .select();
        
        if (armorError) {
            console.error('Error inserting armor:', armorError);
            throw armorError;
        }
        
        console.log(`Successfully inserted ${armorInserted?.length || armorData.length} armor pieces`);
        
        // Verify the data
        console.log('Verifying inserted data...');
        
        const { data: weaponCount, error: weaponCountError } = await supabase
            .from('weapons')
            .select('id', { count: 'exact', head: true });
            
        const { data: armorCount, error: armorCountError } = await supabase
            .from('armor')
            .select('id', { count: 'exact', head: true });
        
        if (weaponCountError || armorCountError) {
            console.warn('Could not verify counts:', { weaponCountError, armorCountError });
        }
        
        console.log('\n=== Equipment Seeding Complete ===');
        console.log(`Total weapons in database: ${weaponCount?.length || 'unknown'}`);
        console.log(`Total armor pieces in database: ${armorCount?.length || 'unknown'}`);
        
        // Show some example data
        const { data: sampleWeapons } = await supabase
            .from('weapons')
            .select('name, damage_min, damage_max, cost_gold')
            .order('cost_gold')
            .limit(5);
            
        const { data: sampleArmor } = await supabase
            .from('armor')
            .select('name, slot, protection, encumbrance, cost_gold')
            .order('cost_gold')
            .limit(5);
        
        console.log('\nSample weapons (cheapest 5):');
        sampleWeapons?.forEach(w => 
            console.log(`- ${w.name}: ${w.damage_min}-${w.damage_max} dmg, ${w.cost_gold} gold`)
        );
        
        console.log('\nSample armor (cheapest 5):');
        sampleArmor?.forEach(a => 
            console.log(`- ${a.name} (${a.slot}): ${a.protection} protection, ${a.encumbrance} encumbrance, ${a.cost_gold} gold`)
        );
        
        return {
            success: true,
            weaponsInserted: weaponsInserted?.length || weaponsData.length,
            armorInserted: armorInserted?.length || armorData.length
        };
        
    } catch (error) {
        console.error('Equipment seeding failed:', error);
        throw error;
    }
}

/**
 * Clear all equipment data (for testing/development)
 */
export async function clearEquipment(supabase = null) {
    if (!supabase) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        supabase = createClient(supabaseUrl, supabaseKey);
    }
    
    console.log('Clearing all equipment data...');
    
    // Clear in order to respect foreign key constraints
    await supabase.from('player_inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('player_equipped').delete().neq('player_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('player_combat_stats').delete().neq('player_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('weapons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('armor').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('Equipment data cleared successfully');
}

// CLI usage: node database/seeders/equipment.js
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];
    
    try {
        if (command === 'clear') {
            await clearEquipment();
        } else {
            await seedEquipment();
        }
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}