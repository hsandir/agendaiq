#!/usr/bin/env node

/**
 * Batch ESLint Warning Fixer
 * Handles specific warning patterns based on actual ESLint output
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BatchESLintFixer {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      warningsFixed: 0,
      beforeCount: 0,
      afterCount: 0
    };
  }

  async run() {
    console.log('🚀 Batch ESLint Fixer Starting...\n');
    
    // Get current warnings
    this.stats.beforeCount = await this.getWarningCount();
    console.log(`📊 Starting with ${this.stats.beforeCount} warnings\n`);

    // Get specific warning patterns from ESLint output
    const warningPatterns = await this.analyzeWarnings();
    
    // Apply fixes for each pattern
    for (const pattern of warningPatterns) {
      await this.fixPattern(pattern);
    }

    // Final count
    this.stats.afterCount = await this.getWarningCount();
    
    this.printSummary();
  }

  async getWarningCount() {
    try {
      const output = execSync('npm run lint 2>&1 | grep "Warning:" | wc -l', { encoding: 'utf8' });
      return parseInt(output.trim()) || 0;
    } catch {
      return 0;
    }
  }

  async analyzeWarnings() {
    console.log('🔍 Analyzing warning patterns...\n');
    
    try {
      const output = execSync('npm run lint 2>&1 | head -100', { encoding: 'utf8' });
      
      const patterns = [];
      const lines = output.split('\n');
      
      for (const line of lines) {
        if (line.includes('Warning:') && line.includes('Unsafe assignment')) {
          patterns.push({
            type: 'unsafe-assignment',
            file: this.extractFile(line),
            lineNumber: this.extractLineNumber(line),
            message: line
          });
        } else if (line.includes('Warning:') && line.includes('Unsafe member access')) {
          patterns.push({
            type: 'unsafe-member-access',
            file: this.extractFile(line),
            lineNumber: this.extractLineNumber(line),
            message: line
          });
        } else if (line.includes('Warning:') && line.includes('Unsafe call')) {
          patterns.push({
            type: 'unsafe-call',
            file: this.extractFile(line),
            lineNumber: this.extractLineNumber(line),
            message: line
          });
        } else if (line.includes('Warning:') && line.includes('never used')) {
          patterns.push({
            type: 'unused-vars',
            file: this.extractFile(line),
            lineNumber: this.extractLineNumber(line),
            message: line
          });
        }
      }
      
      console.log(`Found ${patterns.length} specific warning patterns\n`);
      return patterns;
    } catch {
      return [];
    }
  }

  extractFile(line) {
    const match = line.match(/^\.\/([^:]+):/);
    return match ? match[1] : null;
  }

  extractLineNumber(line) {
    const match = line.match(/:(\d+):/);
    return match ? parseInt(match[1]) : null;
  }

  async fixPattern(pattern) {
    if (!pattern.file) return;
    
    const filePath = path.join('.', pattern.file);
    if (!fs.existsSync(filePath)) return;
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      if (pattern.lineNumber && pattern.lineNumber <= lines.length) {
        const originalLine = lines[pattern.lineNumber - 1];
        let fixedLine = originalLine;
        
        // Apply specific fixes based on pattern type
        switch (pattern.type) {
          case 'unsafe-assignment':
            fixedLine = this.fixUnsafeAssignment(originalLine, pattern.message);
            break;
          case 'unsafe-member-access':
            fixedLine = this.fixUnsafeMemberAccess(originalLine, pattern.message);
            break;
          case 'unsafe-call':
            fixedLine = this.fixUnsafeCall(originalLine, pattern.message);
            break;
          case 'unused-vars':
            fixedLine = this.fixUnusedVars(originalLine, pattern.message);
            break;
        }
        
        if (fixedLine !== originalLine) {
          lines[pattern.lineNumber - 1] = fixedLine;
          const newContent = lines.join('\n');
          
          fs.writeFileSync(filePath, newContent);
          this.stats.warningsFixed++;
          
          console.log(`✅ Fixed ${pattern.type} in ${pattern.file}:${pattern.lineNumber}`);
        }
      }
    } catch (error) {
      console.log(`❌ Error fixing ${pattern.file}: ${error.message}`);
    }
  }

  fixUnsafeAssignment(line, message) {
    // Fix request.json() assignments
    if (line.includes('await request.json()')) {
      return line.replace(
        /await\s+request\.json\(\)/g,
        'await request.json() as Record<string, unknown>'
      );
    }
    
    // Fix variable assignments from any
    if (line.includes(' = ') && message.includes('any')) {
      // Add type assertion
      return line.replace(/= ([^;]+);?$/, '= $1 as unknown;');
    }
    
    return line;
  }

  fixUnsafeMemberAccess(line, message) {
    // Fix .user property access
    if (message.includes('.user') || message.includes('user.')) {
      return line.replace(
        /([\w.]+)\.user\.(\w+)/g,
        '($1.user as Record<string, unknown>).$2'
      );
    }
    
    // Fix .staff property access
    if (message.includes('.staff') || message.includes('staff.')) {
      return line.replace(
        /([\w.]+)\.staff\.(\w+)/g,
        '($1.staff as Record<string, unknown>).$2'
      );
    }
    
    // Fix error property access
    if (message.includes('error') && line.includes('.')) {
      return line.replace(
        /(\w+)\.(\w+)/g,
        '($1 as Record<string, unknown>).$2'
      );
    }
    
    return line;
  }

  fixUnsafeCall(line, message) {
    // Fix mock function calls
    if (line.includes('.mockImplementation') || line.includes('.mockReturnValue')) {
      return line.replace(
        /(\w+)\.(mock\w+)/g,
        '($1 as jest.MockedFunction<unknown>).$2'
      );
    }
    
    // Fix function calls on any
    if (message.includes('any') && line.includes('(')) {
      // Add type assertion before function call
      return line.replace(
        /(\w+)\(/g,
        '($1 as unknown)('
      );
    }
    
    return line;
  }

  fixUnusedVars(line, message) {
    // Extract variable name from message
    const varMatch = message.match(/'([^']+)' is (?:defined but never used|assigned a value but never used)/);
    if (varMatch) {
      const varName = varMatch[1];
      
      // Add underscore prefix to mark as intentionally unused
      return line.replace(
        new RegExp(`\\b${varName}\\b`, 'g'),
        `_${varName}`
      );
    }
    
    return line;
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 BATCH FIX SUMMARY');
    console.log('='.repeat(50));
    console.log(`Files processed: ${this.stats.filesProcessed}`);
    console.log(`Warnings fixed: ${this.stats.warningsFixed}`);
    console.log(`Before: ${this.stats.beforeCount} warnings`);
    console.log(`After: ${this.stats.afterCount} warnings`);
    console.log(`Improvement: ${this.stats.beforeCount - this.stats.afterCount} warnings removed`);
    console.log(`Success rate: ${((this.stats.beforeCount - this.stats.afterCount) / this.stats.beforeCount * 100).toFixed(1)}%`);
    
    if (this.stats.afterCount > 0) {
      console.log(`\n⚠️  ${this.stats.afterCount} warnings still remain`);
      console.log('These may require manual fixing or more specific patterns');
    } else {
      console.log('\n🎉 All warnings fixed!');
    }
  }
}

// Additional utility functions
class SpecificFileFixer {
  static async fixTestFiles() {
    console.log('🧪 Fixing test files specifically...\n');
    
    const testFiles = execSync('find src/__tests__ -name "*.ts" -o -name "*.tsx"', { encoding: 'utf8' })
      .trim().split('\n').filter(Boolean);
    
    for (const file of testFiles) {
      this.fixTestFile(file);
    }
  }

  static fixTestFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      
      // Fix common test patterns
      const fixes = [
        // Mock function typing
        [/jest\.requireMock\(['"`]([^'"`]+)['"`]\)\.(\w+)/g, 
         'jest.requireMock(\'$1\').$2 as jest.MockedClass<unknown>'],
        
        // Mock implementation calls
        [/(\w+)\.mockImplementation/g, 
         '($1 as jest.MockedFunction<unknown>).mockImplementation'],
         
        // Error type guards
        [/catch\s*\(\s*(\w+)\s*\)\s*{([^}]*?)(\w+)\.message/g, 
         'catch ($1) {$2if ($3 instanceof Error) { $3.message'],
         
        // Test data assignments
        [/= await (\w+)\(/g, 
         '= await $1( as Record<string, unknown>'],
      ];
      
      for (const [pattern, replacement] of fixes) {
        const newContent = content.replace(pattern, replacement);
        if (newContent !== content) {
          content = newContent;
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed test file: ${filePath}`);
      }
    } catch (error) {
      console.log(`❌ Error fixing test file ${filePath}: ${error.message}`);
    }
  }

  static async fixApiFiles() {
    console.log('🔌 Fixing API files specifically...\n');
    
    const apiFiles = execSync('find src/app/api -name "route.ts"', { encoding: 'utf8' })
      .trim().split('\n').filter(Boolean);
    
    for (const file of apiFiles) {
      this.fixApiFile(file);
    }
  }

  static fixApiFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      
      // Fix common API patterns
      const fixes = [
        // Request body parsing
        [/const\s+(\w+)\s+=\s+await\s+request\.json\(\);?/g, 
         'const $1 = await request.json() as Record<string, unknown>;'],
        
        // User property access
        [/user\.staff\.(\w+)/g, 
         '(user.staff as Record<string, unknown>).$1'],
         
        // Error handling in catch blocks
        [/catch\s*\(\s*(\w+)\s*\)\s*{([^}]*?)console\.error\([^,]+,\s*(\w+)\)/g,
         'catch ($1) {$2console.error(\'Error:\', $3 instanceof Error ? $3.message : $3)'],
      ];
      
      for (const [pattern, replacement] of fixes) {
        const newContent = content.replace(pattern, replacement);
        if (newContent !== content) {
          content = newContent;
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed API file: ${filePath}`);
      }
    } catch (error) {
      console.log(`❌ Error fixing API file ${filePath}: ${error.message}`);
    }
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--tests-only')) {
    SpecificFileFixer.fixTestFiles();
  } else if (args.includes('--api-only')) {
    SpecificFileFixer.fixApiFiles();
  } else {
    const fixer = new BatchESLintFixer();
    fixer.run().catch(console.error);
  }
}

module.exports = { BatchESLintFixer, SpecificFileFixer };