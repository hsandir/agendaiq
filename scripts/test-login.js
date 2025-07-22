const https = require('https');
const http = require('http');

// Login test function
async function testLogin() {
  try {
    console.log('🔐 Testing admin login...');
    
    // First get CSRF token
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();
    console.log('✅ CSRF token obtained:', csrfToken.substring(0, 10) + '...');
    
    // Test login
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-Token': csrfToken
      },
      body: new URLSearchParams({
        email: 'admin@cjcp.edu',
        password: 'admin123',
        csrfToken: csrfToken,
        callbackUrl: 'http://localhost:3000/dashboard',
        json: 'true'
      })
    });
    
    console.log('📊 Login response status:', loginResponse.status);
    console.log('📊 Login response headers:', Object.fromEntries(loginResponse.headers.entries()));
    
    const responseText = await loginResponse.text();
    console.log('📊 Login response body:', responseText);
    
    if (loginResponse.status === 200) {
      console.log('✅ Login appears successful!');
    } else {
      console.log('❌ Login failed with status:', loginResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Login test error:', error.message);
  }
}

// Wait for server to start
setTimeout(() => {
  testLogin();
}, 3000); 