const fetch = require('node-fetch');

// Test edilecek tüm sayfalar
const pages = [
  // Dashboard
  '/dashboard',
  '/dashboard/meetings',
  '/dashboard/monitoring',
  '/dashboard/development',
  '/dashboard/tests',
  
  // System pages
  '/dashboard/system',
  '/dashboard/system/health',
  '/dashboard/system/logs',
  '/dashboard/system/database',
  '/dashboard/system/server',
  '/dashboard/system/alerts',
  '/dashboard/system/backup',
  '/dashboard/system/lint',
  '/dashboard/system/migration',
  '/dashboard/system/mock-data-tracker',
  '/dashboard/system/updates',
  '/dashboard/system/dependencies',
  '/dashboard/system/health-overview',
  
  // Settings pages
  '/dashboard/settings',
  '/dashboard/settings/admin',
  '/dashboard/settings/roles',
  '/dashboard/settings/users',
  '/dashboard/settings/audit-logs',
  '/dashboard/settings/backup',
  '/dashboard/settings/interface',
  '/dashboard/settings/layout',
  '/dashboard/settings/monitoring', // Bu yeni eklendi
  '/dashboard/settings/notifications',
  '/dashboard/settings/permissions',
  '/dashboard/settings/profile',
  '/dashboard/settings/role-hierarchy',
  '/dashboard/settings/school',
  '/dashboard/settings/security',
  '/dashboard/settings/setup',
  '/dashboard/settings/staff-upload',
  '/dashboard/settings/system',
  '/dashboard/settings/theme',
  '/dashboard/settings/zoom-integration',
  
  // Meeting management
  '/dashboard/settings/meeting-management',
  '/dashboard/settings/meeting-templates',
  '/dashboard/settings/meeting-permissions',
  '/dashboard/settings/meeting-audit',
  '/dashboard/settings/meeting-help',
  
  // Meeting intelligence
  '/dashboard/meeting-intelligence',
  '/dashboard/meeting-intelligence/action-items',
  '/dashboard/meeting-intelligence/analytics',
  '/dashboard/meeting-intelligence/continuity',
  '/dashboard/meeting-intelligence/role-tasks',
  '/dashboard/meeting-intelligence/search',
];

async function testPage(url) {
  try {
    const response = await fetch(`http://localhost:3000${url}`, {
      redirect: 'manual',
      headers: {
        'Cookie': '' // Boş cookie ile test ediyoruz (auth yok)
      }
    });
    
    const status = response.status;
    const location = response.headers.get('location');
    
    if (status === 307 && location && location.includes('/auth/signin')) {
      return { url, status: 'REDIRECT TO AUTH', code: status };
    } else if (status === 200) {
      return { url, status: 'OK', code: status };
    } else if (status === 404) {
      return { url, status: 'NOT FOUND', code: status };
    } else if (status === 403) {
      return { url, status: 'FORBIDDEN', code: status };
    } else if (status === 500) {
      return { url, status: 'SERVER ERROR', code: status };
    } else {
      return { url, status: 'OTHER', code: status, location };
    }
  } catch (error) {
    return { url, status: 'ERROR', error: error.message };
  }
}

async function testAllPages() {
  console.log('Testing all pages without authentication...\n');
  console.log('='.repeat(80));
  
  const results = {
    authRequired: [],
    notFound: [],
    serverError: [],
    ok: [],
    other: []
  };
  
  for (const page of pages) {
    const result = await testPage(page);
    
    if (result.status === 'REDIRECT TO AUTH') {
      results.authRequired.push(result.url);
      console.log(`✅ ${page} - Requires authentication (OK)`);
    } else if (result.status === 'NOT FOUND') {
      results.notFound.push(result.url);
      console.log(`❌ ${page} - Page not found (404)`);
    } else if (result.status === 'SERVER ERROR') {
      results.serverError.push(result.url);
      console.log(`🔥 ${page} - Server error (500)`);
    } else if (result.status === 'OK') {
      results.ok.push(result.url);
      console.log(`⚠️  ${page} - Accessible without auth (200)`);
    } else {
      results.other.push({ ...result });
      console.log(`❓ ${page} - ${result.status} (${result.code})`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY:');
  console.log('='.repeat(80));
  console.log(`✅ Pages requiring auth: ${results.authRequired.length}`);
  console.log(`❌ Pages not found: ${results.notFound.length}`);
  console.log(`🔥 Server errors: ${results.serverError.length}`);
  console.log(`⚠️  Public pages: ${results.ok.length}`);
  console.log(`❓ Other: ${results.other.length}`);
  
  if (results.notFound.length > 0) {
    console.log('\n❌ NOT FOUND PAGES:');
    results.notFound.forEach(p => console.log(`  - ${p}`));
  }
  
  if (results.serverError.length > 0) {
    console.log('\n🔥 SERVER ERROR PAGES:');
    results.serverError.forEach(p => console.log(`  - ${p}`));
  }
  
  if (results.ok.length > 0) {
    console.log('\n⚠️  PUBLIC PAGES (should require auth):');
    results.ok.forEach(p => console.log(`  - ${p}`));
  }
  
  if (results.other.length > 0) {
    console.log('\n❓ OTHER ISSUES:');
    results.other.forEach(p => console.log(`  - ${p.url}: ${p.status} (${p.code})`));
  }
}

testAllPages().catch(console.error);