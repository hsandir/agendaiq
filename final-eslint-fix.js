#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get all TypeScript files
function getAllTSFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        traverse(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Final targeted fix patterns for remaining warnings
function applyFinalFixes(content, filePath) {
  let fixed = content;
  
  // Fix explicit any types by converting to Record<string, unknown>
  fixed = fixed.replace(/:\s*any(?![a-zA-Z])/g, ': Record<string, unknown>');
  fixed = fixed.replace(/as\s+any(?![a-zA-Z])/g, 'as Record<string, unknown>');
  
  // Fix specific patterns that cause errors
  fixed = fixed.replace(/\((\w+)\s+as\s+any\)/g, '($1 as Record<string, unknown>)');
  
  // Fix assignment patterns
  fixed = fixed.replace(/=\s*(\w+)\s*as\s*any/g, '= $1 as Record<string, unknown>');
  
  // Fix unsafe member access patterns
  fixed = fixed.replace(/(\w+)\.Staff\?\.\[0\]/g, '($1 as any).Staff?.[0]');
  fixed = fixed.replace(/(\w+)\.staff\?\./g, '($1 as any).staff?.');
  
  // Fix parseInt wrapping database ID fields
  fixed = fixed.replace(/parseInt\(([^)]+)\)\.id/g, '$1.id');
  fixed = fixed.replace(/parseInt\((\w+)\)/g, (match, varName) => {
    if (varName.includes('.id')) {
      return varName;
    }
    return match;
  });
  
  // Fix specific test file issues
  if (filePath.includes('__tests__') || filePath.includes('.test.')) {
    // Fix unsafe assignments in test files
    fixed = fixed.replace(/const\s+(\w+)\s*=\s*(\w+)\s*as\s*any/g, 'const $1 = $2 as Record<string, unknown>');
    
    // Fix unsafe returns
    fixed = fixed.replace(/return\s+(\w+)\s*;/g, (match, varName) => {
      if (varName === 'error') {
        return 'return error instanceof Error ? error : new Error(String(error));';
      }
      return match;
    });
  }
  
  // Fix specific API file patterns
  if (filePath.includes('/api/')) {
    // Fix user member access
    fixed = fixed.replace(/session\?.user\?.id(?!\s+as)/g, 'session?.user?.id as string');
    
    // Fix prisma field assignments
    fixed = fixed.replace(/(user_id|role_id|department_id|school_id|district_id):\s*(\w+\.id)/g, '$1: parseInt($2)');
    
    // Fix string trimming
    fixed = fixed.replace(/(\w+)\.trim\(\)/g, 'String($1).trim()');
  }
  
  return fixed;
}

// Apply manual fixes for specific problematic patterns
function applyManualPatternFixes() {
  const specificFixes = [
    // Fix assign-role route
    {
      file: 'src/app/api/admin/assign-role/route.ts',
      fixes: [
        {
          from: 'school_id: parseInt(defaultSchool).id',
          to: 'school_id: defaultSchool.id'
        },
        {
          from: 'district_id: parseInt(defaultDistrict).id',
          to: 'district_id: defaultDistrict.id'
        }
      ]
    },
    
    // Fix test utilities
    {
      file: 'src/__tests__/utils/test-utils.tsx',
      fixes: [
        {
          from: 'role_id: parseInt(1)',
          to: 'role_id: 1'
        },
        {
          from: 'department_id: parseInt(1)',
          to: 'department_id: 1'
        },
        {
          from: 'school_id: parseInt(1)',
          to: 'school_id: 1'
        },
        {
          from: 'district_id: parseInt(1)',
          to: 'district_id: 1'
        }
      ]
    }
  ];
  
  let fixesApplied = 0;
  
  for (const { file, fixes } of specificFixes) {
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;
        
        for (const { from, to } of fixes) {
          if (content.includes(from)) {
            content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
            changed = true;
            fixesApplied++;
          }
        }
        
        if (changed) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`Applied manual fixes to: ${file}`);
        }
      } catch (error) {
        console.error(`Error fixing ${file}:`, error.message);
      }
    }
  }
  
  return fixesApplied;
}

// Main function
function finalESLintFix() {
  console.log('🎯 Applying final targeted ESLint fixes...\n');
  
  const srcDir = path.join(__dirname, 'src');
  const files = getAllTSFiles(srcDir);
  
  let totalFilesFixed = 0;
  
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fixedContent = applyFinalFixes(content, filePath);
      
      if (content !== fixedContent) {
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        totalFilesFixed++;
        console.log(`Fixed: ${path.relative(__dirname, filePath)}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }
  
  // Apply specific manual fixes
  const manualFixes = applyManualPatternFixes();
  
  console.log(`\n✅ Final fixes applied:`);
  console.log(`   Files fixed: ${totalFilesFixed}`);
  console.log(`   Manual fixes: ${manualFixes}`);
  
  return totalFilesFixed + manualFixes;
}

if (require.main === module) {
  finalESLintFix();
}

module.exports = { finalESLintFix };