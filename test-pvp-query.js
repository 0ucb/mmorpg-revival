import { supabaseAdmin } from './server/config/supabase.js';

async function testPvPQuery() {
  try {
    console.log('Testing PvP query issue...\n');
    
    // Test the exact query from the targets endpoint
    console.log('1. Testing original query with foreign key reference:');
    const { data, error } = await supabaseAdmin
      .from('players')
      .select(`
        id, username, level, health, max_health,
        pvp_protection!pvp_protection_player_id_fkey(protected_until, last_attacker_id)
      `)
      .limit(1);
      
    if (error) {
      console.log('❌ Query error:', error.message);
      console.log('Error code:', error.code);
      console.log('Error hint:', error.hint);
      
      // Try simplified query without the join
      console.log('\n2. Trying without join:');
      const { data: simple, error: simpleError } = await supabaseAdmin
        .from('players')
        .select('id, username, level, health, max_health')
        .limit(1);
        
      if (simpleError) {
        console.log('❌ Simple query also failed:', simpleError.message);
      } else {
        console.log('✅ Simple query works');
        
        // Try correct join syntax without foreign key name
        console.log('\n3. Trying standard join syntax:');
        const { data: joined, error: joinError } = await supabaseAdmin
          .from('players')
          .select(`
            id, username, level, health, max_health,
            pvp_protection(protected_until, last_attacker_id)
          `)
          .limit(1);
          
        if (joinError) {
          console.log('❌ Join error:', joinError.message);
          
          // Try with left join
          console.log('\n4. Trying left join syntax:');
          const { data: leftJoined, error: leftJoinError } = await supabaseAdmin
            .from('players')
            .select(`
              id, username, level, health, max_health,
              pvp_protection!left(protected_until, last_attacker_id)
            `)
            .limit(1);
            
          if (leftJoinError) {
            console.log('❌ Left join error:', leftJoinError.message);
          } else {
            console.log('✅ Left join works!');
            console.log('Data:', JSON.stringify(leftJoined, null, 2));
          }
        } else {
          console.log('✅ Standard join syntax works!');
          console.log('Data:', JSON.stringify(joined, null, 2));
        }
      }
    } else {
      console.log('✅ Original query works');
      console.log('Data:', JSON.stringify(data, null, 2));
    }
    
    // Test if protection table has correct foreign key
    console.log('\n5. Checking protection table structure:');
    const { data: protection, error: protectionError } = await supabaseAdmin
      .from('pvp_protection')
      .select('*')
      .limit(1);
      
    if (protectionError) {
      console.log('❌ Protection table error:', protectionError.message);
    } else {
      console.log('✅ Protection table accessible');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
  
  process.exit(0);
}

testPvPQuery();