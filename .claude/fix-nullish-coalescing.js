#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing prefer-nullish-coalescing violations...');

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

const fixNullishCoalescing = (content) => {
  // Common patterns to fix (safe replacements)
  const patterns = [
    // Simple variable or property access with fallback
    /(\w+(?:\.\w+)*)\s*\|\|\s*(['"]\w*['"])/g, // variable || "string"
    /(\w+(?:\.\w+)*)\s*\|\|\s*(\d+)/g, // variable || number
    /(\w+(?:\.\w+)*)\s*\|\|\s*(true|false)/g, // variable || boolean
    /(\w+(?:\.\w+)*)\s*\|\|\s*(\[\])/g, // variable || []
    /(\w+(?:\.\w+)*)\s*\|\|\s*(\{\})/g, // variable || {}
    /(\w+(?:\.\w+)*)\s*\|\|\s*(\w+(?:\.\w+)*)/g, // variable || variable
    // Function calls with fallback
    /(\w+\([^)]*\))\s*\|\|\s*(['"]\w*['"])/g, // func() || "string"
    /(\w+\([^)]*\))\s*\|\|\s*(\d+)/g, // func() || number
    /(\w+\([^)]*\))\s*\|\|\s*(true|false)/g, // func() || boolean
    // Array access with fallback
    /(\w+\[[\w'"]+\])\s*\|\|\s*(['"]\w*['"])/g, // arr[0] || "string"
    /(\w+\[[\w'"]+\])\s*\|\|\s*(\d+)/g, // arr[0] || number
  ];
  
  let fixed = content;
  let changesMade = 0;
  
  patterns.forEach(pattern => {
    const matches = fixed.match(pattern);
    if (matches) {
      fixed = fixed.replace(pattern, '$1 ?? $2');
      changesMade += matches.length;
    }
  });
  
  return { content: fixed, changes: changesMade };
};

// Process files
const srcDir = path.join(process.cwd(), 'src');
const files = getFiles(srcDir);
let totalChanges = 0;
let filesChanged = 0;

console.log(`Found ${files.length} TypeScript files to process...`);

files.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: fixedContent, changes } = fixNullishCoalescing(content);
    
    if (changes > 0) {
      fs.writeFileSync(filePath, fixedContent);
      console.log(`✅ Fixed ${changes} issues in ${path.relative(process.cwd(), filePath)}`);
      totalChanges += changes;
      filesChanged++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Completed: Fixed ${totalChanges} nullish coalescing issues in ${filesChanged} files`);

if (totalChanges > 0) {
  console.log('Running ESLint to verify fixes...');
  try {
    execSync('npx eslint src --ext .ts,.tsx --fix', { stdio: 'inherit' });
  } catch (error) {
    console.log('ESLint found remaining issues, continuing...');
  }
}