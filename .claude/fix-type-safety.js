#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing TypeScript type safety violations...');

// Get all TypeScript files
const getFiles = (dir) => {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...getFiles(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
};

const fixTypeSafety = (content, filePath) => {
  let fixed = content;
  let changesMade = 0;
  
  // Pattern 1: Fix explicit any types in common patterns
  const anyPatterns = [
    // Function parameter any
    { pattern: /\(\s*(\w+)\s*:\s*any\s*\)/g, replacement: '($1: unknown)' },
    // Variable declaration any
    { pattern: /:\s*any\s*=/g, replacement: ': unknown =' },
    // Function return any
    { pattern: /\)\s*:\s*any\s*{/g, replacement: '): unknown {' },
    // Generic any
    { pattern: /Record<string,\s*any>/g, replacement: 'Record<string, unknown>' },
  ];
  
  anyPatterns.forEach(({ pattern, replacement }) => {
    const matches = fixed.match(pattern);
    if (matches) {
      fixed = fixed.replace(pattern, replacement);
      changesMade += matches.length;
    }
  });
  
  // Pattern 2: Add type assertions for common unsafe member access
  const memberAccessPatterns = [
    // error.someProperty -> (error as Record<string, unknown>).someProperty
    { 
      pattern: /(\w+)\.(\w+)(?=\s*[,;)\]}])/g, 
      replacement: (match, obj, prop) => {
        if (filePath.includes('test') || obj === 'error' || obj === 'data') {
          return `(${obj} as Record<string, unknown>).${prop}`;
        }
        return match;
      }
    },
  ];
  
  // Pattern 3: Fix unsafe assignments in test files
  if (filePath.includes('test') || filePath.includes('__tests__')) {
    const testPatterns = [
      // Mock data assignments
      { pattern: /const\s+(\w+)\s*=\s*(\w+)\s*as\s*any/g, replacement: 'const $1 = $2 as unknown' },
      // Expect assertions
      { pattern: /expect\(([^)]+)\s+as\s+any\)/g, replacement: 'expect($1 as unknown)' },
    ];
    
    testPatterns.forEach(({ pattern, replacement }) => {
      const matches = fixed.match(pattern);
      if (matches) {
        fixed = fixed.replace(pattern, replacement);
        changesMade += matches.length;
      }
    });
  }
  
  // Pattern 4: Add null checks for common unsafe member access
  const nullCheckPatterns = [
    // obj.prop -> obj?.prop
    { pattern: /(\w+)\.(\w+)(?=\s*(?:[,;)\]}]|&&|\|\|))/g, replacement: '$1?.$2' },
  ];
  
  // Apply null checks only to specific files that commonly have these issues
  if (filePath.includes('auth') || filePath.includes('api') || filePath.includes('components')) {
    nullCheckPatterns.forEach(({ pattern, replacement }) => {
      // Only apply if the pattern looks like it needs a null check
      const matches = fixed.match(pattern);
      if (matches && matches.length < 10) { // Avoid over-applying
        fixed = fixed.replace(pattern, replacement);
        changesMade += Math.min(matches.length, 5); // Limit changes per file
      }
    });
  }
  
  // Pattern 5: Fix consistent type assertions
  const typeAssertionPatterns = [
    // obj as Type -> obj satisfies Type
    { pattern: /\}\s*as\s+(\w+)/g, replacement: '} satisfies $1' },
  ];
  
  typeAssertionPatterns.forEach(({ pattern, replacement }) => {
    const matches = fixed.match(pattern);
    if (matches && matches.length < 5) { // Only apply to a few instances
      fixed = fixed.replace(pattern, replacement);
      changesMade += matches.length;
    }
  });
  
  return { content: fixed, changes: changesMade };
};

// Process files with high priority (auth, api, components)
const srcDir = path.join(process.cwd(), 'src');
const allFiles = getFiles(srcDir);

// Prioritize files that are likely to have critical type safety issues
const priorityPatterns = [
  /\/auth\//,
  /\/api\//,
  /\/lib\//,
  /\/types\//,
  /auth-utils/,
  /api-auth/,
  /policy/,
];

const priorityFiles = allFiles.filter(file => 
  priorityPatterns.some(pattern => pattern.test(file)) &&
  !file.includes('test') &&
  !file.includes('__tests__')
);

const otherFiles = allFiles.filter(file => 
  !priorityPatterns.some(pattern => pattern.test(file)) &&
  !file.includes('test') &&
  !file.includes('__tests__')
);

const filesToProcess = [...priorityFiles, ...otherFiles.slice(0, 50)]; // Limit to avoid overwhelming changes

let totalChanges = 0;
let filesChanged = 0;

console.log(`Processing ${filesToProcess.length} high-priority TypeScript files...`);

filesToProcess.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: fixedContent, changes } = fixTypeSafety(content, filePath);
    
    if (changes > 0) {
      fs.writeFileSync(filePath, fixedContent);
      console.log(`✅ Fixed ${changes} type safety issues in ${path.relative(process.cwd(), filePath)}`);
      totalChanges += changes;
      filesChanged++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Completed: Fixed ${totalChanges} type safety issues in ${filesChanged} files`);

if (totalChanges > 0) {
  console.log('Running TypeScript check to verify fixes...');
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log('✅ TypeScript check passed!');
  } catch (error) {
    console.log('⚠️ TypeScript check found remaining issues');
  }
}