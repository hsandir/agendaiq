#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// TSX files with JSX parsing errors
const jsxErrorFiles = [
  'src/components/development/git-operations.tsx',
  'src/components/development/test-dashboard.tsx',
  'src/components/meetings/RepeatMeetingModal.tsx',  
  'src/components/teams/CreateTeamDialog.tsx'
];

function fixInterfaceSemicolons(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Pattern 1: Fix missing semicolons in interface properties before closing brace
    const interfacePropertyPattern = /(\w+:\s*[^;,{}]+)(\s*})/g;
    if (content.match(interfacePropertyPattern)) {
      const beforeFix = content.match(interfacePropertyPattern) || [];
      content = content.replace(interfacePropertyPattern, (match, prop, closing) => {
        if (!prop.trim().endsWith(';') && !prop.trim().endsWith(',')) {
          return prop + ';' + closing;
        }
        return match;
      });
      
      const afterFix = content.match(interfacePropertyPattern) || [];
      if (beforeFix.length !== afterFix.length) {
        modified = true;
        console.log(`Fixed interface semicolons in ${filePath}`);
      }
    }
    
    // Pattern 2: Fix union type properties
    const unionTypePattern = /(\w+:\s*'[^']*'\s*\|\s*'[^']*'[^;,}]*?)(\s*[;}])/g;
    if (content.match(unionTypePattern)) {
      content = content.replace(unionTypePattern, (match, prop, closing) => {
        if (!prop.trim().endsWith(';') && !prop.trim().endsWith(',')) {
          return prop + ';' + closing;
        }
        return match;
      });
      modified = true;
      console.log(`Fixed union type semicolons in ${filePath}`);
    }
    
    // Pattern 3: Fix array/tuple type properties  
    const arrayTypePattern = /(\w+:\s*\([^)]+\)\[\][^;,}]*?)(\s*[;}])/g;
    if (content.match(arrayTypePattern)) {
      content = content.replace(arrayTypePattern, (match, prop, closing) => {
        if (!prop.trim().endsWith(';') && !prop.trim().endsWith(',')) {
          return prop + ';' + closing;
        }
        return match;
      });
      modified = true;
      console.log(`Fixed array type semicolons in ${filePath}`);
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}: ${error.message}`);
    return false;
  }
}

console.log('🔍 Fixing interface semicolons in JSX error files...');

let fixedCount = 0;
jsxErrorFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    if (fixInterfaceSemicolons(fullPath)) {
      fixedCount++;
    }
  } else {
    console.log(`File not found: ${fullPath}`);
  }
});

console.log(`✨ Interface semicolon fix complete: ${fixedCount}/${jsxErrorFiles.length} files fixed`);