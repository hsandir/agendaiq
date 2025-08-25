#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const fixPatterns = [
  // Pattern 1: Fix semicolon before method chain
  {
    name: 'Method chain semicolon fix',
    pattern: /(\w+\([^)]*\));\.(\w+)/g,
    replacement: '$1.$2'
  },
  
  // Pattern 2: Fix semicolon in object literals
  {
    name: 'Object literal semicolon fix',
    pattern: /(\w+:\s*[^,;}\]]+);(\s*[}\]])/g,
    replacement: '$1$2'
  },
  
  // Pattern 3: Fix semicolon after function parameter objects
  {
    name: 'Function parameter object semicolon fix',
    pattern: /(body:\s*JSON\.stringify\([^)]+\));(\s*\})/g,
    replacement: '$1$2'
  },
  
  // Pattern 4: Fix error property semicolon
  {
    name: 'Error property semicolon fix',
    pattern: /(error:\s*String\([^)]+\));/g,
    replacement: '$1'
  },
  
  // Pattern 5: Fix general object property semicolons
  {
    name: 'General object property semicolon fix',
    pattern: /(\w+:\s*[^,;}\]]+);(\s*[,}])/g,
    replacement: '$1$2'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let fixes = [];
    
    fixPatterns.forEach(pattern => {
      const matches = content.match(pattern.pattern);
      if (matches) {
        content = content.replace(pattern.pattern, pattern.replacement);
        modified = true;
        fixes.push(`${pattern.name}: ${matches.length} fixes`);
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${filePath}:`);
      fixes.forEach(fix => console.log(`   - ${fix}`));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}: ${error.message}`);
    return false;
  }
}

function findFilesToFix() {
  const srcDir = path.join(process.cwd(), 'src');
  const files = [];
  
  function walk(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.includes('node_modules') && !item.startsWith('.')) {
        walk(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    });
  }
  
  walk(srcDir);
  return files;
}

console.log('🔍 Starting comprehensive syntax fix...');

const files = findFilesToFix();
let fixedCount = 0;

files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✨ Comprehensive fix complete: ${fixedCount}/${files.length} files fixed`);