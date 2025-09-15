/**
 * Complete Equipment Economy Cycle Test
 * 
 * Tests the full buy -> equip -> unequip -> sell cycle
 * to ensure the economic loop works correctly.
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

// Test player data
const testPlayerId = 'test-economy-player-' + Date.now();
const testPlayerEmail = `test-economy-${Date.now()}@example.com`;

async function createTestPlayer() {
    console.log('🔧 Creating test player...');
    
    // Create player
    const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
            id: testPlayerId,
            email: testPlayerEmail,
            username: `TestPlayer${Date.now()}`,
            gold: 10000, // Start with enough gold for testing
            created_at: new Date().toISOString()
        })
        .select()
        .single();
    
    if (playerError) {
        console.error('Failed to create player:', playerError);
        throw playerError;
    }
    
    // Create player stats
    const { error: statsError } = await supabase
        .from('player_stats')
        .insert({
            player_id: testPlayerId,
            level: 10,
            experience: 1000,
            health: 100,
            max_health: 100,
            mana: 50,
            max_mana: 50,
            strength: 50, // Enough to use most equipment
            defense: 20,
            agility: 30,
            intelligence: 25,
            luck: 15,
            speed: 40
        });
    
    if (statsError) {
        console.error('Failed to create player stats:', statsError);
        throw statsError;
    }
    
    console.log(`✅ Created test player: ${testPlayerId}`);
    return player;
}

async function getAffordableEquipment() {
    console.log('🔍 Finding affordable equipment...');
    
    // Get some affordable weapons and armor
    const { data: weapons, error: weaponError } = await supabase
        .from('weapons')
        .select('*')
        .lte('cost_gold', 5000) // Affordable with our 10k gold
        .lte('strength_required', 50) // Within our strength
        .order('cost_gold')
        .limit(2);
    
    const { data: armor, error: armorError } = await supabase
        .from('armor')
        .select('*')
        .lte('cost_gold', 3000)
        .lte('strength_required', 50)
        .order('cost_gold')
        .limit(2);
    
    if (weaponError || armorError) {
        throw new Error('Failed to fetch equipment: ' + (weaponError || armorError).message);
    }
    
    console.log(`✅ Found ${weapons.length} weapons and ${armor.length} armor pieces`);
    return { weapons, armor };
}

async function testPurchaseFlow(equipment) {
    console.log('\n💰 Testing Purchase Flow...');
    
    const purchaseResults = [];
    
    for (const item of equipment) {
        console.log(`\n🛒 Purchasing: ${item.name} (${item.cost_gold} gold)`);
        
        // Get player gold before purchase
        const { data: playerBefore } = await supabase
            .from('players')
            .select('gold')
            .eq('id', testPlayerId)
            .single();
        
        // Purchase the item
        const { data, error } = await supabase.rpc('purchase_equipment', {
            p_player_id: testPlayerId,
            p_weapon_id: item.damage_min ? item.id : null, // It's a weapon if it has damage
            p_armor_id: item.protection ? item.id : null   // It's armor if it has protection
        });
        
        if (error || !data.success) {
            console.log(`❌ Purchase failed: ${error?.message || data?.error}`);
            continue;
        }
        
        // Verify gold deduction
        const expectedGold = playerBefore.gold - item.cost_gold;
        if (data.remaining_gold === expectedGold) {
            console.log(`✅ Gold correctly deducted: ${playerBefore.gold} → ${data.remaining_gold}`);
        } else {
            console.log(`❌ Gold mismatch: expected ${expectedGold}, got ${data.remaining_gold}`);
        }
        
        purchaseResults.push({
            item,
            success: true,
            goldSpent: item.cost_gold
        });
    }
    
    return purchaseResults;
}

async function testEquipFlow(purchasedItems) {
    console.log('\n⚔️ Testing Equip Flow...');
    
    // Get inventory items
    const { data: inventory } = await supabase
        .from('player_inventory')
        .select('id, weapon_id, armor_id')
        .eq('player_id', testPlayerId);
    
    const equipResults = [];
    
    for (const inventoryItem of inventory) {
        const purchasedItem = purchasedItems.find(p => 
            p.item.id === inventoryItem.weapon_id || p.item.id === inventoryItem.armor_id
        );
        
        if (!purchasedItem) continue;
        
        const item = purchasedItem.item;
        const slot = item.damage_min ? 'weapon' : item.slot; // weapon or armor slot
        
        console.log(`\n🎽 Equipping: ${item.name} to ${slot} slot`);
        
        const { data, error } = await supabase.rpc('equip_item', {
            p_player_id: testPlayerId,
            p_item_id: item.id,
            p_item_type: item.damage_min ? 'weapon' : 'armor',
            p_slot: item.damage_min ? null : slot
        });
        
        if (error || !data.success) {
            console.log(`❌ Equip failed: ${error?.message || data?.error}`);
            continue;
        }
        
        console.log(`✅ Successfully equipped ${item.name}`);
        
        equipResults.push({
            item,
            slot,
            success: true
        });
    }
    
    return equipResults;
}

async function testUnequipFlow(equippedItems) {
    console.log('\n🎒 Testing Unequip Flow...');
    
    const unequipResults = [];
    
    for (const equippedItem of equippedItems) {
        console.log(`\n📤 Unequipping: ${equippedItem.item.name} from ${equippedItem.slot}`);
        
        const { data, error } = await supabase.rpc('unequip_item', {
            p_player_id: testPlayerId,
            p_slot: equippedItem.slot
        });
        
        if (error || !data.success) {
            console.log(`❌ Unequip failed: ${error?.message || data?.error}`);
            continue;
        }
        
        console.log(`✅ Successfully unequipped ${equippedItem.item.name}`);
        
        unequipResults.push({
            item: equippedItem.item,
            success: true
        });
    }
    
    return unequipResults;
}

async function testSellFlow(unequippedItems) {
    console.log('\n💸 Testing Sell Flow...');
    
    // Get current inventory
    const { data: inventory } = await supabase
        .from('player_inventory')
        .select('id, weapon_id, armor_id')
        .eq('player_id', testPlayerId);
    
    const sellResults = [];
    let totalGoldEarned = 0;
    
    for (const inventoryItem of inventory) {
        const unequippedItem = unequippedItems.find(u => 
            u.item.id === inventoryItem.weapon_id || u.item.id === inventoryItem.armor_id
        );
        
        if (!unequippedItem) continue;
        
        const item = unequippedItem.item;
        const expectedSellPrice = Math.max(1, Math.floor(item.cost_gold * 0.5));
        
        console.log(`\n💰 Selling: ${item.name} (expected: ${expectedSellPrice} gold)`);
        
        // Get player gold before selling
        const { data: playerBefore } = await supabase
            .from('players')
            .select('gold')
            .eq('id', testPlayerId)
            .single();
        
        const { data, error } = await supabase.rpc('sell_equipment', {
            p_player_id: testPlayerId,
            p_inventory_id: inventoryItem.id
        });
        
        if (error || !data.success) {
            console.log(`❌ Sell failed: ${error?.message || data?.error}`);
            continue;
        }
        
        // Verify sell price
        if (data.gold_earned === expectedSellPrice) {
            console.log(`✅ Correct sell price: ${data.gold_earned} gold (50% of ${data.original_cost})`);
        } else {
            console.log(`❌ Wrong sell price: expected ${expectedSellPrice}, got ${data.gold_earned}`);
        }
        
        // Verify gold addition
        const { data: playerAfter } = await supabase
            .from('players')
            .select('gold')
            .eq('id', testPlayerId)
            .single();
        
        const expectedGold = playerBefore.gold + data.gold_earned;
        if (playerAfter.gold === expectedGold) {
            console.log(`✅ Gold correctly added: ${playerBefore.gold} → ${playerAfter.gold}`);
        } else {
            console.log(`❌ Gold mismatch: expected ${expectedGold}, got ${playerAfter.gold}`);
        }
        
        totalGoldEarned += data.gold_earned;
        
        sellResults.push({
            item,
            goldEarned: data.gold_earned,
            originalCost: data.original_cost,
            success: true
        });
    }
    
    return { sellResults, totalGoldEarned };
}

async function verifyEconomicCycle(purchaseResults, sellResults, totalGoldEarned) {
    console.log('\n📊 Economic Cycle Analysis...');
    
    const totalSpent = purchaseResults.reduce((sum, p) => sum + p.goldSpent, 0);
    const expectedReturn = Math.floor(totalSpent * 0.5);
    const actualReturn = totalGoldEarned;
    const netLoss = totalSpent - actualReturn;
    
    console.log(`Total gold spent: ${totalSpent}`);
    console.log(`Total gold earned: ${actualReturn}`);
    console.log(`Expected return (50%): ${expectedReturn}`);
    console.log(`Net loss: ${netLoss} gold`);
    
    if (Math.abs(actualReturn - expectedReturn) <= purchaseResults.length) {
        // Allow small variance due to minimum 1 gold per item
        console.log('✅ Economic cycle working correctly (50% sell back rate)');
        return true;
    } else {
        console.log(`❌ Economic cycle broken: expected ~${expectedReturn}, got ${actualReturn}`);
        return false;
    }
}

async function cleanupTestPlayer() {
    console.log('\n🧹 Cleaning up test player...');
    
    // Delete in order to respect foreign keys
    await supabase.from('player_inventory').delete().eq('player_id', testPlayerId);
    await supabase.from('player_equipped').delete().eq('player_id', testPlayerId);
    await supabase.from('player_combat_stats').delete().eq('player_id', testPlayerId);
    await supabase.from('player_stats').delete().eq('player_id', testPlayerId);
    await supabase.from('players').delete().eq('id', testPlayerId);
    
    console.log('✅ Test player cleaned up');
}

async function runCompleteEconomyCycleTest() {
    console.log('🚀 Starting Complete Equipment Economy Cycle Test\n');
    
    try {
        // Setup
        await createTestPlayer();
        const equipment = await getAffordableEquipment();
        const testItems = [...equipment.weapons, ...equipment.armor];
        
        if (testItems.length === 0) {
            throw new Error('No affordable equipment found for testing');
        }
        
        console.log(`\n📋 Testing with ${testItems.length} items:`);
        testItems.forEach(item => {
            console.log(`  - ${item.name}: ${item.cost_gold} gold`);
        });
        
        // Test the complete cycle
        const purchaseResults = await testPurchaseFlow(testItems);
        const equipResults = await testEquipFlow(purchaseResults);
        const unequipResults = await testUnequipFlow(equipResults);
        const { sellResults, totalGoldEarned } = await testSellFlow(unequipResults);
        
        // Verify the economic cycle
        const cycleWorking = await verifyEconomicCycle(purchaseResults, sellResults, totalGoldEarned);
        
        console.log('\n🎉 Complete Equipment Economy Cycle Test Results:');
        console.log(`✅ Items purchased: ${purchaseResults.length}`);
        console.log(`✅ Items equipped: ${equipResults.length}`);
        console.log(`✅ Items unequipped: ${unequipResults.length}`);
        console.log(`✅ Items sold: ${sellResults.length}`);
        console.log(`${cycleWorking ? '✅' : '❌'} Economic cycle: ${cycleWorking ? 'WORKING' : 'BROKEN'}`);
        
        if (cycleWorking) {
            console.log('\n🎊 ALL TESTS PASSED! The equipment economy cycle is working correctly.');
        } else {
            console.log('\n💥 TESTS FAILED! There are issues with the equipment economy cycle.');
        }
        
    } catch (error) {
        console.error('\n💥 Test failed with error:', error);
    } finally {
        await cleanupTestPlayer();
    }
}

// Run the test
runCompleteEconomyCycleTest();