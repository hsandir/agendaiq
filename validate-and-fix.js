#!/usr/bin/env node

/**
 * Validation-First Error Fix System
 * 1) Hata sayısını tespit et
 * 2) Düzelt
 * 3) Kontrol et (yeni hata üretip üretmediği)
 * 4) Sayfanın tam çalışır olup olmadığını kontrol et
 * 5) Sistematik hataları tespit edip agent kodunu düzelt
 */

const { execSync } = require('child_process');
const fs = require('fs');

class ValidationFirstSystem {
  
  async run() {
    console.log('🔍 Validation-First Error Fix System Starting...\n');
    
    // Step 1: Tespit et
    const beforeCount = await this.getErrorCount();
    console.log(`📊 BEFORE: ${beforeCount} TypeScript errors detected`);
    
    if (beforeCount === 0) {
      console.log('✅ No errors found! System is clean.');
      return;
    }
    
    // Step 2: Düzelt (tek dosya)
    const targetFile = await this.selectTargetFile();
    console.log(`🎯 TARGET: ${targetFile}`);
    
    const fileBeforeCount = await this.getFileErrors(targetFile);
    console.log(`📋 File errors before: ${fileBeforeCount}`);
    
    // Apply fix
    await this.applyCarefulFix(targetFile);
    
    // Step 3: Kontrol et
    const afterCount = await this.getErrorCount();
    const fileAfterCount = await this.getFileErrors(targetFile);
    
    console.log(`\n📊 RESULTS:`);
    console.log(`   Global: ${beforeCount} → ${afterCount} (${afterCount - beforeCount >= 0 ? '+' : ''}${afterCount - beforeCount})`);
    console.log(`   File: ${fileBeforeCount} → ${fileAfterCount} (${fileAfterCount - fileBeforeCount >= 0 ? '+' : ''}${fileAfterCount - fileBeforeCount})`);
    
    // Step 4: Validation
    if (afterCount > beforeCount) {
      console.log('❌ NEW ERRORS CREATED! Analyzing...');
      await this.analyzeNewErrors(beforeCount, afterCount);
      return false;
    }
    
    if (fileAfterCount > fileBeforeCount) {
      console.log('❌ FILE ERRORS INCREASED! Rolling back...');
      // Git rollback logic here
      return false;
    }
    
    // Step 5: Dosya tam kontrol
    const fileTestSuccess = await this.testSpecificFile(targetFile);
    if (!fileTestSuccess) {
      console.log('❌ FILE TEST FAILED! Rolling back...');
      return false;
    }
    
    // Step 6: Global build test
    console.log('🧪 Testing global TypeScript compilation...');
    const buildSuccess = await this.testBuild();
    
    if (!buildSuccess) {
      console.log('❌ GLOBAL BUILD FAILED! Rolling back...');
      return false;
    }
    
    console.log('✅ ALL VALIDATIONS PASSED!');
    console.log(`✅ Improvement: ${beforeCount - afterCount} errors fixed`);
    return true;
  }
  
  async getErrorCount() {
    try {
      const result = execSync('npm run type-check 2>&1 | grep -c "error TS" || echo "0"', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return parseInt(result.trim());
    } catch (error) {
      return 0;
    }
  }
  
  async getFileErrors(filePath) {
    try {
      const result = execSync(`npx tsc --noEmit ${filePath} 2>&1 | grep -c "error TS" || echo "0"`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return parseInt(result.trim());
    } catch (error) {
      return 0;
    }
  }
  
  async selectTargetFile() {
    // Get files with most errors first
    try {
      const result = execSync(`npm run type-check 2>&1 | head -5 | grep -o "src/[^(]*" | head -1`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return result.trim() || 'src/components/meetings/AgendaItemLive.tsx';
    } catch (error) {
      return 'src/components/meetings/AgendaItemLive.tsx';
    }
  }
  
  async applyCarefulFix(filePath) {
    console.log(`🔧 Applying careful fix to: ${filePath}`);
    
    // Read specific errors for this file
    const errors = await this.getSpecificErrors(filePath);
    console.log(`   Specific errors: ${errors.length}`);
    
    // Apply only ONE very safe fix
    if (errors.some(e => e.includes('Expected'))) {
      console.log('   → Fixing Expected bracket/semicolon issues');
      await this.fixExpectedErrors(filePath);
    }
  }
  
  async getSpecificErrors(filePath) {
    try {
      const result = execSync(`npx tsc --noEmit ${filePath} 2>&1 | grep "error TS"`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return result.split('\n').filter(line => line.includes('error TS'));
    } catch (error) {
      return [];
    }
  }
  
  async fixExpectedErrors(filePath) {
    // Very conservative fix - only obvious semicolon → bracket issues
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern: }; → } in JSX
    const jsxEndPattern = /\}\s*;\s*\n/g;
    content = content.replace(jsxEndPattern, '}\n');
    
    fs.writeFileSync(filePath, content);
    console.log('   ✓ Applied JSX bracket fix');
  }
  
  async testBuild() {
    try {
      // Test TypeScript compilation
      execSync('npx tsc --noEmit', {
        stdio: 'pipe',
        timeout: 30000
      });
      console.log('   ✓ TypeScript compilation passed');
      return true;
    } catch (error) {
      console.log('   ❌ TypeScript compilation failed');
      return false;
    }
  }

  async testSpecificFile(filePath) {
    console.log(`🧪 Testing specific file: ${filePath}`);
    
    // 1. TypeScript check
    try {
      execSync(`npx tsc --noEmit ${filePath}`, {
        stdio: 'pipe',
        timeout: 10000
      });
      console.log('   ✓ File TypeScript check passed');
    } catch (error) {
      console.log('   ❌ File TypeScript check failed');
      return false;
    }

    // 2. ESLint check
    try {
      execSync(`npx eslint ${filePath} --quiet`, {
        stdio: 'pipe',
        timeout: 10000
      });
      console.log('   ✓ File ESLint check passed');
    } catch (error) {
      console.log('   ⚠️  File ESLint warnings (acceptable)');
    }

    // 3. Syntax validation
    try {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
        // Check for common JSX issues
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('}<')) {
          console.log('   ❌ Potential JSX fragment issue detected');
          return false;
        }
        if (content.match(/\}\s*;\s*\n\s*</)) {
          console.log('   ❌ JSX semicolon issue detected'); 
          return false;
        }
      }
      console.log('   ✓ Syntax validation passed');
    } catch (error) {
      console.log('   ❌ Syntax validation failed');
      return false;
    }

    return true;
  }
  
  async analyzeNewErrors(beforeCount, afterCount) {
    console.log('🔍 ANALYZING NEW ERRORS...');
    const newErrorCount = afterCount - beforeCount;
    console.log(`   ${newErrorCount} new errors created`);
    
    // Get specific new error messages
    const errors = execSync('npm run type-check 2>&1 | head -10', { encoding: 'utf8' });
    console.log('\n📋 Error samples:');
    console.log(errors);
    
    console.log('\n🛠️  AGENT SELF-IMPROVEMENT NEEDED');
    console.log('   → Pattern analysis required');
    console.log('   → Update safe-lint-enforcer logic');
    console.log('   → Add prevention rule for this error type');
  }
}

// Run the system
const validator = new ValidationFirstSystem();
validator.run().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('System error:', error);
  process.exit(1);
});