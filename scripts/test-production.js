#!/usr/bin/env node

/**
 * Production Testing Script
 * Tests the live production environment at https://agendaiq.vercel.app
 */

const PRODUCTION_URL = 'https://agendaiq.vercel.app';

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 3,
};

// Test utilities
async function fetchWithRetry(url, options = {}, retries = TEST_CONFIG.retries) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TEST_CONFIG.timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`   Retry ${i + 1}/${retries}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Test suites
async function testAvailability() {
  console.log('\n1️⃣ Testing Site Availability');
  
  const endpoints = [
    { path: '/', name: 'Homepage' },
    { path: '/auth/signin', name: 'Sign In Page' },
    { path: '/auth/signup', name: 'Sign Up Page' },
    { path: '/api/auth/check-first-user', name: 'API Health Check' },
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetchWithRetry(`${PRODUCTION_URL}${endpoint.path}`);
      
      if (response.ok) {
        console.log(`   ✅ ${endpoint.name}: ${response.status} OK`);
      } else {
        console.log(`   ❌ ${endpoint.name}: ${response.status} ${response.statusText}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: Failed - ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testPerformance() {
  console.log('\n2️⃣ Testing Performance');
  
  const pages = [
    { path: '/', name: 'Homepage', maxTime: 3000 },
    { path: '/auth/signin', name: 'Sign In', maxTime: 2000 },
  ];
  
  let allPassed = true;
  
  for (const page of pages) {
    try {
      const start = Date.now();
      await fetchWithRetry(`${PRODUCTION_URL}${page.path}`);
      const loadTime = Date.now() - start;
      
      if (loadTime < page.maxTime) {
        console.log(`   ✅ ${page.name}: ${loadTime}ms (< ${page.maxTime}ms)`);
      } else {
        console.log(`   ⚠️ ${page.name}: ${loadTime}ms (> ${page.maxTime}ms)`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ ${page.name}: Failed - ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testAPI() {
  console.log('\n3️⃣ Testing API Endpoints');
  
  const tests = [
    {
      name: 'Check First User',
      method: 'GET',
      path: '/api/auth/check-first-user',
      expectedStatus: 200,
    },
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    try {
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      const response = await fetchWithRetry(`${PRODUCTION_URL}${test.path}`, options);
      
      if (response.status === test.expectedStatus) {
        console.log(`   ✅ ${test.name}: Status ${response.status}`);
      } else {
        console.log(`   ❌ ${test.name}: Expected ${test.expectedStatus}, got ${response.status}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Main test runner
async function runProductionTests() {
  console.log('\n🧪 AgendaIQ Production Testing Suite');
  console.log(`Testing: ${PRODUCTION_URL}\n`);
  
  const results = {
    availability: false,
    performance: false,
    api: false,
  };
  
  try {
    results.availability = await testAvailability();
    results.performance = await testPerformance();
    results.api = await testAPI();
  } catch (error) {
    console.log(`\n❌ Test suite failed: ${error.message}`);
  }
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('========================\n');
  
  let totalPassed = 0;
  let totalTests = 0;
  
  for (const [test, passed] of Object.entries(results)) {
    totalTests++;
    if (passed) totalPassed++;
    
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test.charAt(0).toUpperCase() + test.slice(1)}: ${passed ? 'PASSED' : 'FAILED'}`);
  }
  
  const percentage = Math.round((totalPassed / totalTests) * 100);
  console.log(`\nOverall: ${totalPassed}/${totalTests} tests passed (${percentage}%)`);
  
  if (percentage === 100) {
    console.log('\n🎉 All production tests passed successfully\!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed\!');
    process.exit(1);
  }
}

// Run tests
runProductionTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});