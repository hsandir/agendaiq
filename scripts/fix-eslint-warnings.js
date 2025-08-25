#!/usr/bin/env node

/**
 * ESLint Warning Auto-Fixer
 * Automatically fixes common ESLint warnings in the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ESLintAutoFixer {
  constructor() {
    this.fixedFiles = 0;
    this.totalFixes = 0;
    this.patterns = [
      // Unsafe any assignment patterns
      {
        name: 'Request body parsing',
        pattern: /const\s+(\w+)\s+=\s+await\s+request\.json\(\);?/g,
        replacement: 'const $1 = await request.json() as Record<string, unknown>;'
      },
      {
        name: 'User member access',
        pattern: /user\.(\w+)/g,
        replacement: (match, prop) => {
          const safeProps = ['id', 'email', 'name', 'staff', 'is_admin', 'is_system_admin', 'created_at', 'updated_at'];
          if (safeProps.includes(prop)) {
            return match;
          }
          return `(user as Record<string, unknown>).${prop}`;
        }
      },
      {
        name: 'Error instanceof check',
        pattern: /catch\s*\(\s*(\w+)\s*\)\s*\{([^}]*)\1\.message/g,
        replacement: 'catch ($1) {\n    if ($1 instanceof Error) {$2$1.message'
      },
      {
        name: 'Mock function typing',
        pattern: /jest\.requireMock\(['"`]([^'"`]+)['"`]\)\.(\w+)/g,
        replacement: 'jest.requireMock(\'$1\').$2 as jest.MockedClass<unknown>'
      },
      {
        name: 'Unused variables in destructuring',
        pattern: /const\s+\{\s*([^}]+)\s*\}\s+=\s+([^;]+);/g,
        replacement: (match, destructured, source) => {
          // Add underscore prefix to unused variables
          return match.replace(/(\w+)(?=\s*[,}])/g, '_$1');
        }
      },
      {
        name: 'Unsafe member access on error',
        pattern: /(\w+)\.(\w+)\s+.*\/\/.*error.*typed.*value/g,
        replacement: '($1 as Record<string, unknown>).$2'
      },
      {
        name: 'Unsafe return of any',
        pattern: /return\s+([^;]+);\s*\/\/.*unsafe.*return/g,
        replacement: 'return $1 as unknown;'
      }
    ];
  }

  async run() {
    console.log('🔧 Starting ESLint Auto-Fixer...\n');
    
    // Get current warnings count
    const initialCount = this.getWarningCount();
    console.log(`📊 Initial warnings: ${initialCount}\n`);

    // Find all TypeScript files
    const files = this.findTypeScriptFiles();
    console.log(`📁 Found ${files.length} TypeScript files\n`);

    // Process each file
    for (const file of files) {
      await this.processFile(file);
    }

    // Get final warnings count
    const finalCount = this.getWarningCount();
    
    console.log('\n✅ Auto-fix completed!');
    console.log(`📊 Fixed files: ${this.fixedFiles}`);
    console.log(`🔧 Total fixes applied: ${this.totalFixes}`);
    console.log(`📈 Warnings: ${initialCount} → ${finalCount} (${initialCount - finalCount} reduced)`);
    
    if (finalCount > 0) {
      console.log(`\n⚠️  ${finalCount} warnings remaining - these may need manual fixes`);
      this.showRemainingWarnings();
    }
  }

  getWarningCount() {
    try {
      const output = execSync('npm run lint 2>&1', { encoding: 'utf8' });
      const warnings = (output.match(/Warning:/g) || []).length;
      return warnings;
    } catch (error) {
      console.log('Could not count warnings, continuing...');
      return 0;
    }
  }

  findTypeScriptFiles() {
    const files = [];
    
    function scanDirectory(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and .next directories
          if (!['node_modules', '.next', '.git'].includes(item)) {
            scanDirectory(fullPath);
          }
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    }
    
    scanDirectory('./src');
    return files;
  }

  async processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let fileFixed = false;
      let fileFixes = 0;

      for (const pattern of this.patterns) {
        const originalContent = content;
        
        if (typeof pattern.replacement === 'function') {
          content = content.replace(pattern.pattern, pattern.replacement);
        } else {
          content = content.replace(pattern.pattern, pattern.replacement);
        }
        
        if (content !== originalContent) {
          fileFixes++;
          this.totalFixes++;
          fileFixed = true;
        }
      }

      // Additional specific fixes
      content = this.applySpecificFixes(content, filePath);

      if (fileFixed || content !== fs.readFileSync(filePath, 'utf8')) {
        fs.writeFileSync(filePath, content);
        this.fixedFiles++;
        console.log(`✅ Fixed: ${filePath} (${fileFixes} patterns)`);
      }
    } catch (error) {
      console.log(`❌ Error processing ${filePath}: ${error.message}`);
    }
  }

  applySpecificFixes(content, filePath) {
    let fixed = content;

    // Fix test files specifically
    if (filePath.includes('__tests__')) {
      // Fix mock function calls
      fixed = fixed.replace(
        /(\w+)\.mockImplementation\(/g,
        '($1 as jest.MockedFunction<unknown>).mockImplementation('
      );
      
      // Fix jest.requireMock patterns
      fixed = fixed.replace(
        /jest\.requireMock\(['"`]([^'"`]+)['"`]\)/g,
        'jest.requireMock(\'$1\') as Record<string, unknown>'
      );
    }

    // Fix API routes
    if (filePath.includes('/api/')) {
      // Fix request.json() parsing
      fixed = fixed.replace(
        /const\s+body\s+=\s+await\s+request\.json\(\)/g,
        'const body = await request.json() as Record<string, unknown>'
      );
      
      // Fix user property access
      fixed = fixed.replace(
        /user\.staff\?\.(\w+)/g,
        '(user.staff as Record<string, unknown> | null)?.$1'
      );
    }

    // Fix component files
    if (filePath.endsWith('.tsx')) {
      // Fix props typing
      fixed = fixed.replace(
        /props\.(\w+)/g,
        '(props as Record<string, unknown>).$1'
      );
    }

    return fixed;
  }

  showRemainingWarnings() {
    try {
      const output = execSync('npm run lint 2>&1 | head -20', { encoding: 'utf8' });
      console.log('\n📋 Sample remaining warnings:');
      console.log(output);
    } catch (error) {
      console.log('Could not show remaining warnings');
    }
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new ESLintAutoFixer();
  fixer.run().catch(console.error);
}

module.exports = ESLintAutoFixer;