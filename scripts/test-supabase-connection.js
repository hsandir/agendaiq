#!/usr/bin/env node

const { Client } = require('pg');

// Supabase connection strings (şifre eklenmeli)
const connections = {
  transaction: {
    name: 'Transaction Pooler (Port 6543)',
    url: 'postgresql://postgres.tvhqasooledcffwogbvd:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
  },
  session: {
    name: 'Session Pooler (Port 5432)', 
    url: 'postgresql://postgres.tvhqasooledcffwogbvd:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres'
  },
  direct: {
    name: 'Direct Connection',
    url: 'postgresql://postgres:[PASSWORD]@db.tvhqasooledcffwogbvd.supabase.co:5432/postgres'
  }
};

// Test function
async function testConnection(name, connectionString) {
  // Şifre kontrolü
  if (connectionString.includes('[PASSWORD]')) {
    console.log(`❌ ${name}: Lütfen [PASSWORD] yerine gerçek şifrenizi yazın`);
    return false;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`\n🔄 Testing ${name}...`);
    console.log(`   URL: ${connectionString.replace(/:([^:@]+)@/, ':[HIDDEN]@')}`);
    
    await client.connect();
    
    // Test query
    const result = await client.query('SELECT current_database(), version()');
    console.log(`✅ ${name}: Connection successful!`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   Version: ${result.rows[0].version.split(',')[0]}`);
    
    // Table check
    const tables = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`   Tables in public schema: ${tables.rows[0].table_count}`);
    
    await client.end();
    return true;
  } catch (error) {
    console.log(`❌ ${name}: Connection failed!`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('=================================');
  console.log('Supabase Connection Test');
  console.log('=================================');
  
  const password = process.argv[2];
  
  if (!password) {
    console.log('\n⚠️  Kullanım: node test-supabase-connection.js [SUPABASE_PASSWORD]');
    console.log('\nÖrnek:');
    console.log('node scripts/test-supabase-connection.js MyPassword123\n');
    return;
  }

  console.log('\n🔐 Using provided password...\n');

  // Replace [PASSWORD] with actual password (URL encode if needed)
  const encodedPassword = encodeURIComponent(password);
  const connectionsToTest = {};
  for (const [key, conn] of Object.entries(connections)) {
    connectionsToTest[key] = {
      ...conn,
      url: conn.url.replace('[PASSWORD]', encodedPassword)
    };
  }

  // Test each connection
  const results = [];
  for (const [key, conn] of Object.entries(connectionsToTest)) {
    const success = await testConnection(conn.name, conn.url);
    results.push({ name: conn.name, success });
  }

  // Summary
  console.log('\n=================================');
  console.log('Test Summary');
  console.log('=================================');
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.name}`);
  });

  // Recommendations
  console.log('\n📝 Recommendations:');
  if (results.find(r => r.name.includes('Transaction') && r.success)) {
    console.log('✅ Use Transaction Pooler (Port 6543) for Vercel DATABASE_URL');
  }
  if (results.find(r => r.name.includes('Direct') && r.success)) {
    console.log('✅ Use Direct Connection for DIRECT_URL (migrations)');
  }

  // Generate environment variables if successful
  const transactionSuccess = results.find(r => r.name.includes('Transaction') && r.success);
  const directSuccess = results.find(r => r.name.includes('Direct') && r.success);
  
  if (transactionSuccess && directSuccess) {
    console.log('\n🎉 All required connections working!');
    console.log('\n📋 Copy these to Vercel Environment Variables:');
    console.log('=====================================');
    console.log(`DATABASE_URL=${connectionsToTest.transaction.url}`);
    console.log(`DIRECT_URL=${connectionsToTest.direct.url}`);
    console.log('=====================================');
  }
}

// Run the test
main().catch(console.error);