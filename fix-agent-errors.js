#!/usr/bin/env node

/**
 * Fix TypeScript Lint Enforcer Agent Errors
 * Automatically fixes common errors introduced by the agent
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing TypeScript Lint Enforcer Agent errors...');

// Category 1: Fix Invalid Variable Names (____variable, __variable)
function fixInvalidVariableNames(content) {
  // Fix ____variable names
  content = content.replace(/____(\w+)/g, '$1');
  // Fix __variable names (but keep proper TypeScript private names)
  content = content.replace(/\b__([a-z]\w+)/g, '$1');
  return content;
}

// Category 2: Fix Missing Semicolons
function fixMissingSemicolons(content) {
  // Add semicolons after function calls without semicolons
  content = content.replace(/(\w+\([^)]*\))\s*\n/g, '$1;\n');
  // Add semicolons after withAuth calls
  content = content.replace(/(await withAuth\([^)]+\))\s*\n/g, '$1;\n');
  // Add semicolons after return statements without semicolons
  content = content.replace(/(return NextResponse\.json\([^}]+\})\)\s*\n/g, '$1);\n');
  return content;
}

// Category 3: Fix Missing File Endings
function fixMissingFileEndings(content) {
  const lines = content.split('\n');
  let openBraces = 0;
  let inFunction = false;
  
  for (const line of lines) {
    if (line.includes('export async function') || line.includes('export function')) {
      inFunction = true;
    }
    openBraces += (line.match(/\{/g) || []).length;
    openBraces -= (line.match(/\}/g) || []).length;
  }
  
  // Add missing closing braces
  while (openBraces > 0) {
    content += '\n}';
    openBraces--;
  }
  
  return content;
}

// Category 4: Fix Broken Type Casting
function fixBrokenTypeCasting(content) {
  // Fix auth.(user.staff patterns
  content = content.replace(/auth\.\(user\./g, '(auth.user.');
  // Fix other broken casting patterns
  content = content.replace(/\.\(([^)]+) as ([^)]+)\)/g, '.($1 as $2)');
  return content;
}

// Category 5: Fix Missing/Broken Exports
function fixExports(content) {
  // Ensure exports are properly formatted
  if (content.includes('export async function') && !content.match(/export\s+async\s+function\s+\w+/)) {
    content = content.replace(/export\s+function/g, 'export async function');
  }
  return content;
}

// Main fix function
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  try {
    // Apply all fixes
    content = fixInvalidVariableNames(content);
    content = fixMissingSemicolons(content);
    content = fixBrokenTypeCasting(content);
    content = fixExports(content);
    content = fixMissingFileEndings(content);
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
  
  return false;
}

// Find and fix all TypeScript files
const files = glob.sync('src/**/*.{ts,tsx}', { cwd: process.cwd() });
let fixedCount = 0;

for (const file of files) {
  if (fixFile(file)) {
    fixedCount++;
  }
}

console.log(`\n🎉 Fixed ${fixedCount} files out of ${files.length} total files.`);
console.log('💡 Run "npm run build" to verify fixes.');