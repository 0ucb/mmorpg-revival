import { 
    getPrayingEfficiency,
    calculateStatGains,
    distributeStatsWeighted,
    calculateStatGainsWithDiminishing
} from './server/config/game.js';

console.log('=== Testing Temple Prayer System ===\n');

// Test 1: Efficiency calculation
console.log('1. Testing Prayer Efficiency:');
const efficiencyTests = [
    { stats: 500, expected: 3.5 },
    { stats: 1100, expected: 2.5 },
    { stats: 1300, expected: 1.5 },
    { stats: 1600, expected: 1.1 }
];

efficiencyTests.forEach(({ stats, expected }) => {
    const actual = getPrayingEfficiency(stats);
    console.log(`   Stats: ${stats} -> Efficiency: ${actual} (expected: ${expected}) ${actual === expected ? '✓' : '✗'}`);
});

// Test 2: Stat distribution
console.log('\n2. Testing Stat Distribution:');
const distributionTest = distributeStatsWeighted(10);
const total = distributionTest.strength + distributionTest.speed + distributionTest.intelligence;
console.log(`   Distributed 10 points: STR=${distributionTest.strength}, SPD=${distributionTest.speed}, INT=${distributionTest.intelligence}`);
console.log(`   Total: ${total} (expected: 10) ${total === 10 ? '✓' : '✗'}`);

// Test 3: Basic stat gains
console.log('\n3. Testing Basic Stat Gains:');
const basicTests = [
    { mana: 5, stats: 500 },
    { mana: 50, stats: 500 },
    { mana: 4, stats: 500 } // Should give 0
];

basicTests.forEach(({ mana, stats }) => {
    const result = calculateStatGains(stats, mana);
    const total = result.strength + result.speed + result.intelligence;
    console.log(`   ${mana} mana at ${stats} stats -> Total gains: ${total}, STR=${result.strength}, SPD=${result.speed}, INT=${result.intelligence}`);
});

// Test 4: Diminishing returns
console.log('\n4. Testing Diminishing Returns:');
const diminishingTest = calculateStatGainsWithDiminishing(1000, 500);
console.log(`   500 mana at 1000 stats -> Total gains: ${diminishingTest.totalGains}, STR=${diminishingTest.strength}, SPD=${diminishingTest.speed}, INT=${diminishingTest.intelligence}`);

// Test 5: Efficiency ranges
console.log('\n5. Testing Efficiency Ranges (100 prayers each):');
const rangeTests = [
    { stats: 500, name: 'Low Stats (High Efficiency)' },
    { stats: 1200, name: 'Medium Stats (Medium Efficiency)' },
    { stats: 1600, name: 'High Stats (Low Efficiency)' }
];

rangeTests.forEach(({ stats, name }) => {
    let totalGains = 0;
    const numTests = 100;
    
    for (let i = 0; i < numTests; i++) {
        const result = calculateStatGains(stats, 50);
        totalGains += result.strength + result.speed + result.intelligence;
    }
    
    const average = totalGains / numTests;
    const expectedEfficiency = getPrayingEfficiency(stats);
    
    console.log(`   ${name}: Average ${average.toFixed(2)} per 50 mana (expected ~${expectedEfficiency})`);
});

console.log('\n=== Temple Prayer System Tests Complete ===');

// Quick API endpoint test (if server is running)
console.log('\n6. API Test Instructions:');
console.log('   Start server with: npm run dev');
console.log('   Register/login to get auth token');
console.log('   Test temple endpoints:');
console.log('');
console.log('   # Get efficiency:');
console.log('   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/temple/efficiency');
console.log('');
console.log('   # Pray with 5 mana:');
console.log('   curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \\');
console.log('        -d \'{"manaAmount": "5"}\' http://localhost:3000/api/temple/pray');
console.log('');
console.log('   # Pray with 50 mana:');
console.log('   curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \\');
console.log('        -d \'{"manaAmount": "50"}\' http://localhost:3000/api/temple/pray');
console.log('');
console.log('   # Pray with all mana:');
console.log('   curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \\');
console.log('        -d \'{"manaAmount": "all"}\' http://localhost:3000/api/temple/pray');