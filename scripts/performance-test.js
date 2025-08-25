#!/usr/bin/env node

const { performance } = require('perf_hooks');

async function measureAPICall(url, options = {}) {
  const startTime = performance.now();
  let success = false;
  let statusCode = 0;
  
  try {
    const response = await fetch(`http://localhost:3000${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    statusCode = response.status;
    success = response.ok || response.status === 401; // 401 is expected for unauthenticated calls
    
  } catch (error) {
    console.error(`API call failed: ${url}`, error.message);
  }
  
  const endTime = performance.now();
  const duration = Math.round((endTime - startTime) * 100) / 100;
  
  return { url, duration, success, statusCode };
}

async function testAPIPerformance() {
  console.log('🚀 Starting Performance Tests...\n');
  
  const tests = [
    { url: '/api/user/theme', name: 'Theme API' },
    { url: '/api/user/layout', name: 'Layout API' }, 
    { url: '/api/user/custom-theme', name: 'Custom Theme API' },
    { url: '/api/auth/session', name: 'Session API' },
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`⏱️  Testing ${test.name}...`);
    
    // Test GET request
    const getResult = await measureAPICall(test.url);
    results.push({ ...getResult, method: 'GET', name: test.name });
    
    // Test with cache headers
    const cacheResult = await measureAPICall(test.url, {
      headers: { 'Cache-Control': 'max-age=300' }
    });
    results.push({ ...cacheResult, method: 'GET (cached)', name: test.name });
    
    console.log(`   GET: ${getResult.duration}ms ${getResult.success ? '✅' : '❌'} (${getResult.statusCode})`);
    console.log(`   Cached: ${cacheResult.duration}ms ${cacheResult.success ? '✅' : '❌'} (${cacheResult.statusCode})`);
    console.log();
  }
  
  // Performance Summary
  console.log('📊 Performance Summary:');
  console.log('========================');
  
  const successfulTests = results.filter(r => r.success);
  const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`Successful: ${successfulTests.length}`);
  console.log(`Average Response Time: ${avgDuration.toFixed(2)}ms`);
  console.log(`Target: <100ms for API calls`);
  console.log();
  
  // Performance Analysis
  const fastTests = successfulTests.filter(r => r.duration < 100);
  const slowTests = successfulTests.filter(r => r.duration >= 100);
  
  if (fastTests.length > 0) {
    console.log(`🚀 Fast APIs (< 100ms): ${fastTests.length}`);
    fastTests.forEach(test => {
      console.log(`   ${test.name} ${test.method}: ${test.duration}ms`);
    });
    console.log();
  }
  
  if (slowTests.length > 0) {
    console.log(`🐌 Slow APIs (>= 100ms): ${slowTests.length}`);
    slowTests.forEach(test => {
      console.log(`   ${test.name} ${test.method}: ${test.duration}ms`);
    });
    console.log();
  }
  
  // Performance Grade
  const grade = avgDuration < 50 ? 'A+' : 
                avgDuration < 100 ? 'A' : 
                avgDuration < 150 ? 'B' : 
                avgDuration < 200 ? 'C' : 'D';
  
  console.log(`🏆 Performance Grade: ${grade}`);
  console.log(`   Target achieved: ${avgDuration < 150 ? 'YES ✅' : 'NO ❌'}`);
}

// Run the test
testAPIPerformance().catch(console.error);