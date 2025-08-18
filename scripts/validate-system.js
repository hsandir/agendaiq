#!/usr/bin/env node

/**
 * System Validation Script for AgendaIQ
 * Runs automated checks to ensure system constraints are met before changes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

class SystemValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  log(message, type = 'info') {
    const prefix = {
      error: `${colors.red}❌`,
      warning: `${colors.yellow}⚠️`,
      success: `${colors.green}✅`,
      info: `${colors.blue}ℹ️`,
      title: `${colors.magenta}🔍`
    }[type] || '';
    
    console.log(`${prefix} ${message}${colors.reset}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
    if (type === 'success') this.successes.push(message);
  }

  // Check 1: Authentication System
  checkAuthenticationSystem() {
    this.log('Checking Authentication System...', 'title');
    
    const authFiles = [
      'src/lib/auth/auth-utils.ts',
      'src/lib/auth/api-auth.ts',
      'src/lib/auth/policy.ts'
    ];
    
    let allExist = true;
    authFiles.forEach(file => {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        this.log(`Found: ${file}`, 'success');
      } else {
        this.log(`Missing: ${file}`, 'error');
        allExist = false;
      }
    });
    
    if (allExist) {
      // Check for common auth mistakes
      const pagesDir = path.join(process.cwd(), 'src/app/dashboard');
      if (fs.existsSync(pagesDir)) {
        this.scanForAuthIssues(pagesDir);
      }
    }
  }

  // Check 2: Database Relationships
  checkDatabaseRelationships() {
    this.log('Checking Database Relationships...', 'title');
    
    const srcDir = path.join(process.cwd(), 'src');
    this.scanForUserIdMisuse(srcDir);
  }

  // Check 3: Mock Data Detection
  checkForMockData() {
    this.log('Checking for Mock/Static Data...', 'title');
    
    const patterns = [
      /mockData/gi,
      /82\.5%/g,
      /const\s+data\s*=\s*\[{.*id:\s*['"]\d+['"]/g,
      /const\s+stats\s*=\s*{[^}]*value:\s*\d+/g
    ];
    
    const srcDir = path.join(process.cwd(), 'src');
    this.scanDirectory(srcDir, patterns, true);
  }

  // Check 4: Language Consistency
  checkLanguageConsistency() {
    this.log('Checking Language Consistency...', 'title');
    
    const turkishPatterns = [
      /Kaydet/g,
      /Güncelle/g,
      /Sil/g,
      /Ekle/g,
      /Düzenle/g,
      /İptal/g,
      /Tamam/g,
      /Evet/g,
      /Hayır/g
    ];
    
    const srcDir = path.join(process.cwd(), 'src');
    let foundTurkish = false;
    
    const scanForTurkish = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanForTurkish(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          turkishPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              this.log(`Turkish text found in ${filePath}: ${matches[0]}`, 'warning');
              foundTurkish = true;
            }
          });
        }
      });
    };
    
    scanForTurkish(srcDir);
    
    if (!foundTurkish) {
      this.log('No Turkish text found - English consistency maintained', 'success');
    }
  }

  // Check 5: Port Configuration
  checkPortConfiguration() {
    this.log('Checking Port Configuration...', 'title');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      const devScript = packageJson.scripts?.dev || '';
      
      if (devScript.includes('3001') || devScript.includes('3002')) {
        this.log('Port configuration incorrect - must use port 3000', 'error');
      } else {
        this.log('Port 3000 configuration verified', 'success');
      }
      
      // Check if port 3000 is in use
      try {
        execSync('lsof -ti:3000', { stdio: 'ignore' });
        this.log('Port 3000 is currently in use', 'warning');
      } catch {
        this.log('Port 3000 is available', 'success');
      }
    } catch (error) {
      this.log('Could not check port configuration', 'warning');
    }
  }

  // Check 6: RoleKey System
  checkRoleKeySystem() {
    this.log('Checking RoleKey System...', 'title');
    
    const validRoleKeys = [
      'DEV_ADMIN',
      'OPS_ADMIN',
      'TEACHER',
      'PRINCIPAL',
      'VICE_PRINCIPAL',
      'DEPARTMENT_HEAD',
      'STAFF'
    ];
    
    const srcDir = path.join(process.cwd(), 'src');
    this.scanForRoleKeyUsage(srcDir, validRoleKeys);
  }

  // Helper: Scan for auth issues
  scanForAuthIssues(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.')) {
        this.scanForAuthIssues(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for missing auth
        if (content.includes('export default async function') && 
            !content.includes('requireAuth') && 
            !content.includes('getCurrentUser')) {
          this.log(`Possible missing authentication in ${filePath}`, 'warning');
        }
      }
    });
  }

  // Helper: Scan for userId misuse
  scanForUserIdMisuse(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        this.scanForUserIdMisuse(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for incorrect userId usage with meetings
        if (content.includes('organizer_id: userId')) {
          this.log(`Incorrect: organizer_id using userId in ${filePath}`, 'error');
        }
        if (content.includes('organizer_id: staffId')) {
          this.log(`Correct: organizer_id using staffId in ${filePath}`, 'success');
        }
      }
    });
  }

  // Helper: Scan directory for patterns
  scanDirectory(dir, patterns) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        this.scanDirectory(filePath, patterns);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        patterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            this.log(`Mock/static data found in ${filePath}: ${matches[0].substring(0, 50)}...`, 'error');
          }
        });
      }
    });
  }

  // Helper: Scan for roleKey usage
  scanForRoleKeyUsage(dir, validKeys) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        this.scanForRoleKeyUsage(filePath, validKeys);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for roleKey usage
        const roleKeyPattern = /roleKey:\s*['"]([^'"]+)['"]/g;
        let match;
        while ((match = roleKeyPattern.exec(content)) !== null) {
          const key = match[1];
          if (!validKeys.includes(key)) {
            this.log(`Invalid roleKey "${key}" in ${filePath}`, 'error');
          }
        }
      }
    });
  }

  // Generate report
  generateReport() {
    console.log('\n' + '='.repeat(60));
    this.log('VALIDATION REPORT', 'title');
    console.log('='.repeat(60));
    
    console.log(`\n${colors.green}Successes: ${this.successes.length}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${this.warnings.length}${colors.reset}`);
    console.log(`${colors.red}Errors: ${this.errors.length}${colors.reset}`);
    
    if (this.errors.length > 0) {
      console.log(`\n${colors.red}⚠️  VALIDATION FAILED - Fix errors before proceeding${colors.reset}`);
      process.exit(1);
    } else if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}⚠️  VALIDATION PASSED WITH WARNINGS${colors.reset}`);
    } else {
      console.log(`\n${colors.green}✅ VALIDATION PASSED - Safe to proceed${colors.reset}`);
    }
  }

  // Run all checks
  async run() {
    console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.magenta}AgendaIQ System Validation Starting...${colors.reset}`);
    console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}\n`);
    
    this.checkAuthenticationSystem();
    console.log();
    
    this.checkDatabaseRelationships();
    console.log();
    
    this.checkForMockData();
    console.log();
    
    this.checkLanguageConsistency();
    console.log();
    
    this.checkPortConfiguration();
    console.log();
    
    this.checkRoleKeySystem();
    
    this.generateReport();
  }
}

// Run validator
const validator = new SystemValidator();
validator.run().catch(console.error);