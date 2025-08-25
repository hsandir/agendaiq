#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with JSX fragment syntax errors
const filesToFix = [
  'src/components/dashboard/HiddenSidebar.tsx',
  'src/components/dashboard/MobileMenu.tsx',
  'src/app/dashboard/meeting-intelligence/continuity/page.tsx'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    let updated = false;
    
    // Fix common JSX fragment parsing issues
    let newContent = content;
    
    // Pattern 1: Missing ) before (<>
    if (newContent.includes('return (\n    <>')) {
      newContent = newContent.replace(/return \(\n(\s*)<>/g, 'return (\n$1<>');
      updated = true;
    }
    
    // Pattern 2: Trailing semicolons in ternary expressions
    if (newContent.includes('?.toLowerCase();')) {
      newContent = newContent.replace(/\.toLowerCase\(\);/g, '.toLowerCase()');
      updated = true;
    }

    // Pattern 3: Handle React.Fragment syntax issues
    if (newContent.includes('return (\n    <>') || newContent.includes('return (<>')) {
      // Ensure proper formatting
      newContent = newContent.replace(/return \(\s*<>/g, 'return (\n    <>');
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(fullPath, newContent);
      console.log(`✅ Fixed ${filePath}`);
    } else {
      console.log(`ℹ️  No fixes needed for ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
});

console.log('🎯 JSX fragment fix complete');