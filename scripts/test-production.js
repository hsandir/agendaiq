#!/usr/bin/env node

/**
 * Production Testing Script
 * Tests the application locally to catch production deployment issues
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

class ProductionTester {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.testResults = {
      build: false,
      lint: false,
      typeCheck: false,
      unitTests: false,
      apiTests: false,
      authTests: false,
      databaseTests: false
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '❌',
      warn: '⚠️',
      success: '✅',
      info: '📋'
    };
    
    console.log(`${prefix[type]} [${timestamp}] ${message}`);
    
    if (type === 'error') {
      this.errors.push({ message, timestamp });
    } else if (type === 'warn') {
      this.warnings.push({ message, timestamp });
    } else if (type === 'success') {
      this.passed.push({ message, timestamp });
    }
  }

  async runCommand(command, description, critical = true) {
    this.log(`Running: ${description}`, 'info');
    try {
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      this.log(`✅ ${description} - PASSED`, 'success');
      return { success: true, output };
    } catch (error) {
      const message = `❌ ${description} - FAILED: ${error.message}`;
      this.log(message, critical ? 'error' : 'warn');
      return { success: false, error: error.message, output: error.stdout };
    }
  }

  async testBuild() {
    this.log('🏗️ Testing production build...', 'info');
    const result = await this.runCommand('npm run build', 'Production Build');
    this.testResults.build = result.success;
    
    if (result.success) {
      // Check if build artifacts exist
      const buildExists = fs.existsSync('.next');
      if (!buildExists) {
        this.log('Build directory (.next) not found', 'error');
        this.testResults.build = false;
      }
    }
    
    return result.success;
  }

  async testLint() {
    this.log('🔍 Testing code quality...', 'info');
    const result = await this.runCommand('npm run lint', 'ESLint Check', false);
    this.testResults.lint = result.success;
    return result.success;
  }

  async testTypeCheck() {
    this.log('📝 Testing TypeScript types...', 'info');
    const result = await this.runCommand('npm run type-check', 'TypeScript Check');
    this.testResults.typeCheck = result.success;
    return result.success;
  }

  async testUnit() {
    this.log('🧪 Running unit tests...', 'info');
    const result = await this.runCommand('npm test -- --passWithNoTests', 'Unit Tests', false);
    this.testResults.unitTests = result.success;
    return result.success;
  }

  async testLocalServer() {
    this.log('🌐 Testing local server...', 'info');
    
    return new Promise((resolve) => {
      // Start the server
      const server = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        detached: false
      });
      
      let serverReady = false;
      let serverError = null;

      server.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Ready in') || output.includes('Local:')) {
          serverReady = true;
        }
      });

      server.stderr.on('data', (data) => {
        serverError = data.toString();
      });

      // Give server time to start
      setTimeout(async () => {
        if (serverReady && !serverError) {
          try {
            // Test basic endpoints
            await this.testEndpoint('http://localhost:3000/api/health', 'Health Check');
            await this.testEndpoint('http://localhost:3000/auth/signin', 'Auth Page');
            
            this.log('Local server tests completed', 'success');
            this.testResults.apiTests = true;
          } catch (error) {
            this.log(`Server test failed: ${error.message}`, 'error');
            this.testResults.apiTests = false;
          }
        } else {
          this.log(`Server failed to start: ${serverError}`, 'error');
          this.testResults.apiTests = false;
        }
        
        // Kill the server
        server.kill();
        resolve(this.testResults.apiTests);
      }, 10000);
    });
  }

  async testEndpoint(url, name) {
    return new Promise((resolve, reject) => {
      const request = http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          this.log(`${name}: ${res.statusCode}`, 'success');
          resolve(true);
        } else {
          reject(new Error(`${name} returned ${res.statusCode}`));
        }
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.setTimeout(5000, () => {
        reject(new Error(`${name} timeout`));
      });
    });
  }

  async testDatabase() {
    this.log('🗄️ Testing database connectivity...', 'info');
    
    try {
      // Test database connection via API
      const result = await this.runCommand(
        'node -e "require(\'./src/lib/prisma\').prisma.user.count().then(console.log).catch(console.error)"',
        'Database Connection'
      );
      this.testResults.databaseTests = result.success;
      return result.success;
    } catch (error) {
      this.log(`Database test failed: ${error.message}`, 'error');
      this.testResults.databaseTests = false;
      return false;
    }
  }

  generateReport() {
    this.log('\n📊 TEST REPORT', 'info');
    this.log('='.repeat(50), 'info');
    
    const total = Object.keys(this.testResults).length;
    const passed = Object.values(this.testResults).filter(Boolean).length;
    const failed = total - passed;
    
    this.log(`Total Tests: ${total}`, 'info');
    this.log(`Passed: ${passed}`, 'success');
    this.log(`Failed: ${failed}`, failed > 0 ? 'error' : 'info');
    
    this.log('\nDetailed Results:', 'info');
    Object.entries(this.testResults).forEach(([test, passed]) => {
      this.log(`  ${test}: ${passed ? 'PASS' : 'FAIL'}`, passed ? 'success' : 'error');
    });
    
    if (this.errors.length > 0) {
      this.log(`\n❌ ERRORS (${this.errors.length}):`, 'error');
      this.errors.forEach((error, i) => {
        this.log(`  ${i + 1}. ${error.message}`, 'error');
      });
    }
    
    if (this.warnings.length > 0) {
      this.log(`\n⚠️ WARNINGS (${this.warnings.length}):`, 'warn');
      this.warnings.forEach((warning, i) => {
        this.log(`  ${i + 1}. ${warning.message}`, 'warn');
      });
    }

    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      summary: { total, passed, failed },
      results: this.testResults,
      errors: this.errors,
      warnings: this.warnings,
      readyForProduction: failed === 0 && this.errors.length === 0
    };

    fs.writeFileSync(
      path.join(__dirname, '../test-results.json'),
      JSON.stringify(report, null, 2)
    );

    this.log('\n📋 Report saved to test-results.json', 'info');
    
    return report.readyForProduction;
  }

  async runAllTests() {
    this.log('🚀 Starting Production Readiness Tests', 'info');
    this.log('='.repeat(50), 'info');
    
    // Run tests in order
    await this.testTypeCheck();
    await this.testLint();
    await this.testBuild();
    await this.testUnit();
    await this.testDatabase();
    await this.testLocalServer();
    
    const isReady = this.generateReport();
    
    if (isReady) {
      this.log('\n🎉 READY FOR PRODUCTION DEPLOYMENT!', 'success');
      process.exit(0);
    } else {
      this.log('\n🚫 NOT READY FOR PRODUCTION - Fix errors first', 'error');
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ProductionTester();
  tester.runAllTests().catch(console.error);
}

module.exports = ProductionTester;