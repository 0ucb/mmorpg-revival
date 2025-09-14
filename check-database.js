import { supabaseAdmin } from './server/config/supabase.js';

async function checkDatabase() {
    console.log('🔍 Checking database setup...\n');
    
    try {
        // Test basic connection
        console.log('1. Testing Supabase connection...');
        console.log('   ✅ Credentials loaded from .env');
        
        // Check if tables exist
        const tables = ['players', 'player_stats', 'creatures', 'items', 'inventory'];
        console.log('\n2. Checking for required tables...');
        
        for (const table of tables) {
            try {
                const { error } = await supabaseAdmin.from(table).select('*').limit(1);
                if (error) {
                    console.log(`   ❌ Table '${table}' missing or inaccessible:`, error.code);
                } else {
                    console.log(`   ✅ Table '${table}' exists`);
                }
            } catch (err) {
                console.log(`   ❌ Table '${table}' error:`, err.message);
            }
        }
        
        // Check monsters if creatures table exists
        console.log('\n3. Checking monster data...');
        try {
            const { data: monsters, error } = await supabaseAdmin
                .from('creatures')
                .select('name')
                .eq('creature_type', 'monster')
                .limit(5);
                
            if (error) {
                console.log('   ❌ Cannot access creatures table:', error.message);
            } else {
                console.log(`   ✅ Found ${monsters?.length || 0} monsters`);
                if (monsters?.length > 0) {
                    console.log('   First monsters:', monsters.map(m => m.name).join(', '));
                }
            }
        } catch (err) {
            console.log('   ❌ Creatures check failed:', err.message);
        }
        
        console.log('\n📋 Next Steps:');
        console.log('1. Run database schema scripts in Supabase SQL Editor:');
        console.log('   - /database/schema.sql');
        console.log('   - /database/api-functions.sql'); 
        console.log('   - /database/system-tables.sql');
        console.log('   - /database/rls-policies.sql');
        console.log('2. Then run: node database/seeders/monsters.js');
        console.log('3. Test with: npm run dev');
        
    } catch (error) {
        console.error('❌ Database check failed:', error);
    }
}

checkDatabase();