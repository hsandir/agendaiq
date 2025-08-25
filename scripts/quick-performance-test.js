#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

// Public pages to test (no auth required)
const PAGES_TO_TEST = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/api/health'
];

// Performance thresholds (in ms)
const THRESHOLDS = {
  response: 1000,  // Response should come in under 1s
  critical: 3000   // Critical threshold at 3s
};

class SimplePerformanceTest {
  constructor() {
    this.results = [];
  }

  async testEndpoint(path) {
    const url = `${BASE_URL}${path}`;
    console.log(`\n📊 Testing: ${path}`);
    
    const startTime = Date.now();
    const result = {
      path,
      url,
      timestamp: new Date().toISOString(),
      success: false,
      responseTime: 0,
      statusCode: null,
      error: null
    };

    return new Promise((resolve) => {
      const request = http.get(url, { timeout: TIMEOUT }, (response) => {
        result.statusCode = response.statusCode;
        result.responseTime = Date.now() - startTime;
        result.success = response.statusCode < 400;
        
        // Consume response data
        response.on('data', () => {});
        response.on('end', () => {
          this.analyzeResult(result);
          this.results.push(result);
          resolve(result);
        });
      });

      request.on('error', (error) => {
        result.error = error.message;
        result.responseTime = Date.now() - startTime;
        console.error(`  ❌ Error: ${error.message}`);
        this.results.push(result);
        resolve(result);
      });

      request.on('timeout', () => {
        request.destroy();
        result.error = 'Request timeout';
        result.responseTime = TIMEOUT;
        console.error(`  ❌ Timeout after ${TIMEOUT}ms`);
        this.results.push(result);
        resolve(result);
      });
    });
  }

  analyzeResult(result) {
    if (result.error) {
      return;
    }

    const status = result.statusCode < 400 ? '✅' : '❌';
    console.log(`  ${status} Status: ${result.statusCode}`);
    
    if (result.responseTime < THRESHOLDS.response) {
      console.log(`  ✅ Response time: ${result.responseTime}ms`);
    } else if (result.responseTime < THRESHOLDS.critical) {
      console.log(`  ⚠️  Slow response: ${result.responseTime}ms (threshold: ${THRESHOLDS.response}ms)`);
    } else {
      console.log(`  ❌ Critical: ${result.responseTime}ms (threshold: ${THRESHOLDS.critical}ms)`);
    }
  }

  async testDashboardRedirect() {
    console.log('\n📊 Testing: Dashboard redirect');
    const url = `${BASE_URL}/dashboard`;
    
    return new Promise((resolve) => {
      http.get(url, { timeout: TIMEOUT }, (response) => {
        const result = {
          path: '/dashboard',
          statusCode: response.statusCode,
          location: response.headers.location,
          success: response.statusCode === 307 || response.statusCode === 302
        };
        
        if (result.success) {
          console.log(`  ✅ Redirects to: ${result.location}`);
        } else {
          console.log(`  ❌ Unexpected status: ${result.statusCode}`);
        }
        
        resolve(result);
      }).on('error', (error) => {
        console.error(`  ❌ Error: ${error.message}`);
        resolve({ error: error.message });
      });
    });
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(60));
    
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const avgResponseTime = Math.round(
      this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length
    );
    const slowest = this.results.reduce((max, r) => 
      r.responseTime > max.responseTime ? r : max
    );
    const fastest = this.results.reduce((min, r) => 
      r.responseTime < min.responseTime ? r : min
    );

    console.log(`Total Endpoints: ${this.results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Average Response Time: ${avgResponseTime}ms`);
    console.log(`Fastest: ${fastest.path} (${fastest.responseTime}ms)`);
    console.log(`Slowest: ${slowest.path} (${slowest.responseTime}ms)`);
    
    // Recommendations
    console.log('\n📋 Recommendations:');
    if (avgResponseTime > THRESHOLDS.response) {
      console.log('• Overall response times are slow. Check server performance.');
    }
    
    const slowPages = this.results.filter(r => r.responseTime > THRESHOLDS.response);
    if (slowPages.length > 0) {
      console.log(`• Optimize ${slowPages.length} slow endpoints: ${slowPages.map(p => p.path).join(', ')}`);
    }
    
    const errorPages = this.results.filter(r => r.error);
    if (errorPages.length > 0) {
      console.log(`• Fix errors on ${errorPages.length} endpoints: ${errorPages.map(p => p.path).join(', ')}`);
    }

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        successful,
        failed,
        avgResponseTime,
        fastest: fastest.path,
        slowest: slowest.path
      },
      results: this.results
    };
    
    const reportPath = path.join(process.cwd(), 'performance-quick-test.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to: ${reportPath}`);
    
    return report;
  }

  async run() {
    console.log('🚀 Starting Quick Performance Test');
    console.log(`Testing: ${BASE_URL}`);
    
    // Test each endpoint
    for (const page of PAGES_TO_TEST) {
      await this.testEndpoint(page);
    }
    
    // Test dashboard redirect
    await this.testDashboardRedirect();
    
    // Generate report
    const report = this.generateReport();
    
    // Exit with appropriate code
    const hasFailures = this.results.some(r => !r.success || r.error);
    const hasCriticalPerformance = this.results.some(r => r.responseTime > THRESHOLDS.critical);
    
    if (hasFailures || hasCriticalPerformance) {
      console.log('\n❌ Performance test failed');
      process.exit(1);
    } else {
      console.log('\n✅ Performance test passed');
      process.exit(0);
    }
  }
}

// Check if server is running
http.get(BASE_URL, (res) => {
  console.log('✅ Server is running');
  const test = new SimplePerformanceTest();
  test.run();
}).on('error', (err) => {
  console.error(`❌ Server not running at ${BASE_URL}`);
  console.error('Please start the server with: npm run dev');
  process.exit(1);
});