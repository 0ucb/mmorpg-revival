#!/usr/bin/env node

// Simple test script for the authentication fix
import fetch from 'node-fetch';
import { spawn } from 'child_process';

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';
const TEST_USERNAME = 'testuser';

// Start server in background
console.log('Starting server...');
const server = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
});

// Wait for server to start
await new Promise(resolve => {
    server.stdout.on('data', (data) => {
        if (data.toString().includes('running on port')) {
            console.log('Server started');
            resolve();
        }
    });
});

// Wait a bit more for server to fully initialize
await new Promise(resolve => setTimeout(resolve, 2000));

try {
    console.log('\n=== Testing Authentication Flow ===');
    
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('Health check:', healthResponse.status, healthData);
    
    // Test 2: Session check (should fail - no session)
    console.log('\n2. Testing session endpoint (should fail)...');
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
        credentials: 'include'
    });
    const sessionData = await sessionResponse.json();
    console.log('Session check (no auth):', sessionResponse.status, sessionData);
    
    // Test 3: Registration
    console.log('\n3. Testing registration...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            username: TEST_USERNAME,
            characterClass: 'warrior'
        })
    });
    const registerData = await registerResponse.json();
    console.log('Registration:', registerResponse.status, registerData);
    
    if (registerResponse.ok) {
        // Test 4: Login
        console.log('\n4. Testing login...');
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })
        });
        const loginData = await loginResponse.json();
        console.log('Login:', loginResponse.status, loginData);
        
        if (loginResponse.ok) {
            // Extract cookies for subsequent requests
            const cookies = loginResponse.headers.get('set-cookie');
            
            // Test 5: Session check (should succeed)
            console.log('\n5. Testing session endpoint (should succeed)...');
            const sessionResponse2 = await fetch(`${BASE_URL}/api/auth/session`, {
                credentials: 'include',
                headers: {
                    'Cookie': cookies
                }
            });
            const sessionData2 = await sessionResponse2.json();
            console.log('Session check (with auth):', sessionResponse2.status, sessionData2);
            
            // Test 6: Equipment endpoint (to verify API integration)
            console.log('\n6. Testing equipment endpoint...');
            const equipmentResponse = await fetch(`${BASE_URL}/api/equipment`, {
                credentials: 'include',
                headers: {
                    'Cookie': cookies
                }
            });
            const equipmentData = await equipmentResponse.json();
            console.log('Equipment API:', equipmentResponse.status, equipmentData);
            
            // Test 7: Logout
            console.log('\n7. Testing logout...');
            const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Cookie': cookies
                }
            });
            const logoutData = await logoutResponse.json();
            console.log('Logout:', logoutResponse.status, logoutData);
        }
    }
    
    console.log('\n=== Test Complete ===');
    
} catch (error) {
    console.error('Test error:', error);
} finally {
    // Kill server
    console.log('\nStopping server...');
    server.kill();
    process.exit(0);
}