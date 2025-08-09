/**
 * Test authentication with different admin accounts
 */

const fetch = require('node-fetch');

async function testAuth() {
  const testAccounts = [
    { email: 'admin@school.edu', password: '1234' },
    { email: 'sysadmin@cjcollegeprep.org', password: '1234' },
    { email: 'admin@agendaiq.com', password: '1234' }
  ];

  console.log('🔐 Testing Authentication System\n');
  console.log('================================\n');

  for (const account of testAccounts) {
    console.log(`Testing: ${account.email}`);
    
    try {
      // Get CSRF token first
      const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
      const { csrfToken } = await csrfResponse.json();
      
      // Try to authenticate
      const authResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: account.email,
          password: account.password,
          csrfToken: csrfToken
        })
      });

      if (authResponse.ok || authResponse.status === 302) {
        console.log(`  ✅ Authentication successful (Status: ${authResponse.status})`);
      } else {
        const text = await authResponse.text();
        console.log(`  ❌ Authentication failed (Status: ${authResponse.status})`);
        if (text.includes('Invalid credentials')) {
          console.log(`     Reason: Invalid credentials`);
        } else if (text.includes('rate limit')) {
          console.log(`     Reason: Rate limited`);
        } else {
          console.log(`     Response: ${text.substring(0, 100)}...`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('================================');
  console.log('\n📝 Login Instructions:');
  console.log('1. Go to http://localhost:3000/auth/signin');
  console.log('2. Use any of these accounts:');
  console.log('   - admin@school.edu / 1234');
  console.log('   - sysadmin@cjcollegeprep.org / 1234');
  console.log('   - admin@agendaiq.com / 1234');
}

// Wait a bit for server to start
setTimeout(() => {
  testAuth().catch(console.error);
}, 3000);