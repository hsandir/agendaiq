#!/usr/bin/env node

/**
 * TypeScript Unsafe Type Casting Fixer
 * 
 * This script detects and fixes dangerous type casting patterns that cause syntax errors.
 * Specifically targets patterns like:
 * - (user as Record<string, unknown>)
 * - Multiple chained type assertions
 * - Various unsafe casting patterns
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class TypeCastingFixer {
  constructor() {
    this.fixedFiles = [];
    this.patterns = [
      {
        name: 'Record<string, unknown> casting',
        regex: /\(([^)]+)\s+as\s+Record<string,\s*unknown>\)/g,
        replacement: '$1',
        description: 'Remove dangerous Record<string, unknown> casting'
      },
      {
        name: 'Chained as Record casting',
        regex: /as\s+Record<string,\s*unknown>\s*as\s+([^;]+);/g,
        replacement: 'as $1;',
        description: 'Fix chained Record casting'
      },
      {
        name: 'Property access with Record casting',
        regex: /\(([^)]+)\s+as\s+Record<string,\s*unknown>\)\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
        replacement: '$1.$2',
        description: 'Remove Record casting from property access'
      },
      {
        name: 'Double chained casting',
        regex: /as\s+Record<string,\s*unknown>\s*as\s+Record<string,\s*unknown>\s*;\s*as\s+([^;]+);/g,
        replacement: 'as $1;',
        description: 'Fix triple chained casting'
      },
      {
        name: 'Method call with Record casting',
        regex: /\(([^)]+)\s+as\s+Record<string,\s*unknown>\)\.([a-zA-Z_][a-zA-Z0-9_]*)\(/g,
        replacement: '$1.$2(',
        description: 'Remove Record casting from method calls'
      }
    ];
  }

  async scanAndFix() {
    console.log('🔍 Scanning for unsafe type casting patterns...');
    
    try {
      // Find all TypeScript files
      const { stdout } = await execAsync(
        'find src/ -name "*.ts" -o -name "*.tsx" | grep -v node_modules',
        { cwd: process.cwd() }
      );

      const files = stdout.trim().split('\n').filter(Boolean);
      console.log(`📁 Found ${files.length} TypeScript files to analyze`);

      let totalViolations = 0;
      let totalFixes = 0;

      for (const file of files) {
        const violations = await this.fixFile(file);
        totalViolations += violations.found;
        totalFixes += violations.fixed;
      }

      console.log('\n📊 SUMMARY');
      console.log('='.repeat(50));
      console.log(`Total files scanned: ${files.length}`);
      console.log(`Total violations found: ${totalViolations}`);
      console.log(`Total fixes applied: ${totalFixes}`);
      console.log(`Files modified: ${this.fixedFiles.length}`);
      
      if (this.fixedFiles.length > 0) {
        console.log('\n🔧 Modified files:');
        this.fixedFiles.forEach(file => console.log(`  ✓ ${file}`));
        
        console.log('\n⚠️  IMPORTANT: Please review the changes and run tests!');
        console.log('💡 Consider running ESLint to catch any remaining issues');
      }

      return { totalViolations, totalFixes, modifiedFiles: this.fixedFiles };

    } catch (error) {
      console.error('❌ Error during scanning:', error);
      throw error;
    }
  }

  async fixFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let modifiedContent = content;
      let violationsFound = 0;
      let fixesApplied = 0;

      // Apply each pattern fix
      for (const pattern of this.patterns) {
        const matches = content.match(pattern.regex) || [];
        violationsFound += matches.length;

        if (matches.length > 0) {
          console.log(`🚨 ${filePath}: Found ${matches.length} instances of '${pattern.name}'`);
          modifiedContent = modifiedContent.replace(pattern.regex, pattern.replacement);
          fixesApplied += matches.length;
        }
      }

      // Additional specific fixes for known problematic patterns
      modifiedContent = this.applySpecificFixes(modifiedContent, filePath);

      // Only write if changes were made
      if (modifiedContent !== content) {
        // Create backup
        const backupPath = `${filePath}.backup-${Date.now()}`;
        fs.writeFileSync(backupPath, content);
        
        // Write fixed content
        fs.writeFileSync(filePath, modifiedContent);
        
        if (!this.fixedFiles.includes(filePath)) {
          this.fixedFiles.push(filePath);
        }
        
        console.log(`✅ Fixed ${fixesApplied} issues in ${filePath} (backup: ${backupPath})`);
      }

      return { found: violationsFound, fixed: fixesApplied };

    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error);
      return { found: 0, fixed: 0 };
    }
  }

  applySpecificFixes(content, filePath) {
    let fixed = content;

    // Fix specific patterns we found in the codebase
    const specificFixes = [
      // Fix user as Record pattern in auth contexts
      {
        from: /\(user as Record<string, unknown>\)\.hashedPassword/g,
        to: 'user.hashedPassword',
        desc: 'Fix user hashedPassword access'
      },
      {
        from: /\(user as Record<string, unknown>\)\.two_factor_enabled/g,
        to: 'user.two_factor_enabled',
        desc: 'Fix two factor enabled access'
      },
      {
        from: /\(user as Record<string, unknown>\)\.two_factor_secret/g,
        to: 'user.two_factor_secret',
        desc: 'Fix two factor secret access'
      },
      {
        from: /\(user as Record<string, unknown>\)\.backup_codes/g,
        to: 'user.backup_codes',
        desc: 'Fix backup codes access'
      },
      {
        from: /\(user as Record<string, unknown>\)\.is_school_admin/g,
        to: 'user.is_school_admin',
        desc: 'Fix school admin check'
      },
      {
        from: /\(user as Record<string, unknown>\)\.capabilities/g,
        to: 'user.capabilities',
        desc: 'Fix capabilities access'
      },
      {
        from: /\(user as Record<string, unknown>\)\.roleKey/g,
        to: 'user.roleKey',
        desc: 'Fix roleKey access'
      },
      // Fix level casting patterns
      {
        from: /entry\.level as Record<string, unknown>/g,
        to: 'entry.level',
        desc: 'Fix log level casting'
      },
      // Fix router patterns
      {
        from: /router\.push\(([^)]+) as Record<string, unknown>\)/g,
        to: 'router.push($1)',
        desc: 'Fix router push casting'
      }
    ];

    specificFixes.forEach(fix => {
      if (fix.from.test(fixed)) {
        console.log(`  🔧 Applying specific fix: ${fix.desc}`);
        fixed = fixed.replace(fix.from, fix.to);
      }
    });

    return fixed;
  }

  async generateReport() {
    console.log('\n📋 Generating detailed report...');
    
    try {
      const { stdout } = await execAsync(
        'grep -rn "as Record<string, unknown>" src/ --include="*.ts" --include="*.tsx" | wc -l || echo 0',
        { cwd: process.cwd() }
      );

      const remainingViolations = parseInt(stdout.trim()) || 0;
      
      const report = {
        timestamp: new Date().toISOString(),
        remainingViolations,
        fixedFiles: this.fixedFiles,
        recommendations: [
          'Run ESLint to catch any remaining type issues',
          'Add proper TypeScript interfaces for complex objects',
          'Use type guards for runtime type checking',
          'Consider using discriminated unions for better type safety'
        ]
      };

      const reportPath = path.join(process.cwd(), 'logs', 'type-casting-fix-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`📄 Report saved to: ${reportPath}`);
      console.log(`🎯 Remaining violations: ${remainingViolations}`);
      
      return report;

    } catch (error) {
      console.error('❌ Error generating report:', error);
    }
  }
}

// CLI interface
if (require.main === module) {
  const fixer = new TypeCastingFixer();
  
  console.log('🚀 TypeScript Unsafe Type Casting Fixer');
  console.log('=========================================');
  
  fixer.scanAndFix()
    .then(() => fixer.generateReport())
    .then(() => {
      console.log('\n✅ Type casting fix completed successfully!');
      console.log('💡 Next steps:');
      console.log('  1. Review the modified files');
      console.log('  2. Run npm run lint to check for any remaining issues');
      console.log('  3. Run npm run build to ensure everything compiles');
      console.log('  4. Run tests to verify functionality');
    })
    .catch(error => {
      console.error('\n❌ Type casting fix failed:', error);
      process.exit(1);
    });
}

module.exports = TypeCastingFixer;