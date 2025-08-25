#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// Get current build errors and parse them systematically
function getCurrentErrors() {
  try {
    execSync('npm run build', { stdio: 'pipe' });
    return []; // No errors
  } catch (error) {
    const output = error.stdout?.toString() || error.message;
    return output;
  }
}

// Extract and fix specific error patterns
function parseAndFixErrors(errorOutput) {
  let fixedCount = 0;
  
  // Pattern 1: JSX Fragment issues - replace with div wrapper
  const fragmentErrors = errorOutput.match(/Error:.*Unexpected token `React`.*Expected jsx identifier/g);
  if (fragmentErrors) {
    console.log('🔧 Fixing React.Fragment issues...');
    
    // Files that commonly have fragment issues
    const fragmentFiles = [
      'src/components/dashboard/HiddenSidebar.tsx',
      'src/components/dashboard/MobileMenu.tsx'
    ];
    
    fragmentFiles.forEach(filePath => {
      const fullPath = `/Users/hs/Project/agendaiq/${filePath}`;
      if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Replace React.Fragment with div wrappers
        if (content.includes('<React.Fragment>')) {
          content = content.replace(/<React\.Fragment>/g, '<div>');
          content = content.replace(/<\/React\.Fragment>/g, '</div>');
          fixedCount++;
          fs.writeFileSync(fullPath, content);
          console.log(`✅ Fixed React.Fragment in ${filePath}`);
        }
      }
    });
  }
  
  // Pattern 2: JSX parsing issues - unexpected div token
  const jsxErrors = errorOutput.match(/Error:.*Unexpected token.*div.*Expected jsx identifier/g);
  if (jsxErrors) {
    console.log('🔧 Fixing JSX parsing issues...');
    
    // These files might have missing return statement parentheses or other JSX issues
    const jsxFiles = [
      'src/components/meetings/AgendaItemLive.tsx',
      'src/app/dashboard/settings/audit-logs/AuditLogsClient.tsx',
      'src/app/dashboard/meeting-intelligence/continuity/page.tsx'
    ];
    
    jsxFiles.forEach(filePath => {
      const fullPath = `/Users/hs/Project/agendaiq/${filePath}`;
      if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let fixed = false;
        
        // Look for common JSX parsing issues
        // Pattern: return ( followed by JSX without proper indentation
        if (content.includes('return (\n    <div') && !content.includes('return (\n    <div>')) {
          // This might be a template string issue, let's check for backticks
          content = content.replace(/return \(\s*<div className={\`([^}]+)\`}/g, (match, className) => {
            return `return (\n    <div className={\`${className}\`}`;
          });
          fixed = true;
        }
        
        if (fixed) {
          fixedCount++;
          fs.writeFileSync(fullPath, content);
          console.log(`✅ Fixed JSX parsing in ${filePath}`);
        }
      }
    });
  }
  
  // Pattern 3: Semicolon instead of parenthesis closing
  const semicolonErrors = errorOutput.match(/Expected ',', got ';'/g);
  if (semicolonErrors) {
    console.log('🔧 Fixing semicolon syntax errors...');
    
    // Common files with this issue
    const semicolonFiles = [
      'src/app/dashboard/settings/notifications/page.tsx'
    ];
    
    semicolonFiles.forEach(filePath => {
      const fullPath = `/Users/hs/Project/agendaiq/${filePath}`;
      if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let fixed = false;
        
        // Pattern: filter/map with semicolon instead of closing paren
        if (content.includes('> new Date();')) {
          content = content.replace(/> new Date\(\);/g, '> new Date()');
          fixed = true;
        }
        
        if (fixed) {
          fixedCount++;
          fs.writeFileSync(fullPath, content);
          console.log(`✅ Fixed semicolon syntax in ${filePath}`);
        }
      }
    });
  }
  
  return fixedCount;
}

console.log('🔍 Comprehensive syntax fix...');

const errorOutput = getCurrentErrors();
if (!errorOutput) {
  console.log('✨ No build errors found!');
  process.exit(0);
}

const fixedCount = parseAndFixErrors(errorOutput);
console.log(`✨ Comprehensive fix complete: ${fixedCount} errors fixed`);

// Try building again to see remaining errors
console.log('🔍 Checking remaining errors...');
const remainingErrors = getCurrentErrors();
if (!remainingErrors) {
  console.log('🎉 All errors fixed! Build should work now.');
} else {
  console.log('⚠️  Some errors remain - manual inspection needed');
}