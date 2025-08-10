#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, path, method = 'GET', body = null) {
  const start = Date.now();
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    const elapsed = Date.now() - start;
    const status = response.status;
    
    console.log(`${name}: ${elapsed}ms (Status: ${status})`);
    return { name, elapsed, status };
  } catch (error) {
    const elapsed = Date.now() - start;
    console.log(`${name}: FAILED after ${elapsed}ms - ${error.message}`);
    return { name, elapsed, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 API Performance Test\n');
  
  const results = [];
  
  // Test public endpoints
  results.push(await testEndpoint('Health Check', '/api/health'));
  results.push(await testEndpoint('Setup Check', '/api/setup/check'));
  
  // Test auth endpoint
  results.push(await testEndpoint('Auth Signin', '/api/auth/signin', 'POST', {
    email: 'admin@school.edu',
    password: '1234'
  }));
  
  console.log('\n📊 Summary:');
  const avgTime = results.reduce((sum, r) => sum + (r.elapsed || 0), 0) / results.length;
  console.log(`Average response time: ${Math.round(avgTime)}ms`);
  
  const slow = results.filter(r => r.elapsed > 1000);
  if (slow.length > 0) {
    console.log(`\n⚠️ Slow endpoints (>1000ms):`);
    slow.forEach(r => console.log(`  - ${r.name}: ${r.elapsed}ms`));
  }
}

runTests().catch(console.error);