#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// Get current build errors
function getCurrentErrors() {
  try {
    execSync('npm run build', { stdio: 'pipe' });
    return []; // No errors
  } catch (error) {
    const output = error.stdout?.toString() || error.message;
    return output;
  }
}

// Extract file paths and line numbers from error output
function parseErrors(errorOutput) {
  const errors = [];
  const errorRegex = /\.\/([\w\/\-\.]+\.tsx?):(\d+):\d+/g;
  let match;
  
  while ((match = errorRegex.exec(errorOutput)) !== null) {
    const [, filePath, lineNumber] = match;
    
    // Extract error context
    const contextMatch = errorOutput.match(new RegExp(`${lineNumber}→(.+)`));
    if (contextMatch) {
      errors.push({
        file: filePath,
        line: parseInt(lineNumber),
        context: contextMatch[1].trim()
      });
    }
  }
  
  return errors.slice(0, 5); // Limit to first 5 errors
}

function quickFixSemicolons(errors) {
  let fixedCount = 0;
  
  errors.forEach(({ file, line, context }) => {
    const fullPath = `/Users/hs/Project/agendaiq/${file}`;
    if (!fs.existsSync(fullPath)) return;
    
    try {
      const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
      if (line > lines.length) return;
      
      const originalLine = lines[line - 1];
      let fixed = false;
      
      // Pattern 1: Extra semicolon in object literals
      if (originalLine.includes(';},') || originalLine.includes(';];')) {
        lines[line - 1] = originalLine.replace(/;([\]\}],?)/g, '$1');
        fixed = true;
      }
      
      // Pattern 2: Missing newline after semicolon
      if (originalLine.includes("'import")) {
        lines[line - 1] = originalLine.replace(/(')\s*import/, '$1\nimport');
        fixed = true;
      }
      
      // Pattern 3: Semicolon instead of comma in function calls
      if (originalLine.includes(');')) {
        if (originalLine.includes('filter(') || originalLine.includes('some(')) {
          lines[line - 1] = originalLine.replace(/\);$/, ')');
          fixed = true;
        }
      }
      
      // Pattern 4: Semicolon instead of comma in Promise.all
      if (originalLine.includes('count();')) {
        lines[line - 1] = originalLine.replace(/count\(\);/, 'count(),');
        fixed = true;
      }
      
      if (fixed) {
        fs.writeFileSync(fullPath, lines.join('\n'));
        console.log(`✅ Fixed ${file}:${line}`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`❌ Error fixing ${file}:`, error.message);
    }
  });
  
  return fixedCount;
}

console.log('🔍 Quick semicolon fix...');

const errorOutput = getCurrentErrors();
if (!errorOutput) {
  console.log('✨ No build errors found!');
  process.exit(0);
}

const errors = parseErrors(errorOutput);
console.log(`Found ${errors.length} errors to fix:`);
errors.forEach(({ file, line }) => console.log(`  - ${file}:${line}`));

const fixedCount = quickFixSemicolons(errors);
console.log(`✨ Quick fix complete: ${fixedCount} errors fixed`);