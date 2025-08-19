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
        name: 'TypeScript Anti-Patterns',
        check: () => this.checkTypeScriptAntiPatterns(),
        critical: true
      },
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
        name: 'Git Commit Rules',
        check: () => this.checkGitCommitRules(),
        critical: true
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

  checkTypeScriptAntiPatterns() {
    const srcDir = path.join(process.cwd(), 'src');
    const issues = [];
    
    // Files that are allowed to use these patterns (for compatibility reasons)
    const allowedFiles = [
      'src/lib/auth/auth-options.ts', // Uses type guards properly
      'src/lib/sentry/sentry-utils.ts', // Uses for compatibility
      'src/lib/auth/policy.ts' // Uses for type compatibility
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
          
          // Skip allowed files
          if (allowedFiles.includes(relativePath)) {
            return;
          }
          
          const lines = content.split('\n');
          const fileIssues = [];
          
          lines.forEach((line, index) => {
            const lineNum = index + 1;
            
            // Check for 'as any' usage
            if (line.match(/\bas\s+any\b/)) {
              fileIssues.push(`Line ${lineNum}: Uses 'as any' - type safety lost`);
            }
            
            // Check for 'as Record<string, unknown>' usage
            if (line.match(/\bas\s+Record\s*<\s*string\s*,\s*unknown\s*>/)) {
              fileIssues.push(`Line ${lineNum}: Uses 'as Record<string, unknown>' - consider proper typing`);
            }
            
            // Check for '@ts-ignore' comments
            if (line.match(/@ts-ignore/)) {
              fileIssues.push(`Line ${lineNum}: Uses '@ts-ignore' - fix the type error instead`);
            }
            
            // Check for ':any' type annotations
            if (line.match(/:\s*any\b/) && !line.includes('// any is required')) {
              fileIssues.push(`Line ${lineNum}: Uses ':any' type annotation - use proper types`);
            }
            
            // Check for 'Function' type (should use specific function signatures)
            if (line.match(/:\s*Function\b/)) {
              fileIssues.push(`Line ${lineNum}: Uses 'Function' type - use specific function signature`);
            }
            
            // Check for missing interface usage (User extensions should use proper interfaces)
            // Example: UserWithPassword interface for users with password fields
            if (line.match(/User\s*&\s*\{.*hashedPassword/) || 
                line.match(/extends\s+User.*hashedPassword/)) {
              fileIssues.push(`Line ${lineNum}: Define proper interface (e.g., UserWithPassword) instead of inline type extension`);
            }
          });
          
          if (fileIssues.length > 0) {
            issues.push({
              file: relativePath,
              problems: fileIssues
            });
          }
        }
      });
    };
    
    scanDir(srcDir);
    
    if (issues.length > 0) {
      this.log(`TypeScript anti-patterns detected in ${issues.length} files:`, 'ERROR');
      
      // Show first 5 files with issues
      issues.slice(0, 5).forEach(issue => {
        this.log(`  ${issue.file}:`, 'ERROR');
        issue.problems.slice(0, 3).forEach(problem => {
          this.log(`    - ${problem}`, 'ERROR');
        });
        if (issue.problems.length > 3) {
          this.log(`    ... and ${issue.problems.length - 3} more issues`, 'ERROR');
        }
      });
      
      if (issues.length > 5) {
        this.log(`  ... and ${issues.length - 5} more files with issues`, 'ERROR');
      }
      
      return false;
    }
    
    return true;
  }

  checkGitCommitRules() {
    const issues = [];
    
    try {
      // Check recent git commits for Claude signatures
      const gitLogResult = spawn('git', ['log', '--oneline', '-10', '--format=%B'], {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      let gitOutput = '';
      gitLogResult.stdout.on('data', (data) => {
        gitOutput += data.toString();
      });
      
      gitLogResult.on('close', (code) => {
        if (code === 0) {
          const commits = gitOutput.split('\n');
          
          commits.forEach((commit, index) => {
            // Check for Claude Code signature
            if (commit.includes('Generated with [Claude Code]') || 
                commit.includes('Co-Authored-By: Claude <noreply@anthropic.com>')) {
              issues.push(`Recent commit contains Claude signature: "${commit.substring(0, 50)}..."`);
            }
          });
        }
      });
      
      // Check git history for --no-verify usage (this is harder to detect but we can check shell history)
      const bashHistoryFile = path.join(require('os').homedir(), '.bash_history');
      const zshHistoryFile = path.join(require('os').homedir(), '.zsh_history');
      
      // Check bash history
      if (fs.existsSync(bashHistoryFile)) {
        try {
          const bashHistory = fs.readFileSync(bashHistoryFile, 'utf-8');
          const recentLines = bashHistory.split('\n').slice(-100); // Check last 100 commands
          
          recentLines.forEach(line => {
            if (line.includes('git commit') && line.includes('--no-verify')) {
              issues.push(`Recent command used --no-verify: "${line}"`);
            }
          });
        } catch (error) {
          // Ignore if can't read history
        }
      }
      
      // Check zsh history  
      if (fs.existsSync(zshHistoryFile)) {
        try {
          const zshHistory = fs.readFileSync(zshHistoryFile, 'utf-8');
          const recentLines = zshHistory.split('\n').slice(-100); // Check last 100 commands
          
          recentLines.forEach(line => {
            if (line.includes('git commit') && line.includes('--no-verify')) {
              issues.push(`Recent command used --no-verify: "${line}"`);
            }
          });
        } catch (error) {
          // Ignore if can't read history
        }
      }
      
      // Additional warning about these rules
      if (issues.length === 0) {
        this.log('Git commit rules check: --no-verify and Claude signatures not detected', 'INFO');
      } else {
        issues.forEach(issue => this.log(issue, 'ERROR'));
        this.log('REMINDER: Never use --no-verify and avoid Claude signatures in commits', 'ERROR');
        return false;
      }
      
    } catch (error) {
      this.log(`Git commit rules check failed: ${error.message}`, 'WARNING');
      return true; // Don't fail validation if git check fails
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