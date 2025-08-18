#!/usr/bin/env node

/**
 * Claude Validation Agent
 * Persistent background process that validates system constraints
 * Continues running even if Claude session is cancelled
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class ValidationAgent {
  constructor() {
    this.isRunning = true;
    this.checkInterval = 5000; // Check every 5 seconds
    this.logFile = path.join(__dirname, 'validation-agent.log');
    this.pidFile = path.join(__dirname, 'validation-agent.pid');
    this.validationRules = [];
    
    // Store PID for process management
    fs.writeFileSync(this.pidFile, process.pid.toString());
    
    // Load validation rules
    this.loadValidationRules();
    
    // Handle shutdown gracefully
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    
    // Write to log file
    fs.appendFileSync(this.logFile, logMessage);
    
    // Also log to console
    if (level === 'ERROR') {
      console.error(`❌ ${message}`);
    } else if (level === 'WARNING') {
      console.warn(`⚠️ ${message}`);
    } else {
      console.log(`✅ ${message}`);
    }
  }

  loadValidationRules() {
    this.validationRules = [
      {
        name: 'Staff ID Usage',
        check: () => this.checkStaffIdUsage(),
        critical: true
      },
      {
        name: 'Mock Data Detection',
        check: () => this.checkMockData(),
        critical: true
      },
      {
        name: 'Port Configuration',
        check: () => this.checkPortConfig(),
        critical: true
      },
      {
        name: 'Authentication Coverage',
        check: () => this.checkAuthCoverage(),
        critical: false
      },
      {
        name: 'Language Consistency',
        check: () => this.checkLanguage(),
        critical: false
      }
    ];
  }

  checkStaffIdUsage() {
    const srcDir = path.join(process.cwd(), 'src');
    const issues = [];
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanDir(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // Check for wrong userId usage
          if (content.includes('organizer_id: userId')) {
            issues.push(`${filePath}: organizer_id uses userId instead of staffId`);
          }
          if (content.includes('staff_id: userId')) {
            issues.push(`${filePath}: staff_id uses userId instead of staffId`);
          }
        }
      });
    };
    
    scanDir(srcDir);
    
    if (issues.length > 0) {
      this.log(`Staff ID misuse detected in ${issues.length} files`, 'ERROR');
      issues.forEach(issue => this.log(issue, 'ERROR'));
      return false;
    }
    
    return true;
  }

  checkMockData() {
    const srcDir = path.join(process.cwd(), 'src');
    const issues = [];
    
    // Allowed files that can contain "mockData" keyword for dev tools
    const allowedFiles = [
      'src/app/api/dev/ci-cd/runs/route.ts',
      'src/app/api/system/mock-data-scan/route.ts',
      'src/app/dashboard/system/mock-data-tracker/page.tsx',
      'src/components/development/ci-cd-monitor.tsx',
      'src/lib/auth/policy.ts',
      'src/lib/utils/env.ts'
    ];
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        // Skip test directories
        if (file === '__tests__' || file === 'test' || file === 'tests') {
          return;
        }
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanDir(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const relativePath = path.relative(process.cwd(), filePath);
          
          // Skip allowed development tool files
          if (allowedFiles.includes(relativePath)) {
            return;
          }
          
          // Check for mock data patterns
          if (content.match(/mockData|82\.5%|const data = \[{/gi)) {
            // Skip if it's a legitimate placeholder in input field
            if (!content.includes('placeholder=') || content.match(/const.*mockData/i)) {
              issues.push(relativePath);
            }
          }
        }
      });
    };
    
    scanDir(srcDir);
    
    if (issues.length > 0) {
      this.log(`Mock data detected in ${issues.length} files:`, 'WARNING');
      // Log first 6 files with mock data
      issues.slice(0, 6).forEach(file => {
        this.log(`  - ${file}`, 'WARNING');
      });
      if (issues.length > 6) {
        this.log(`  ... and ${issues.length - 6} more files`, 'WARNING');
      }
      return false;
    }
    
    return true;
  }

  checkPortConfig() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      const devScript = packageJson.scripts?.dev || '';
      
      if (devScript.includes(':3001') || devScript.includes(':3002')) {
        this.log('Port configuration incorrect - must use port 3000', 'ERROR');
        return false;
      }
      
      return true;
    } catch (error) {
      this.log('Could not check port configuration', 'WARNING');
      return true;
    }
  }

  checkAuthCoverage() {
    const dashboardDir = path.join(process.cwd(), 'src/app/dashboard');
    let totalPages = 0;
    let pagesWithAuth = 0;
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.')) {
          scanDir(filePath);
        } else if (file === 'page.tsx') {
          totalPages++;
          const content = fs.readFileSync(filePath, 'utf-8');
          
          if (content.includes('requireAuth') || content.includes('getCurrentUser')) {
            pagesWithAuth++;
          }
        }
      });
    };
    
    scanDir(dashboardDir);
    
    const coverage = totalPages > 0 ? (pagesWithAuth / totalPages * 100).toFixed(1) : 0;
    
    if (coverage < 100) {
      this.log(`Auth coverage: ${coverage}% (${pagesWithAuth}/${totalPages} pages)`, 'WARNING');
      return false;
    }
    
    return true;
  }

  checkLanguage() {
    const srcDir = path.join(process.cwd(), 'src');
    const turkishWords = ['Kaydet', 'Güncelle', 'Sil', 'Ekle', 'İptal'];
    const issues = [];
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanDir(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          
          turkishWords.forEach(word => {
            if (content.includes(word)) {
              issues.push(`${filePath}: Contains Turkish text "${word}"`);
            }
          });
        }
      });
    };
    
    scanDir(srcDir);
    
    if (issues.length > 0) {
      this.log(`Turkish text found in ${issues.length} files`, 'WARNING');
      return false;
    }
    
    return true;
  }

  async runValidation() {
    this.log('Running validation checks...', 'INFO');
    
    let hasErrors = false;
    let hasWarnings = false;
    
    for (const rule of this.validationRules) {
      try {
        const passed = await rule.check();
        
        if (!passed) {
          if (rule.critical) {
            hasErrors = true;
            this.log(`❌ ${rule.name} - FAILED (CRITICAL)`, 'ERROR');
          } else {
            hasWarnings = true;
            this.log(`⚠️ ${rule.name} - WARNING`, 'WARNING');
          }
        } else {
          this.log(`✅ ${rule.name} - PASSED`, 'INFO');
        }
      } catch (error) {
        this.log(`Error checking ${rule.name}: ${error.message}`, 'ERROR');
      }
    }
    
    // Write status file for Claude to read
    const statusFile = path.join(__dirname, 'validation-status.json');
    const status = {
      timestamp: new Date().toISOString(),
      hasErrors,
      hasWarnings,
      lastCheck: Date.now()
    };
    
    fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
    
    return !hasErrors;
  }

  async start() {
    this.log('Validation Agent started', 'INFO');
    this.log(`PID: ${process.pid}`, 'INFO');
    this.log(`Checking every ${this.checkInterval / 1000} seconds`, 'INFO');
    
    // Initial validation
    await this.runValidation();
    
    // Set up periodic validation
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.runValidation();
      }
    }, this.checkInterval);
    
    // Keep process alive
    process.stdin.resume();
  }

  shutdown() {
    this.log('Validation Agent shutting down...', 'INFO');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Clean up PID file
    if (fs.existsSync(this.pidFile)) {
      fs.unlinkSync(this.pidFile);
    }
    
    process.exit(0);
  }
}

// Check if agent is already running
const pidFile = path.join(__dirname, 'validation-agent.pid');
if (fs.existsSync(pidFile)) {
  const oldPid = fs.readFileSync(pidFile, 'utf-8');
  try {
    // Check if process is still running
    process.kill(oldPid, 0);
    console.log(`⚠️ Validation Agent already running (PID: ${oldPid})`);
    process.exit(0);
  } catch (e) {
    // Process not running, clean up old PID file
    fs.unlinkSync(pidFile);
  }
}

// Start the agent
const agent = new ValidationAgent();
agent.start().catch(error => {
  console.error('Failed to start Validation Agent:', error);
  process.exit(1);
});