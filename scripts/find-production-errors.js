#!/usr/bin/env node

/**
 * Production Error Detection Script
 * Finds potential production errors by analyzing the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProductionErrorDetector {
  constructor() {
    this.issues = [];
    this.srcDir = path.join(process.cwd(), 'src');
  }

  log(message, type = 'info') {
    const prefix = {
      error: '🚨',
      warn: '⚠️',
      info: '📋',
      success: '✅'
    };
    console.log(`${prefix[type]} ${message}`);
  }

  addIssue(type, file, line, message, severity = 'medium') {
    this.issues.push({
      type,
      file: file.replace(process.cwd(), ''),
      line,
      message,
      severity,
      timestamp: new Date().toISOString()
    });
  }

  // Find console.log statements (should be removed in production)
  findConsoleStatements() {
    this.log('🔍 Scanning for console statements...', 'info');
    
    try {
      const result = execSync('find src -name "*.ts" -o -name "*.tsx" | xargs grep -n "console\\." || true', {
        encoding: 'utf8'
      });
      
      if (result.trim()) {
        const lines = result.trim().split('\n');
        lines.forEach(line => {
          const [filePath, lineNum, ...content] = line.split(':');
          if (filePath && lineNum && !content.join(':').includes('// @dev-only')) {
            this.addIssue('console-statement', filePath, lineNum, `Console statement found: ${content.join(':')}`, 'low');
          }
        });
      }
    } catch (error) {
      this.log(`Error scanning console statements: ${error.message}`, 'warn');
    }
  }

  // Find TODO and FIXME comments
  findTodoFixme() {
    this.log('🔍 Scanning for TODO/FIXME comments...', 'info');
    
    try {
      const result = execSync('find src -name "*.ts" -o -name "*.tsx" | xargs grep -n -i "\\(TODO\\|FIXME\\|BUG\\|HACK\\)" || true', {
        encoding: 'utf8'
      });
      
      if (result.trim()) {
        const lines = result.trim().split('\n');
        lines.forEach(line => {
          const [filePath, lineNum, ...content] = line.split(':');
          if (filePath && lineNum) {
            this.addIssue('todo-fixme', filePath, lineNum, `Unresolved comment: ${content.join(':')}`, 'low');
          }
        });
      }
    } catch (error) {
      this.log(`Error scanning TODO/FIXME: ${error.message}`, 'warn');
    }
  }

  // Find hardcoded URLs
  findHardcodedUrls() {
    this.log('🔍 Scanning for hardcoded URLs...', 'info');
    
    try {
      const result = execSync('find src -name "*.ts" -o -name "*.tsx" | xargs grep -n "localhost\\|127\\.0\\.0\\.1\\|http://\\|https://" | grep -v ".vercel.app" || true', {
        encoding: 'utf8'
      });
      
      if (result.trim()) {
        const lines = result.trim().split('\n');
        lines.forEach(line => {
          const [filePath, lineNum, ...content] = line.split(':');
          if (filePath && lineNum) {
            this.addIssue('hardcoded-url', filePath, lineNum, `Hardcoded URL found: ${content.join(':')}`, 'medium');
          }
        });
      }
    } catch (error) {
      this.log(`Error scanning URLs: ${error.message}`, 'warn');
    }
  }

  // Find potential memory leaks
  findMemoryLeaks() {
    this.log('🔍 Scanning for potential memory leaks...', 'info');
    
    try {
      // Look for setInterval without clearInterval
      const intervalResult = execSync('find src -name "*.ts" -o -name "*.tsx" | xargs grep -n "setInterval" || true', {
        encoding: 'utf8'
      });
      
      if (intervalResult.trim()) {
        const lines = intervalResult.trim().split('\n');
        lines.forEach(line => {
          const [filePath, lineNum, ...content] = line.split(':');
          if (filePath && lineNum) {
            // Check if same file has clearInterval
            try {
              const fileContent = fs.readFileSync(filePath, 'utf8');
              if (!fileContent.includes('clearInterval')) {
                this.addIssue('memory-leak', filePath, lineNum, `setInterval without clearInterval: ${content.join(':')}`, 'high');
              }
            } catch (err) {
              // File might not exist, skip
            }
          }
        });
      }
    } catch (error) {
      this.log(`Error scanning memory leaks: ${error.message}`, 'warn');
    }
  }

  // Find error handling issues
  findErrorHandling() {
    this.log('🔍 Scanning for error handling issues...', 'info');
    
    try {
      // Find catch blocks that don't handle errors properly
      const result = execSync('find src -name "*.ts" -o -name "*.tsx" | xargs grep -n -A1 "catch.*{" || true', {
        encoding: 'utf8'
      });
      
      if (result.trim()) {
        const lines = result.trim().split('\n');
        for (let i = 0; i < lines.length; i += 2) {
          const catchLine = lines[i];
          const nextLine = lines[i + 1];
          
          if (catchLine && nextLine) {
            const [filePath, lineNum] = catchLine.split(':');
            if (nextLine.includes('// ignore') || nextLine.includes('{}')) {
              this.addIssue('error-handling', filePath, lineNum, 'Empty or ignored catch block', 'medium');
            }
          }
        }
      }
    } catch (error) {
      this.log(`Error scanning error handling: ${error.message}`, 'warn');
    }
  }

  // Find missing type annotations
  findMissingTypes() {
    this.log('🔍 Scanning for missing type annotations...', 'info');
    
    try {
      // Look for 'any' types
      const result = execSync('find src -name "*.ts" -o -name "*.tsx" | xargs grep -n ": any\\|<any>\\|any\\[\\]" || true', {
        encoding: 'utf8'
      });
      
      if (result.trim()) {
        const lines = result.trim().split('\n');
        lines.forEach(line => {
          const [filePath, lineNum, ...content] = line.split(':');
          if (filePath && lineNum && !content.join(':').includes('@ts-ignore')) {
            this.addIssue('missing-types', filePath, lineNum, `Any type used: ${content.join(':')}`, 'low');
          }
        });
      }
    } catch (error) {
      this.log(`Error scanning types: ${error.message}`, 'warn');
    }
  }

  // Find authentication bypass attempts
  findSecurityIssues() {
    this.log('🔍 Scanning for security issues...', 'info');
    
    try {
      // Look for authentication bypasses
      const authBypassResult = execSync('find src -name "*.ts" -o -name "*.tsx" | xargs grep -n -i "bypassauth\\|skipauth\\|noauth\\|disable.*auth" || true', {
        encoding: 'utf8'
      });
      
      if (authBypassResult.trim()) {
        const lines = authBypassResult.trim().split('\n');
        lines.forEach(line => {
          const [filePath, lineNum, ...content] = line.split(':');
          if (filePath && lineNum) {
            this.addIssue('security-bypass', filePath, lineNum, `Potential auth bypass: ${content.join(':')}`, 'high');
          }
        });
      }

      // Look for sensitive data in code
      const sensitiveResult = execSync('find src -name "*.ts" -o -name "*.tsx" | xargs grep -n -i "password.*=\\|secret.*=\\|token.*=\\|key.*=" | grep -v "process.env" || true', {
        encoding: 'utf8'
      });
      
      if (sensitiveResult.trim()) {
        const lines = sensitiveResult.trim().split('\n');
        lines.forEach(line => {
          const [filePath, lineNum, ...content] = line.split(':');
          if (filePath && lineNum && !content.join(':').includes('placeholder')) {
            this.addIssue('sensitive-data', filePath, lineNum, `Potential sensitive data: ${content.join(':')}`, 'critical');
          }
        });
      }
    } catch (error) {
      this.log(`Error scanning security: ${error.message}`, 'warn');
    }
  }

  // Generate report
  generateReport() {
    this.log('\n📊 PRODUCTION ERROR ANALYSIS REPORT', 'info');
    this.log('='.repeat(60), 'info');
    
    const critical = this.issues.filter(i => i.severity === 'critical');
    const high = this.issues.filter(i => i.severity === 'high');
    const medium = this.issues.filter(i => i.severity === 'medium');
    const low = this.issues.filter(i => i.severity === 'low');
    
    this.log(`Total Issues Found: ${this.issues.length}`, 'info');
    this.log(`Critical: ${critical.length} | High: ${high.length} | Medium: ${medium.length} | Low: ${low.length}`, 'info');
    
    if (critical.length > 0) {
      this.log('\n🚨 CRITICAL ISSUES:', 'error');
      critical.forEach((issue, i) => {
        this.log(`  ${i + 1}. ${issue.file}:${issue.line} - ${issue.message}`, 'error');
      });
    }
    
    if (high.length > 0) {
      this.log('\n⚠️ HIGH PRIORITY ISSUES:', 'warn');
      high.forEach((issue, i) => {
        this.log(`  ${i + 1}. ${issue.file}:${issue.line} - ${issue.message}`, 'warn');
      });
    }
    
    if (medium.length > 0 && medium.length < 20) { // Don't spam if too many
      this.log('\n📋 MEDIUM PRIORITY ISSUES:', 'info');
      medium.slice(0, 10).forEach((issue, i) => {
        this.log(`  ${i + 1}. ${issue.file}:${issue.line} - ${issue.message}`, 'info');
      });
      if (medium.length > 10) {
        this.log(`  ... and ${medium.length - 10} more medium issues`, 'info');
      }
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.issues.length,
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        low: low.length
      },
      issues: this.issues,
      blockers: critical.length + high.length,
      productionReady: critical.length === 0 && high.length === 0
    };

    fs.writeFileSync(
      path.join(__dirname, '../production-error-analysis.json'),
      JSON.stringify(report, null, 2)
    );

    this.log('\n📋 Detailed report saved to production-error-analysis.json', 'info');
    
    if (report.productionReady) {
      this.log('\n✅ NO CRITICAL/HIGH ISSUES - Production deployment recommended', 'success');
    } else {
      this.log(`\n🚫 ${report.blockers} BLOCKING ISSUES - Fix before production deployment`, 'error');
    }
    
    return report;
  }

  async runAnalysis() {
    this.log('🚀 Starting Production Error Analysis', 'info');
    this.log('='.repeat(50), 'info');
    
    // Run all scans
    this.findConsoleStatements();
    this.findTodoFixme();
    this.findHardcodedUrls();
    this.findMemoryLeaks();
    this.findErrorHandling();
    this.findMissingTypes();
    this.findSecurityIssues();
    
    return this.generateReport();
  }
}

// Run analysis if called directly
if (require.main === module) {
  const detector = new ProductionErrorDetector();
  detector.runAnalysis().catch(console.error);
}

module.exports = ProductionErrorDetector;