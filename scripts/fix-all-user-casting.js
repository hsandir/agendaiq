#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 Comprehensive User Type Casting Fix Script');
console.log('=============================================\n');

// Tüm problemli pattern'leri tanımla
const patterns = [
  // Prisma user casting hataları
  {
    pattern: /prisma\.\(user as Record<string, unknown>\)/g,
    replacement: 'prisma.user',
    description: 'Fix prisma user casting'
  },
  {
    pattern: /prisma\.\(([\w]+) as Record<string, unknown>\)/g,
    replacement: 'prisma.$1',
    description: 'Fix prisma model casting'
  },
  
  // User property access pattern'leri
  {
    pattern: /\(user as Record<string, unknown>\)\.Staff\??\.\[0\]/g,
    replacement: 'user.Staff?.[0]',
    description: 'Fix user.Staff access'
  },
  {
    pattern: /\(user as Record<string, unknown>\)\.Staff\[0\]/g,
    replacement: 'user.Staff[0]',
    description: 'Fix user.Staff direct access'
  },
  {
    pattern: /\(([\w]+) as Record<string, unknown>\)\.Staff/g,
    replacement: '$1.Staff',
    description: 'Fix Staff property access'
  },
  
  // ForEach ve filter syntax hataları
  {
    pattern: /\.forEach([a-zA-Z]+) =>/g,
    replacement: '.forEach($1 =>',
    description: 'Fix forEach missing parenthesis'
  },
  {
    pattern: /\.filter([a-zA-Z]+) =>/g,
    replacement: '.filter($1 =>',
    description: 'Fix filter missing parenthesis'
  },
  {
    pattern: /\.map([a-zA-Z]+) =>/g,
    replacement: '.map($1 =>',
    description: 'Fix map missing parenthesis'
  },
  {
    pattern: /\.find([a-zA-Z]+) =>/g,
    replacement: '.find($1 =>',
    description: 'Fix find missing parenthesis'
  },
  {
    pattern: /\.some([a-zA-Z]+) =>/g,
    replacement: '.some($1 =>',
    description: 'Fix some missing parenthesis'
  },
  {
    pattern: /\.every([a-zA-Z]+) =>/g,
    replacement: '.every($1 =>',
    description: 'Fix every missing parenthesis'
  },
  {
    pattern: /\.reduce([a-zA-Z]+),/g,
    replacement: '.reduce(($1,',
    description: 'Fix reduce missing parenthesis'
  },
  
  // If statement syntax hataları
  {
    pattern: /if\s+!([a-zA-Z])/g,
    replacement: 'if (!$1',
    description: 'Fix if statement missing parenthesis'
  },
  {
    pattern: /if\s+!\(/g,
    replacement: 'if (!(',
    description: 'Fix if statement with parenthesis'
  },
  
  // Function call syntax hataları
  {
    pattern: /\.update\{/g,
    replacement: '.update({',
    description: 'Fix update function call'
  },
  {
    pattern: /\.create\{/g,
    replacement: '.create({',
    description: 'Fix create function call'
  },
  {
    pattern: /\.delete\{/g,
    replacement: '.delete({',
    description: 'Fix delete function call'
  },
  {
    pattern: /\.findMany\{/g,
    replacement: '.findMany({',
    description: 'Fix findMany function call'
  },
  {
    pattern: /\.findUnique\{/g,
    replacement: '.findUnique({',
    description: 'Fix findUnique function call'
  },
  {
    pattern: /\.findFirst\{/g,
    replacement: '.findFirst({',
    description: 'Fix findFirst function call'
  },
  
  // Bracket ve parenthesis hataları
  {
    pattern: /\[\(\(([a-zA-Z.]+)\)\]/g,
    replacement: '[$1]',
    description: 'Fix double parenthesis in brackets'
  },
  {
    pattern: /\[\(([a-zA-Z.]+)\]/g,
    replacement: '[$1]',
    description: 'Fix extra parenthesis in brackets'
  },
  {
    pattern: /\(\(([a-zA-Z]+) as Record<string, unknown>\)/g,
    replacement: '($1 as Record<string, unknown>',
    description: 'Fix double parenthesis casting'
  },
  
  // Math operations syntax
  {
    pattern: /Math\.floor\(([^)]+)\)(\s*)\)/g,
    replacement: 'Math.floor($1))',
    description: 'Fix Math.floor closing parenthesis'
  },
  {
    pattern: /const (\w+) = Math\.floor\(([^;]+);/g,
    replacement: 'const $1 = Math.floor($2);',
    description: 'Fix Math operations semicolon'
  },
  
  // Type casting in conditionals
  {
    pattern: /if\s*\(\s*!\s*\(\s*\(([a-zA-Z]+) as Record<string, unknown>\)\s*\./g,
    replacement: 'if (!($1.',
    description: 'Fix type casting in conditionals'
  },
  
  // User type annotations
  {
    pattern: /: Record<string, unknown> & { Staff/g,
    replacement: ': User & { Staff',
    description: 'Fix user type annotations'
  },
  
  // __variable patterns (unused variables)
  {
    pattern: /const\s+\{\s*__(\w+)\s*\}/g,
    replacement: 'const { $1 }',
    description: 'Fix unused variable destructuring'
  },
  {
    pattern: /const\s+\{\s*__(\w+),\s*__(\w+)\s*\}/g,
    replacement: 'const { $1, $2 }',
    description: 'Fix multiple unused variable destructuring'
  },
  
  // Request/Response type issues
  {
    pattern: /const\s+\{\s*\}\s*=\s*await import/g,
    replacement: 'const module = await import',
    description: 'Fix empty destructuring from import'
  },
  
  // Property access with extra brackets
  {
    pattern: /\[cookie\.name\]\]/g,
    replacement: '[cookie.name]',
    description: 'Fix cookie name double bracket'
  },
  
  // Async/await patterns
  {
    pattern: /await\s+prisma\.\s*\(/g,
    replacement: 'await prisma.',
    description: 'Fix prisma spacing issues'
  }
];

// Statistics
let totalFiles = 0;
let totalFixes = 0;
const fixedFiles = [];
const errors = [];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileFixCount = 0;
    let appliedFixes = [];

    patterns.forEach(({ pattern, replacement, description }) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        content = content.replace(pattern, replacement);
        fileFixCount += matches.length;
        appliedFixes.push(`  - ${description}: ${matches.length} fix(es)`);
      }
    });

    // Sadece değişiklik varsa dosyayı yaz
    if (fileFixCount > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${path.relative(process.cwd(), filePath)}`);
      appliedFixes.forEach(fix => console.log(fix));
      fixedFiles.push(filePath);
      totalFixes += fileFixCount;
      return true;
    }
    return false;
  } catch (error) {
    errors.push({ file: filePath, error: error.message });
    return false;
  }
}

// Tüm TypeScript ve TSX dosyalarını bul
console.log('🔎 Scanning for TypeScript files...\n');

const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: [
    'node_modules/**',
    'dist/**',
    '.next/**',
    'build/**',
    '*.test.ts',
    '*.test.tsx',
    '*.spec.ts',
    '*.spec.tsx'
  ]
});

console.log(`Found ${files.length} files to check\n`);
console.log('📝 Processing files...\n');

// Her dosyayı kontrol et ve düzelt
files.forEach(file => {
  totalFiles++;
  fixFile(file);
});

// Özel olarak test dosyalarını da kontrol et
console.log('\n🧪 Checking test files separately...\n');
const testFiles = glob.sync('src/**/*.{test,spec}.{ts,tsx}');
testFiles.forEach(file => {
  totalFiles++;
  fixFile(file);
});

// Sonuç raporu
console.log('\n' + '='.repeat(60));
console.log('📊 FIX SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Total files processed: ${totalFiles}`);
console.log(`🔧 Total fixes applied: ${totalFixes}`);
console.log(`📁 Files modified: ${fixedFiles.length}`);

if (errors.length > 0) {
  console.log(`\n⚠️  Errors encountered: ${errors.length}`);
  errors.forEach(({ file, error }) => {
    console.log(`  - ${path.relative(process.cwd(), file)}: ${error}`);
  });
}

if (fixedFiles.length > 0) {
  console.log('\n📋 Modified files:');
  fixedFiles.forEach(file => {
    console.log(`  - ${path.relative(process.cwd(), file)}`);
  });
}

// Validation check - tekrar pattern ara
console.log('\n🔍 Running validation check...');
let remainingIssues = 0;

files.concat(testFiles).forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Hala problem var mı kontrol et
    const problematicPatterns = [
      /prisma\.\(.*as Record<string, unknown>\)/,
      /\.forEach[a-zA-Z]+\s*=>/,
      /\.filter[a-zA-Z]+\s*=>/,
      /if\s+![a-zA-Z]/,
      /\[\(\(/,
      /\)\)\]/
    ];
    
    problematicPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        remainingIssues++;
        console.log(`⚠️  Still has issues: ${path.relative(process.cwd(), file)}`);
      }
    });
  } catch (error) {
    // Ignore read errors in validation
  }
});

if (remainingIssues === 0) {
  console.log('✅ All issues have been fixed!');
} else {
  console.log(`⚠️  ${remainingIssues} issues may still remain. Run the script again or check manually.`);
}

console.log('\n✨ Script completed!');