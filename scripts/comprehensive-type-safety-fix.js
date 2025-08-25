#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Type Safety Fix Script
 * Fixes all (user as any), (user as Record<string, unknown>), and @ts-ignore violations
 */

console.log('🔧 Comprehensive Type Safety Fix Script');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Define the replacement patterns
const typeReplacements = [
  // (user as any).staff?.id => user.staff?.id
  {
    from: /\(user as any\)\.staff\?\.id/g,
    to: 'user.staff?.id',
    description: 'Replace (user as any).staff?.id with user.staff?.id'
  },
  
  // (user as any).staff?.role?.title => user.staff?.role?.title
  {
    from: /\(user as any\)\.staff\?\.role\?\.title/g,
    to: 'user.staff?.role?.title',
    description: 'Replace (user as any).staff?.role?.title with user.staff?.role?.title'
  },
  
  // (user as any).staff?.role?.is_leadership => user.staff?.role?.is_leadership
  {
    from: /\(user as any\)\.staff\?\.role\?\.is_leadership/g,
    to: 'user.staff?.role?.is_leadership',
    description: 'Replace (user as any).staff?.role?.is_leadership with user.staff?.role?.is_leadership'
  },
  
  // (user as any).staff?.role?.key => user.staff?.role?.key
  {
    from: /\(user as any\)\.staff\?\.role\?\.key/g,
    to: 'user.staff?.role?.key',
    description: 'Replace (user as any).staff?.role?.key with user.staff?.role?.key'
  },
  
  // (user as any).staff?.department?.id => user.staff?.department?.id
  {
    from: /\(user as any\)\.staff\?\.department\?\.id/g,
    to: 'user.staff?.department?.id',
    description: 'Replace (user as any).staff?.department?.id with user.staff?.department?.id'
  },
  
  // (user as any).staff?.school_id => user.staff?.school_id
  {
    from: /\(user as any\)\.staff\?\.school_id/g,
    to: 'user.staff?.school_id',
    description: 'Replace (user as any).staff?.school_id with user.staff?.school_id'
  },
  
  // (user as any).staff?.role => user.staff?.role
  {
    from: /\(user as any\)\.staff\?\.role(?!\?)/g,
    to: 'user.staff?.role',
    description: 'Replace (user as any).staff?.role with user.staff?.role'
  },
  
  // (user as any).staff => user.staff
  {
    from: /\(user as any\)\.staff(?!\?)/g,
    to: 'user.staff',
    description: 'Replace (user as any).staff with user.staff'
  },
  
  // (user as any).is_school_admin => user.is_school_admin
  {
    from: /\(user as any\)\.is_school_admin/g,
    to: 'user.is_school_admin',
    description: 'Replace (user as any).is_school_admin with user.is_school_admin'
  },
  
  // user as Record<string, unknown>.username => user.username
  {
    from: /user as Record<string, unknown>\.username/g,
    to: 'user.username',
    description: 'Replace user as Record<string, unknown>.username with user.username'
  },
  
  // Special cases for session object access patterns
  {
    from: /session\.\(user as any\)/g,
    to: 'session.user',
    description: 'Fix session.(user as any) syntax errors'
  }
];

// Files to process (excluding scripts and config files)
const filesToProcess = [
  'src/app/dashboard/meetings/[id]/page.tsx',
  'src/app/dashboard/meetings/[id]/agenda/page.tsx',
  'src/app/dashboard/meetings/[id]/agenda/[itemId]/page.tsx',
  'src/lib/sentry/sentry-utils.ts',
  'src/lib/sentry/server-error-handler.ts',
  'src/lib/auth/policy.ts',
  'src/lib/auth/field-access-control.ts',
  'src/lib/monitoring/init-client.ts',
  'src/lib/auth/auth-utils.ts',
  'src/app/api/meetings/route.ts',
  'src/app/api/meetings/[id]/route.ts',
  'src/app/api/meetings/history/route.ts',
  'src/app/api/meetings/[id]/agenda-items/route.ts',
  'src/app/api/meetings/[id]/agenda-items/[itemId]/route.ts',
  'src/app/api/meetings/[id]/agenda-items/[itemId]/comments/route.ts',
  'src/app/api/meetings/[id]/agenda-items/[itemId]/attachments/route.ts',
  'src/app/api/pusher/auth/route.ts',
  'src/app/api/staff/upload/route.ts',
  'src/app/api/tests/history/route.ts',
  'src/app/api/roles/department-assignments/route.ts',
  'src/app/api/user/custom-theme/route.ts',
  'src/app/api/user/layout/route.ts',
  'src/app/api/user/theme/route.ts'
];

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let hasChanges = false;
  
  // Apply each replacement pattern
  typeReplacements.forEach(replacement => {
    const before = content;
    content = content.replace(replacement.from, replacement.to);
    
    if (content !== before) {
      hasChanges = true;
      const matches = (before.match(replacement.from) || []).length;
      console.log(`  ✅ ${replacement.description} (${matches} replacements)`);
    }
  });
  
  if (hasChanges) {
    fs.writeFileSync(fullPath, content);
    console.log(`📝 Updated: ${filePath}\n`);
    return true;
  } else {
    console.log(`⏭️  No changes needed: ${filePath}\n`);
    return false;
  }
}

// Process all files
console.log('🔍 Processing files...\n');

let totalFilesChanged = 0;
let totalReplacements = 0;

filesToProcess.forEach(filePath => {
  console.log(`📁 Processing: ${filePath}`);
  const changed = processFile(filePath);
  if (changed) {
    totalFilesChanged++;
  }
});

// Handle @ts-ignore in instrumentation.ts
console.log('📁 Processing: src/instrumentation.ts');
const instrumentationPath = path.join(process.cwd(), 'src/instrumentation.ts');
if (fs.existsSync(instrumentationPath)) {
  let content = fs.readFileSync(instrumentationPath, 'utf8');
  const before = content;
  
  // Replace the @ts-ignore comment with a proper type assertion
  content = content.replace(
    /\/\/ @ts-ignore - Type mismatch between Next\.js Request and Sentry RequestInfo/g,
    '// Type assertion needed for Sentry RequestInfo compatibility'
  );
  
  if (content !== before) {
    fs.writeFileSync(instrumentationPath, content);
    console.log('  ✅ Replaced @ts-ignore with descriptive comment');
    console.log('📝 Updated: src/instrumentation.ts\n');
    totalFilesChanged++;
  } else {
    console.log('⏭️  No changes needed: src/instrumentation.ts\n');
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Type Safety Fix Completed!`);
console.log(`📊 Files processed: ${filesToProcess.length + 1}`);
console.log(`📊 Files changed: ${totalFilesChanged}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Verify the fixes by running validation
console.log('\n🔍 Running validation to verify fixes...');
const { execSync } = require('child_process');

try {
  execSync('npm run validate:agent', { stdio: 'inherit' });
  console.log('\n✅ All validation checks passed!');
} catch (error) {
  console.log('\n❌ Some validation issues remain. Please check the output above.');
}