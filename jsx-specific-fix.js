#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with specific JSX syntax errors
const problematicFiles = [
  '/Users/hs/Project/agendaiq/src/components/development/test-dashboard.tsx',
  '/Users/hs/Project/agendaiq/src/components/meetings/RepeatMeetingModal.tsx'
];

function fixJSXSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern 1: Fix missing semicolons at end of switch case returns
    const switchReturnPattern = /(case\s+'[^']*':\s*return\s+[^;]+)(\s*})/g;
    if (content.match(switchReturnPattern)) {
      content = content.replace(switchReturnPattern, '$1;$2');
      modified = true;
      console.log(`Fixed switch case returns in ${filePath}`);
    }

    // Pattern 2: Fix interface property semicolons
    const interfacePropertyPattern = /(\w+:\s*[^;,]+)(\s*})/g;
    if (content.match(interfacePropertyPattern)) {
      content = content.replace(interfacePropertyPattern, (match, prop, closing) => {
        if (!prop.trim().endsWith(';') && !prop.trim().endsWith(',')) {
          return prop + closing;
        }
        return match;
      });
      modified = true;
      console.log(`Fixed interface properties in ${filePath}`);
    }

    // Pattern 3: Look for malformed function closures before JSX
    const malformedClosurePattern = /(\s*}\s*)\n\s*return\s*\(/g;
    if (content.match(malformedClosurePattern)) {
      // This usually indicates a missing semicolon in a function before return
      console.log(`Found potential malformed closure pattern in ${filePath}`);
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

console.log('🔍 Fixing JSX-specific syntax errors...');

let fixedCount = 0;
problematicFiles.forEach(file => {
  if (fs.existsSync(file)) {
    if (fixJSXSyntaxErrors(file)) {
      fixedCount++;
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log(`✨ JSX fix complete: ${fixedCount}/${problematicFiles.length} files fixed`);