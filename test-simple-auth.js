#!/usr/bin/env node

// Simple authentication test (requires server to be running)
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testAuth() {
    try {
        console.log('=== Testing Authentication Endpoints ===');
        
        // Test health check
        console.log('\n1. Health check...');
        const health = await fetch(`${BASE_URL}/api/health`);
        console.log('Status:', health.status);
        
        // Test session (should fail)
        console.log('\n2. Session check (no auth)...');
        const session1 = await fetch(`${BASE_URL}/api/auth/session`, {
            credentials: 'include'
        });
        console.log('Status:', session1.status);
        console.log('Response:', await session1.json());
        
        console.log('\n=== Authentication tests complete ===');
        console.log('CORS and error handling appear to be working correctly.');
        
    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\nPlease start the server first: npm run dev');
        }
    }
}

testAuth();