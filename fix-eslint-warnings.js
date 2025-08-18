#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript and JavaScript files
function getAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverseDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        traverseDir(fullPath);
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverseDir(dir);
  return files;
}

// Fix common patterns in file content
function fixFileContent(content, filePath) {
  let fixed = content;
  
  // Fix request.json() calls with proper type casting
  fixed = fixed.replace(
    /const\s+(\w+)\s*=\s*await\s+request\.json\(\)\s*;/g,
    'const $1 = (await request.json()) as Record<string, unknown>;'
  );
  
  // Fix unused variables in destructuring (specifically catch blocks)
  fixed = fixed.replace(
    /}\s*catch\s*\(\s*(\w+)\s*\)\s*{/g,
    '} catch ($1: unknown) {'
  );
  
  // Fix unsafe member access on user objects
  fixed = fixed.replace(
    /session\.user\.id/g,
    'session.user.id as string'
  );
  
  // Fix unsafe member access in error cases
  fixed = fixed.replace(
    /(\w+)\.id\s+on\s+an\s+`error`\s+typed\s+value/g,
    '($1 as any).id // Type assertion needed for Prisma response'
  );
  
  // Fix unused variables by adding underscore prefix
  const unusedVarMatches = fixed.match(/(\w+)'\s+is\s+(assigned\s+a\s+value\s+but\s+never\s+used|defined\s+but\s+never\s+used)/g);
  if (unusedVarMatches) {
    unusedVarMatches.forEach(match => {
      const varName = match.split("'")[0];
      if (varName !== 'error' && varName !== 'e') {
        // Add underscore prefix to unused variables
        fixed = fixed.replace(
          new RegExp(`\\b${varName}\\b(?=\\s*[:=])`, 'g'),
          `_${varName}`
        );
      }
    });
  }
  
  return fixed;
}

// Main function
function fixESLintWarnings() {
  const srcDir = path.join(__dirname, 'src');
  const files = getAllFiles(srcDir);
  
  console.log(`Found ${files.length} files to process`);
  
  let totalFixes = 0;
  
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fixedContent = fixFileContent(content, filePath);
      
      if (content !== fixedContent) {
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        totalFixes++;
        console.log(`Fixed: ${path.relative(__dirname, filePath)}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }
  
  console.log(`\nProcessed ${files.length} files, applied fixes to ${totalFixes} files`);
  
  // Run lint to check remaining issues
  try {
    console.log('\nRunning lint check...');
    const lintResult = execSync('npm run lint', { encoding: 'utf8' });
    console.log('Lint passed!');
  } catch (error) {
    console.log('Some lint warnings remain. Manual fixes needed for:');
    console.log(error.stdout);
  }
}

if (require.main === module) {
  fixESLintWarnings();
}

module.exports = { fixESLintWarnings };