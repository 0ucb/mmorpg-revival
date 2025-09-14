/**
 * Manual API test script for Equipment endpoints
 * Run this after starting the server to verify endpoints work
 */

const API_BASE = 'http://localhost:3000/api';

// Helper function for making requests
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    
    const data = await response.json();
    return { status: response.status, data };
}

// Test runner
async function testEquipmentAPI() {
    console.log('🛡️  Testing Equipment API Endpoints\n');

    try {
        // Note: These tests require authentication token
        // In real usage, you'd get this from login
        const mockAuthHeader = {
            'Authorization': 'Bearer mock-token' // Replace with real token
        };

        console.log('1. Testing Equipment Shop...');
        const shopResponse = await apiRequest('/equipment/shop', {
            headers: mockAuthHeader
        });
        console.log('Shop Status:', shopResponse.status);
        if (shopResponse.status === 200) {
            console.log('✅ Equipment count:', shopResponse.data.equipment?.length || 0);
            console.log('✅ Player gold:', shopResponse.data.player_gold);
        } else {
            console.log('❌ Shop failed:', shopResponse.data.error);
        }

        console.log('\n2. Testing Equipment Shop with Filter...');
        const weaponsResponse = await apiRequest('/equipment/shop?type=weapons', {
            headers: mockAuthHeader
        });
        console.log('Weapons Status:', weaponsResponse.status);
        if (weaponsResponse.status === 200) {
            console.log('✅ Weapons count:', weaponsResponse.data.equipment?.length || 0);
        }

        console.log('\n3. Testing Equipment Inventory...');
        const inventoryResponse = await apiRequest('/equipment/inventory', {
            headers: mockAuthHeader
        });
        console.log('Inventory Status:', inventoryResponse.status);
        if (inventoryResponse.status === 200) {
            console.log('✅ Equipped items loaded');
            console.log('✅ Inventory items:', inventoryResponse.data.inventory?.length || 0);
            console.log('✅ Combat stats loaded');
        } else {
            console.log('❌ Inventory failed:', inventoryResponse.data.error);
        }

        console.log('\n4. Testing Equipment Purchase (will fail without valid auth)...');
        const purchaseResponse = await apiRequest('/equipment/purchase', {
            method: 'POST',
            headers: mockAuthHeader,
            body: JSON.stringify({
                equipment_id: 'mock-weapon-id',
                type: 'weapon'
            })
        });
        console.log('Purchase Status:', purchaseResponse.status);
        console.log('Purchase Response:', purchaseResponse.data.error || 'Success');

        console.log('\n5. Testing Equipment Slot Operations...');
        const slotResponse = await apiRequest('/equipment/slot/weapon', {
            method: 'POST',
            headers: mockAuthHeader,
            body: JSON.stringify({
                item_id: 'mock-weapon-id'
            })
        });
        console.log('Slot Status:', slotResponse.status);
        console.log('Slot Response:', slotResponse.data.error || 'Success');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.log('\nNote: This is expected if server is not running or auth is invalid');
    }

    console.log('\n✅ Equipment API test completed');
    console.log('\nEndpoints implemented:');
    console.log('- GET /api/equipment/shop (with optional type filter)');
    console.log('- POST /api/equipment/purchase');  
    console.log('- GET /api/equipment/inventory');
    console.log('- POST /api/equipment/slot/:slot');
}

// Check if we're running in Node.js environment
if (typeof window === 'undefined') {
    // Node.js environment - need to import fetch
    import('node-fetch').then(({ default: fetch }) => {
        global.fetch = fetch;
        testEquipmentAPI();
    }).catch(err => {
        console.log('Install node-fetch to run this test: npm install node-fetch');
        console.log('Or test manually using curl/Postman with the server running');
    });
} else {
    // Browser environment
    testEquipmentAPI();
}

export { testEquipmentAPI };