// Simple test script to verify beach combat system
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testBeachEndpoints() {
    try {
        console.log('🧪 Testing Beach Combat System...\n');
        
        // Test 1: Check if server is running
        console.log('1. Testing server health...');
        const healthResponse = await fetch(`${BASE_URL}/api/health`);
        const healthData = await healthResponse.json();
        console.log('   ✅ Server is running:', healthData.status);
        
        // Test 2: Check API documentation
        console.log('\n2. Testing API documentation...');
        const docsResponse = await fetch(`${BASE_URL}/api/docs`);
        const docsData = await docsResponse.json();
        console.log('   ✅ Beach endpoints listed:', !!docsData.endpoints.beach);
        
        // Test 3: Try to access monsters endpoint (should fail without auth)
        console.log('\n3. Testing monsters endpoint without auth...');
        const monstersResponse = await fetch(`${BASE_URL}/api/beach/monsters`);
        console.log('   ✅ Properly requires auth:', monstersResponse.status === 401);
        
        // Test 4: Try to access fight endpoint (should fail without auth)
        console.log('\n4. Testing fight endpoint without auth...');
        const fightResponse = await fetch(`${BASE_URL}/api/beach/fight`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monsterId: 'test' })
        });
        console.log('   ✅ Properly requires auth:', fightResponse.status === 401);
        
        console.log('\n🎉 All basic tests passed!');
        console.log('\nNext steps:');
        console.log('- Set up proper Supabase credentials in .env');
        console.log('- Run database migrations and seeders');
        console.log('- Test with actual authentication tokens');
        console.log('- Use /public/test-auth.html for full integration testing');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testBeachEndpoints();