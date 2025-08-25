#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing extra parentheses from automatic fixes...');

// Define specific problematic patterns that our scripts may have created
const fixes = [
  // Fix triple parentheses at end of statements 
  {
    from: /\)\)\);$/gm,
    to: '));',
    description: 'Fix triple closing parentheses'
  },
  
  // Fix double function declaration syntax: (async (params) => {
  {
    from: /= \(async \(/g,
    to: '= async (',
    description: 'Fix double async function parentheses'
  },
  
  // Fix session access pattern
  {
    from: /session\.\(user as any\)/g,
    to: 'session.user',
    description: 'Fix session user access'
  },
  
  // Fix object access after replacement
  {
    from: /\(\(([A-Z_]+\.[A-Z_]+)\)\]/g,
    to: '[$1]',
    description: 'Fix object property access'
  }
];

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  fixes.forEach(fix => {
    const before = content;
    content = content.replace(fix.from, fix.to);
    
    if (content !== before) {
      hasChanges = true;
      console.log(`  ✅ ${fix.description}`);
    }
  });
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`📝 Updated: ${filePath}\n`);
    return true;
  }
  
  return false;
}

// Find all TypeScript and TSX files with potential issues
const { execSync } = require('child_process');

try {
  // Find files with syntax errors from build output
  const errorFiles = [
    'src/components/meetings/MeetingLiveView.tsx',
    'src/lib/monitoring/error-analyzer.ts',
    'src/app/dashboard/system/logs/client.tsx',
    'src/app/dashboard/settings/role-hierarchy/user-assignment/UserRoleAssignmentContent.tsx',
    'src/components/ui/calendar.tsx'
  ];

  let totalFixed = 0;
  
  errorFiles.forEach(file => {
    console.log(`📁 Checking: ${file}`);
    if (fixFile(path.join(process.cwd(), file))) {
      totalFixed++;
    }
  });
  
  console.log(`✅ Fixed ${totalFixed} files with extra parentheses`);
  
} catch (error) {
  console.error('Error fixing parentheses:', error.message);
}