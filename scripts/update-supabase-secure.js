const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

// Supabase connection - şifre environment variable'dan alınmalı
const SUPABASE_PASSWORD = process.env.SUPABASE_PASSWORD;

if (!SUPABASE_PASSWORD) {
  console.error('❌ SUPABASE_PASSWORD environment variable is not set!');
  console.log('\n📝 Please add to your .env.local file:');
  console.log('SUPABASE_PASSWORD=your_actual_password');
  process.exit(1);
}

const SUPABASE_DATABASE_URL = `postgresql://postgres:${SUPABASE_PASSWORD}@db.tvhqasooledcffwogbvd.supabase.co:5432/postgres`;

console.log('🔐 Using Supabase connection with secure password from environment');
console.log('📡 Connecting to: db.tvhqasooledcffwogbvd.supabase.co');

// Rest of the script...
async function testConnection() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: SUPABASE_DATABASE_URL
      }
    }
  });
  
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connection successful!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();