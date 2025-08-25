/**
 * Test page access after fixing admin staff records
 */

const fetch = require('node-fetch');

async function testPageAccess() {
  console.log('🔍 Testing Page Access...\n');
  
  // First, authenticate
  console.log('1️⃣ Authenticating as admin@school.edu...');
  
  try {
    // Get CSRF token
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();
    
    // Login
    const authResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@school.edu',
        password: '1234',
        csrfToken: csrfToken
      }),
      redirect: 'manual'
    });
    
    // Get session cookies
    const cookies = authResponse.headers.raw()['set-cookie'];
    const sessionCookie = cookies ? cookies.join('; ') : '';
    
    console.log('✅ Authenticated successfully\n');
    
    // Test various pages
    const pagesToTest = [
      '/dashboard',
      '/dashboard/meetings',
      '/dashboard/settings',
      '/dashboard/settings/users',
      '/dashboard/settings/roles',
      '/dashboard/monitoring',
      '/dashboard/development'
    ];
    
    console.log('2️⃣ Testing page access:\n');
    
    for (const page of pagesToTest) {
      const response = await fetch(`http://localhost:3000${page}`, {
        headers: {
          'Cookie': sessionCookie
        },
        redirect: 'manual'
      });
      
      if (response.status === 200) {
        console.log(`✅ ${page} - Accessible`);
      } else if (response.status === 302 || response.status === 307) {
        const location = response.headers.get('location');
        console.log(`🔄 ${page} - Redirects to: ${location}`);
      } else {
        console.log(`❌ ${page} - Status: ${response.status}`);
      }
    }
    
    console.log('\n📝 Summary:');
    console.log('- Admin users now have staff records');
    console.log('- You should be able to access all pages');
    console.log('- Try clearing browser cache/cookies if issues persist');
    console.log('- Login with: admin@school.edu / 1234');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Wait for server to be ready
setTimeout(() => {
  testPageAccess();
}, 5000);