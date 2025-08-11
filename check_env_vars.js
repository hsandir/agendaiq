const fs = require('fs');
const path = require('path');

console.log('=== ENVIRONMENT VARIABLES CHECK ===\n');

// Check which .env files exist
const envFiles = [
  '.env',
  '.env.local', 
  '.env.development',
  '.env.development.local',
  '.env.production',
  '.env.production.local'
];

console.log('1. ENV FILES FOUND:');
envFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`   ✅ ${file} (${stats.size} bytes)`);
    
    // Read and parse file
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const vars = [];
    
    lines.forEach(line => {
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key] = line.split('=');
        vars.push(key.trim());
      }
    });
    
    if (vars.length > 0) {
      console.log(`      Variables: ${vars.join(', ')}`);
    }
  } else {
    console.log(`   ❌ ${file} (not found)`);
  }
});

console.log('\n2. CURRENT ENVIRONMENT VARIABLES:');

// Critical variables for the app
const criticalVars = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NODE_ENV',
  'PORT'
];

criticalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    let displayValue = value;
    
    // Mask sensitive data
    if (varName.includes('SECRET') || varName.includes('KEY') || varName.includes('PASSWORD')) {
      displayValue = value.substring(0, 10) + '...' + (value.length > 10 ? '(masked)' : '');
    } else if (varName.includes('URL')) {
      // Show URL structure without credentials
      displayValue = value.replace(/:\/\/[^@]+@/, '://***:***@');
    }
    
    console.log(`   ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`   ❌ ${varName}: NOT SET`);
  }
});

console.log('\n3. DATABASE CONNECTION CHECK:');

// Check if DATABASE_URL points to Supabase
const dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.includes('supabase')) {
  console.log('   🔵 DATABASE_URL points to Supabase');
} else if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
  console.log('   🟡 DATABASE_URL points to local database');
} else if (dbUrl) {
  console.log('   🟢 DATABASE_URL points to external database');
} else {
  console.log('   ❌ DATABASE_URL not configured');
}

// Check for Supabase variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  console.log('   ✅ Supabase credentials configured');
  console.log(`      URL: ${supabaseUrl}`);
} else {
  console.log('   ⚠️  Supabase credentials missing');
}