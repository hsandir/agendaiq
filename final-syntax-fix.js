#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const fixPatterns = [
  // Pattern 1: Fix missing semicolons in JSX return statements
  {
    name: 'JSX return statement semicolon fix',
    pattern: /(return\s*<[^>]+>.*?<\/[^>]+>)(?!\s*;)/g,
    replacement: '$1;'
  },
  
  // Pattern 2: Fix missing semicolons in switch case JSX returns
  {
    name: 'Switch case JSX return semicolon fix',
    pattern: /(default:\s*return\s*<[^>]*\/>[^;]*)(\s*})/g,
    replacement: '$1;$2'
  },
  
  // Pattern 3: Fix semicolons in ternary expressions
  {
    name: 'Ternary expression semicolon fix',
    pattern: /(prev\.includes\([^)]+\));/g,
    replacement: '$1'
  },
  
  // Pattern 4: Fix method chain semicolons again (more comprehensive)
  {
    name: 'Comprehensive method chain fix',
    pattern: /(\w+\([^)]*\));(\.map|\.filter|\.join|\.reduce)/g,
    replacement: '$1$2'
  }
];

function fixSpecificFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let fixes = [];
    
    // Special fixes for specific files
    if (filePath.includes('test-dashboard.tsx')) {
      // Look for specific patterns that break JSX parsing
      const beforeReturn = content.substring(0, content.indexOf('return ('));
      const afterReturn = content.substring(content.indexOf('return ('));
      
      // Check for unclosed functions or missing semicolons before return
      let fixedBefore = beforeReturn;
      
      // Fix common patterns that break JSX
      fixedBefore = fixedBefore.replace(/(\w+:\s*'[^']*')(\s*})/g, '$1$2');
      fixedBefore = fixedBefore.replace(/(case\s+'[^']*':\s*return\s+'[^']*')(\s*[;}])/g, '$1;$2');
      
      if (fixedBefore !== beforeReturn) {
        content = fixedBefore + afterReturn;
        modified = true;
        fixes.push('Fixed pre-JSX syntax issues');
      }
    }
    
    if (filePath.includes('RepeatMeetingModal.tsx')) {
      // Similar fix for RepeatMeetingModal
      const beforeReturn = content.substring(0, content.indexOf('return ('));
      let fixedBefore = beforeReturn;
      
      // Fix missing semicolons or malformed closures
      fixedBefore = fixedBefore.replace(/(\w+:\s*[^;,}\]]+)(\s*};)/g, '$1$2');
      fixedBefore = fixedBefore.replace(/(}\s*);?\s*$/gm, '$1;');
      
      if (fixedBefore !== beforeReturn) {
        const afterReturn = content.substring(content.indexOf('return ('));
        content = fixedBefore + afterReturn;
        modified = true;
        fixes.push('Fixed pre-JSX syntax issues');
      }
    }
    
    // Apply general patterns
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

// Target the specific problematic files
const problematicFiles = [
  'src/components/development/test-dashboard.tsx',
  'src/components/meetings/RepeatMeetingModal.tsx',
  'src/components/development/git-operations.tsx',
  'src/components/monitoring/local-monitor.tsx',
  'src/components/teams/CreateTeamDialog.tsx'
];

console.log('🔍 Starting final comprehensive syntax fix...');

let fixedCount = 0;

problematicFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    if (fixSpecificFile(fullPath)) {
      fixedCount++;
    }
  } else {
    console.log(`File not found: ${fullPath}`);
  }
});

console.log(`\n✨ Final fix complete: ${fixedCount}/${problematicFiles.length} files fixed`);