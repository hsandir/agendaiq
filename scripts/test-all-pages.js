#!/usr/bin/env node

const http = require('http');

// Define all pages to test
const pages = [
  // Auth pages
  '/auth/signin',
  '/auth/signup',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/error',
  '/auth/debug',
  
  // Dashboard pages
  '/dashboard',
  '/dashboard/meetings',
  '/dashboard/meetings/new',
  '/dashboard/development',
  '/dashboard/development/performance',
  '/dashboard/development/permissions-check',
  '/dashboard/monitoring',
  '/dashboard/monitoring/cicd',
  '/dashboard/system',
  '/dashboard/system/alerts',
  '/dashboard/system/backup',
  '/dashboard/system/database',
  '/dashboard/system/dependencies',
  '/dashboard/system/health',
  '/dashboard/system/health-overview',
  '/dashboard/system/lint',
  '/dashboard/system/logs',
  '/dashboard/system/migration',
  '/dashboard/system/mock-data-tracker',
  '/dashboard/system/server',
  '/dashboard/system/updates',
  '/dashboard/tests',
  
  // Settings pages
  '/dashboard/settings',
  '/dashboard/settings/profile',
  '/dashboard/settings/security/2fa',
  '/dashboard/settings/interface',
  '/dashboard/settings/layout',
  '/dashboard/settings/theme',
  '/dashboard/settings/audit-logs',
  '/dashboard/settings/backup',
  '/dashboard/settings/staff-upload',
  '/dashboard/settings/setup',
  '/dashboard/settings/school',
  '/dashboard/settings/role-hierarchy',
  '/dashboard/settings/role-hierarchy/roles',
  '/dashboard/settings/role-hierarchy/user-assignment',
  '/dashboard/settings/role-hierarchy/visualization',
  '/dashboard/settings/meeting-templates',
  '/dashboard/settings/zoom-integration',
  '/dashboard/settings/zoom-user-preferences',
  
  // Meeting Intelligence pages
  '/dashboard/meeting-intelligence',
  '/dashboard/meeting-intelligence/action-items',
  '/dashboard/meeting-intelligence/analytics',
  '/dashboard/meeting-intelligence/continuity',
  '/dashboard/meeting-intelligence/role-tasks',
  '/dashboard/meeting-intelligence/search',
  
  // API Health checks
  '/api/health',
  '/api/system/health',
  '/api/system/status',
  
  // Setup pages
  '/setup/district',
  '/verify-email'
];

// Test configuration
const BASE_URL = 'http://localhost:3000';
const results = {
  success: [],
  redirect: [],
  error: [],
  failed: []
};

// Function to test a single page
function testPage(path) {
  return new Promise((resolve) => {
    const url = BASE_URL + path;
    
    http.get(url, (res) => {
      const status = res.statusCode;
      
      if (status >= 200 && status < 300) {
        results.success.push({ path, status });
        console.log(`✅ ${path} - ${status}`);
      } else if (status >= 300 && status < 400) {
        results.redirect.push({ path, status });
        console.log(`↪️  ${path} - ${status} (redirect)`);
      } else if (status >= 400 && status < 500) {
        results.error.push({ path, status });
        console.log(`⚠️  ${path} - ${status} (client error)`);
      } else {
        results.failed.push({ path, status });
        console.log(`❌ ${path} - ${status} (server error)`);
      }
      
      resolve();
    }).on('error', (err) => {
      results.failed.push({ path, error: err.message });
      console.log(`❌ ${path} - Error: ${err.message}`);
      resolve();
    });
  });
}

// Main test function
async function testAllPages() {
  console.log('🧪 Testing All Pages...\n');
  console.log(`Testing ${pages.length} pages...\n`);
  
  // Test pages in batches to avoid overwhelming the server
  const batchSize = 5;
  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    await Promise.all(batch.map(testPage));
    
    // Small delay between batches
    if (i + batchSize < pages.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`✅ Success (2xx): ${results.success.length} pages`);
  console.log(`↪️  Redirect (3xx): ${results.redirect.length} pages`);
  console.log(`⚠️  Client Error (4xx): ${results.error.length} pages`);
  console.log(`❌ Server Error (5xx): ${results.failed.length} pages`);
  console.log(`📝 Total Tested: ${pages.length} pages`);
  
  // List any failures
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Pages:');
    results.failed.forEach(({ path, status, error }) => {
      console.log(`  - ${path}: ${status || error}`);
    });
  }
  
  // List any client errors
  if (results.error.length > 0) {
    console.log('\n⚠️  Client Error Pages:');
    results.error.forEach(({ path, status }) => {
      console.log(`  - ${path}: ${status}`);
    });
  }
  
  // Determine overall status
  const hasServerErrors = results.failed.length > 0;
  const hasClientErrors = results.error.length > 0;
  
  if (!hasServerErrors && !hasClientErrors) {
    console.log('\n✅ All pages are working correctly!');
    process.exit(0);
  } else if (hasServerErrors) {
    console.log('\n❌ Some pages have server errors. Please fix before deploying.');
    process.exit(1);
  } else {
    console.log('\n⚠️  Some pages have client errors but system is functional.');
    process.exit(0);
  }
}

// Check if server is running
http.get(BASE_URL, (res) => {
  console.log('✅ Server is running on port 3000\n');
  testAllPages();
}).on('error', (err) => {
  console.error('❌ Server is not running on port 3000');
  console.error('Please start the server with: npm run dev');
  process.exit(1);
});