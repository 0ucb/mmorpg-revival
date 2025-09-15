/**
 * Test Database Setup - Verify equipment system database operations
 * 
 * This script tests the equipment system implementation without requiring
 * a full server setup. Use this to verify database operations work correctly.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabaseSetup() {
    console.log('Testing Equipment System Database Setup');
    console.log('=====================================\n');
    
    // Create Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase configuration');
        console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
        return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
        // Test 1: Check if equipment tables exist
        console.log('🔍 Testing table existence...');
        
        const { data: weapons, error: weaponError } = await supabase
            .from('weapons')
            .select('id')
            .limit(1);
            
        const { data: armor, error: armorError } = await supabase
            .from('armor')
            .select('id')
            .limit(1);
            
        if (weaponError || armorError) {
            console.error('❌ Equipment tables not found. Please run database migrations first.');
            console.error('Weapon error:', weaponError?.message);
            console.error('Armor error:', armorError?.message);
            return false;
        }
        
        console.log('✅ Equipment tables exist');
        
        // Test 2: Check if functions exist
        console.log('🔍 Testing database functions...');
        
        // Test purchase_equipment function exists
        const { data: testFunction, error: funcError } = await supabase
            .rpc('purchase_equipment', {
                p_player_id: '00000000-0000-0000-0000-000000000000', // Fake UUID for test
                p_weapon_id: '00000000-0000-0000-0000-000000000000'
            })
            .select();
            
        // We expect this to fail with "Player not found" - that means function exists
        if (funcError && !funcError.message.includes('Player not found')) {
            console.error('❌ purchase_equipment function not found');
            console.error('Please run the equipment-functions.sql file');
            return false;
        }
        
        console.log('✅ Database functions exist');
        
        // Test 3: Check if we have equipment data
        console.log('🔍 Testing equipment data...');
        
        const { data: weaponCount, error: weaponCountError } = await supabase
            .from('weapons')
            .select('id', { count: 'exact' });
            
        const { data: armorCount, error: armorCountError } = await supabase
            .from('armor')
            .select('id', { count: 'exact' });
        
        const weaponsTotal = weaponCount?.length || 0;
        const armorTotal = armorCount?.length || 0;
        
        console.log(`📊 Found ${weaponsTotal} weapons and ${armorTotal} armor pieces`);
        
        if (weaponsTotal === 0 || armorTotal === 0) {
            console.log('⚠️  No equipment data found. Run: node database/seeders/equipment.js');
        } else {
            console.log('✅ Equipment data present');
        }
        
        // Test 4: Show sample data
        if (weaponsTotal > 0 && armorTotal > 0) {
            console.log('🔍 Sample equipment data:');
            
            const { data: sampleWeapon } = await supabase
                .from('weapons')
                .select('name, damage_min, damage_max, cost_gold')
                .order('cost_gold')
                .limit(1)
                .single();
                
            const { data: sampleArmor } = await supabase
                .from('armor')
                .select('name, slot, protection, encumbrance, cost_gold')
                .order('cost_gold')
                .limit(1)
                .single();
            
            console.log(`  Sample weapon: ${sampleWeapon.name} (${sampleWeapon.damage_min}-${sampleWeapon.damage_max} dmg, ${sampleWeapon.cost_gold} gold)`);
            console.log(`  Sample armor: ${sampleArmor.name} (${sampleArmor.slot}, ${sampleArmor.protection} protection, ${sampleArmor.cost_gold} gold)`);
        }
        
        console.log('\n🎉 Database setup verification complete!');
        console.log('Equipment system Phase 1 is ready for Phase 2 (API endpoints)');
        
        return true;
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
        return false;
    }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testDatabaseSetup()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}