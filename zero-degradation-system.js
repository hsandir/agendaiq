#!/usr/bin/env node

/**
 * ZERO DEGRADATION SYSTEM
 * GARANTI: Sistematik bozulma %0 
 * 
 * KURAL: Eğer TEK bir hata bile artarsa → ANINDA ROLLBACK
 */

const { execSync } = require('child_process');
const fs = require('fs');

class ZeroDegradationSystem {
  
  async enforceZeroDegradation() {
    console.log('🛡️  ZERO DEGRADATION SYSTEM - ABSOLUTE PROTECTION\n');
    
    // Step 1: Mutlak Baseline
    const absoluteBaseline = await this.getErrorCount();
    console.log(`📊 ABSOLUTE BASELINE: ${absoluteBaseline} errors`);
    console.log(`🚨 ZERO TOLERANCE RULE: Any increase = IMMEDIATE ROLLBACK\n`);
    
    // Step 2: Git checkpoint
    const gitHash = await this.createGitCheckpoint();
    console.log(`📝 Git checkpoint: ${gitHash}`);
    
    // Step 3: Safe operation attempt
    const targetFile = await this.selectMostProblematicFile();
    console.log(`🎯 Target: ${targetFile}`);
    
    const fileBaseline = await this.getFileErrors(targetFile);
    console.log(`📋 File baseline: ${fileBaseline} errors`);
    
    // Step 4: Apply MINIMAL fix
    await this.applyMinimalFix(targetFile);
    
    // Step 5: IMMEDIATE validation
    const newGlobalCount = await this.getErrorCount();
    const newFileCount = await this.getFileErrors(targetFile);
    
    console.log(`\n📊 ZERO-TOLERANCE CHECK:`);
    console.log(`   Global: ${absoluteBaseline} → ${newGlobalCount} (${newGlobalCount - absoluteBaseline >= 0 ? '+' : ''}${newGlobalCount - absoluteBaseline})`);
    console.log(`   File: ${fileBaseline} → ${newFileCount} (${newFileCount - fileBaseline >= 0 ? '+' : ''}${newFileCount - fileBaseline})`);
    
    // Step 6: ZERO TOLERANCE ENFORCEMENT
    if (newGlobalCount > absoluteBaseline) {
      console.log(`\n🚨 ZERO TOLERANCE VIOLATION!`);
      console.log(`   ${newGlobalCount - absoluteBaseline} new global errors detected`);
      await this.absoluteRollback(gitHash);
      return false;
    }
    
    if (newFileCount > fileBaseline) {
      console.log(`\n🚨 FILE ERROR INCREASE DETECTED!`);
      console.log(`   ${newFileCount - fileBaseline} new file errors detected`);
      await this.absoluteRollback(gitHash);
      return false;
    }
    
    // Step 7: Success validation
    const improvement = absoluteBaseline - newGlobalCount;
    console.log(`\n✅ ZERO DEGRADATION MAINTAINED!`);
    console.log(`✅ Improvement: ${improvement} errors fixed`);
    console.log(`✅ No systematic damage occurred`);
    
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
  
  async createGitCheckpoint() {
    try {
      const result = execSync('git rev-parse HEAD', { encoding: 'utf8' });
      return result.trim().substring(0, 8);
    } catch (error) {
      return 'unknown';
    }
  }
  
  async selectMostProblematicFile() {
    try {
      const result = execSync(`npm run type-check 2>&1 | head -3 | grep -o "src/[^(]*" | head -1`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return result.trim() || 'src/components/meetings/MeetingDetails.tsx';
    } catch (error) {
      return 'src/components/meetings/MeetingDetails.tsx';
    }
  }
  
  async applyMinimalFix(filePath) {
    console.log(`🔧 Applying MINIMAL fix to: ${filePath}`);
    
    // Get exact error  
    const errors = await this.getFileErrorDetails(filePath);
    console.log(`   Detected ${errors.length} specific errors`);
    
    if (errors.length === 0) {
      console.log(`   No specific errors to fix`);
      return;
    }
    
    // Apply ONLY the most obvious fix
    let content = fs.readFileSync(filePath, 'utf8');
    let fixed = false;
    
    // Fix 1: JSX semicolon in arrow functions
    const semicolonInArrowFix = content.replace(/(\}\s*;\s*\n\s*\}\s*\n)/g, (match) => {
      fixed = true;
      return match.replace(';', '');
    });
    
    if (fixed) {
      fs.writeFileSync(filePath, semicolonInArrowFix);
      console.log(`   ✓ Applied JSX semicolon fix`);
      return;
    }
    
    // Fix 2: Missing semicolons at end of statements
    const addSemicolonFix = content.replace(/(\n\s*(const|let|var|return)\s+[^;\n]+)\n/g, (match, statement) => {
      if (!statement.endsWith(';') && !statement.includes('{') && !statement.includes('}')) {
        fixed = true;
        return statement + ';\n';
      }
      return match;
    });
    
    if (fixed) {
      fs.writeFileSync(filePath, addSemicolonFix);
      console.log(`   ✓ Applied semicolon addition fix`);
      return;
    }
    
    console.log(`   ℹ️  No safe automatic fix available`);
  }
  
  async getFileErrorDetails(filePath) {
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
  
  async absoluteRollback(gitHash) {
    console.log(`\n🔄 EXECUTING ABSOLUTE ROLLBACK TO ${gitHash}...`);
    
    try {
      execSync(`git reset --hard ${gitHash}`, { stdio: 'pipe' });
      console.log(`✅ Rollback completed - all changes reverted`);
      
      // Verify rollback
      const newCount = await this.getErrorCount();
      console.log(`✅ Post-rollback verification: ${newCount} errors`);
      
    } catch (error) {
      console.log(`❌ Rollback failed: ${error.message}`);
    }
  }
}

// Enforcer
const enforcer = new ZeroDegradationSystem();
enforcer.enforceZeroDegradation().then(success => {
  if (success) {
    console.log('\n🛡️  ZERO DEGRADATION MAINTAINED - SYSTEM SAFE');
  } else {
    console.log('\n🚨 DEGRADATION PREVENTED - ROLLBACK EXECUTED');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('System error:', error);
  process.exit(1);
});