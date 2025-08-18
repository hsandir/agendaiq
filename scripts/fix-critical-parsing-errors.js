#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing critical TypeScript parsing errors...');

// Critical parsing error fixes
const criticalFixes = [
  // Fix parsing errors in test files
  {
    pattern: /const user = await prisma\.\(user as Record<string, unknown>\)\.create\(/g,
    replacement: 'const user = await prisma.user.create(',
    description: 'Fix Prisma user syntax in comprehensive-api.test.ts'
  },
  {
    pattern: /await context\.prisma\.\(user as Record<string, unknown>\)\.findUnique\(/g,
    replacement: 'await context.prisma.user.findUnique(',
    description: 'Fix Prisma user syntax in auth-login.test.ts'
  },
  {
    pattern: /await context\.prisma\.\(user as Record<string, unknown>\)\.create\(/g,
    replacement: 'await context.prisma.user.create(',
    description: 'Fix Prisma user syntax in auth-login.test.ts'
  },
  {
    pattern: /await context\.prisma\.\(user as Record<string, unknown>\)\.update\(/g,
    replacement: 'await context.prisma.user.update(',
    description: 'Fix Prisma user syntax in auth-login.test.ts'
  },
  {
    pattern: /await context\.prisma\.\(user as Record<string, unknown>\)\.deleteMany\(/g,
    replacement: 'await context.prisma.user.deleteMany(',
    description: 'Fix Prisma user syntax in auth-login.test.ts'
  },
  {
    pattern: /await prisma\.\(user as Record<string, unknown>\)\.findUnique\(/g,
    replacement: 'await prisma.user.findUnique(',
    description: 'Fix Prisma user syntax in auth-security.test.ts'
  },
  {
    pattern: /await prisma\.\(user as Record<string, unknown>\)\.create\(/g,
    replacement: 'await prisma.user.create(',
    description: 'Fix Prisma user syntax in auth-security.test.ts'
  },
  {
    pattern: /await prisma\.\(user as Record<string, unknown>\)\.deleteMany\(/g,
    replacement: 'await prisma.user.deleteMany(',
    description: 'Fix Prisma user syntax in auth-security.test.ts'
  },
  // Fix unused variable issues in templates
  {
    pattern: /const { } = render\(/g,
    replacement: 'const { container } = render(',
    description: 'Fix destructuring in component template'
  },
  {
    pattern: /const { } = renderWithProviders\(/g,
    replacement: 'const { container } = renderWithProviders(',
    description: 'Fix destructuring in component template'
  },
  {
    pattern: /const { } = await import\(/g,
    replacement: 'const module = await import(',
    description: 'Fix import destructuring'
  },
  // Fix comment parsing errors
  {
    pattern: /\/\/ createMockUser\(/g,
    replacement: '// const createMockUser = (',
    description: 'Fix commented function syntax'
  },
];

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let updatedContent = content;
  let changes = 0;

  criticalFixes.forEach(fix => {
    const matches = updatedContent.match(fix.pattern);
    if (matches) {
      updatedContent = updatedContent.replace(fix.pattern, fix.replacement);
      changes += matches.length;
      console.log(`   ✅ ${fix.description}: ${matches.length} fixes`);
    }
  });

  if (changes > 0) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`📁 Fixed ${changes} issues in ${filePath}`);
    return changes;
  }

  return 0;
}

// Find and fix files with critical parsing errors
const testFiles = glob.sync('src/**/*.{ts,tsx}', {
  ignore: ['node_modules/**', 'dist/**', '.next/**']
});

let totalFixes = 0;
const fixedFiles = [];

testFiles.forEach(filePath => {
  const fixes = fixFile(filePath);
  if (fixes > 0) {
    totalFixes += fixes;
    fixedFiles.push(filePath);
  }
});

console.log(`\n🎯 Summary:`);
console.log(`   • Fixed ${totalFixes} critical parsing errors`);
console.log(`   • Updated ${fixedFiles.length} files`);

if (fixedFiles.length > 0) {
  console.log('\n📋 Fixed files:');
  fixedFiles.forEach(file => console.log(`   • ${file}`));
}

console.log('\n✅ Critical parsing errors fixed - ready for commit!');