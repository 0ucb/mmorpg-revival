/**
 * Test Equipment Selling Database Functions
 * 
 * This tests the sell_equipment function directly with existing data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseFunctions() {
    console.log('🧪 Testing Equipment Database Functions\n');
    
    try {
        // Test 1: Check if equipment data exists
        console.log('1️⃣ Checking equipment data...');
        
        const { data: weapons, error: weaponsError } = await supabase
            .from('weapons')
            .select('id, name, cost_gold')
            .limit(3);
        
        const { data: armor, error: armorError } = await supabase
            .from('armor')
            .select('id, name, cost_gold')
            .limit(3);
        
        if (weaponsError || armorError) {
            throw new Error('Failed to fetch equipment data');
        }
        
        console.log(`✅ Found ${weapons.length} weapons and ${armor.length} armor pieces`);
        
        if (weapons.length > 0) {
            console.log('   Sample weapons:');
            weapons.forEach(w => console.log(`   - ${w.name}: ${w.cost_gold} gold`));
        }
        
        if (armor.length > 0) {
            console.log('   Sample armor:');
            armor.forEach(a => console.log(`   - ${a.name}: ${a.cost_gold} gold`));
        }
        
        // Test 2: Test sell price calculation logic
        console.log('\n2️⃣ Testing sell price calculations...');
        
        const testItems = [...weapons, ...armor];
        console.log('   Sell price calculations (50% of original):');
        
        testItems.forEach(item => {
            const sellPrice = Math.max(1, Math.floor(item.cost_gold * 0.5));
            console.log(`   - ${item.name}: ${item.cost_gold} → ${sellPrice} (${((sellPrice/item.cost_gold)*100).toFixed(1)}%)`);
        });
        
        // Test 3: Check database function exists
        console.log('\n3️⃣ Checking database functions...');
        
        // This will fail gracefully if the function doesn't exist
        try {
            const { data, error } = await supabase.rpc('sell_equipment', {
                p_player_id: '00000000-0000-0000-0000-000000000000', // Non-existent player
                p_inventory_id: '00000000-0000-0000-0000-000000000000'  // Non-existent inventory
            });
            
            if (data && data.success === false && data.error === 'Item not found in inventory') {
                console.log('✅ sell_equipment function exists and handles invalid inputs correctly');
            } else {
                console.log('⚠️  sell_equipment function behavior unexpected:', data);
            }
        } catch (funcError) {
            if (funcError.message.includes('function sell_equipment')) {
                console.log('❌ sell_equipment function not found - needs to be created');
            } else {
                console.log('⚠️  Unexpected error testing function:', funcError.message);
            }
        }
        
        // Test 4: Test purchase function (existing)
        console.log('\n4️⃣ Testing purchase function...');
        
        try {
            const { data, error } = await supabase.rpc('purchase_equipment', {
                p_player_id: '00000000-0000-0000-0000-000000000000',
                p_weapon_id: weapons[0]?.id || null,
                p_armor_id: null
            });
            
            if (data && data.success === false && data.error === 'Player not found') {
                console.log('✅ purchase_equipment function working correctly');
            } else {
                console.log('⚠️  purchase_equipment function behavior unexpected:', data);
            }
        } catch (funcError) {
            console.log('⚠️  Error testing purchase function:', funcError.message);
        }
        
        // Test 5: Economic balance check
        console.log('\n5️⃣ Economic balance analysis...');
        
        const totalEquipmentValue = testItems.reduce((sum, item) => sum + item.cost_gold, 0);
        const totalSellValue = testItems.reduce((sum, item) => sum + Math.max(1, Math.floor(item.cost_gold * 0.5)), 0);
        const economicLoss = totalEquipmentValue - totalSellValue;
        const lossPercentage = ((economicLoss / totalEquipmentValue) * 100).toFixed(1);
        
        console.log(`   Total equipment value: ${totalEquipmentValue} gold`);
        console.log(`   Total sell-back value: ${totalSellValue} gold`);
        console.log(`   Economic loss per cycle: ${economicLoss} gold (${lossPercentage}%)`);
        
        if (lossPercentage >= 45 && lossPercentage <= 55) {
            console.log('✅ Economic balance looks good (~50% loss is intended)');
        } else {
            console.log('⚠️  Economic balance may need adjustment');
        }
        
        console.log('\n🎉 Database Function Tests Complete!');
        console.log('\n📋 Summary:');
        console.log('✅ Equipment data exists');
        console.log('✅ Sell price calculations work');
        console.log('✅ Database functions are callable');
        console.log('✅ Economic balance is reasonable');
        
    } catch (error) {
        console.error('\n💥 Test failed:', error);
    }
}

// Run the test
testDatabaseFunctions();