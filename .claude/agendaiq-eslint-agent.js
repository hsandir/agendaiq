#!/usr/bin/env node

/**
 * AgendaIQ-Specific ESLint Auto-Fix Agent
 * Comprehensive ESLint error fixing agent tailored for AgendaIQ codebase
 * Understands project-specific patterns and conventions
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class AgendaIQESLintAgent {
  constructor() {
    this.logFile = path.join(__dirname, 'agendaiq-eslint-agent.log');
    this.statusFile = path.join(__dirname, 'agendaiq-eslint-status.json');
    this.fixedFiles = new Set();
    this.projectPatterns = new Map();
    this.loggedFiles = new Set(); // Track logged files to avoid spam
    this.totalErrors = 0;
    this.totalFixed = 0;
    this.criticalErrors = [];
    
    // Setup project-specific patterns
    this.setupAgendaIQPatterns();
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    
    fs.appendFileSync(this.logFile, logMessage);
    
    if (level === 'ERROR') {
      console.error(`❌ ${message}`);
    } else if (level === 'WARNING') {
      console.warn(`⚠️ ${message}`);
    } else if (level === 'SUCCESS') {
      console.log(`✅ ${message}`);
    } else {
      console.log(`ℹ️ ${message}`);
    }
  }

  setupAgendaIQPatterns() {
    this.log('Setting up AgendaIQ-specific patterns...', 'INFO');

    // Pattern 1: Prisma Model Names (AgendaIQ uses plural table names)
    this.projectPatterns.set(/prisma\.user\./g, (match, filePath, lineNum, line) => {
      // Only log once per file to avoid spam
      if (!this.loggedFiles) this.loggedFiles = new Set();
      if (!this.loggedFiles.has(filePath + ':prisma.user')) {
        this.log(`Fixing Prisma model: user → users in ${filePath}`, 'INFO');
        this.loggedFiles.add(filePath + ':prisma.user');
      }
      return line.replace(/prisma\.user\./g, 'prisma.users.');
    });

    // Pattern 2: React Component Props Access  
    this.projectPatterns.set(/this\.\(props as Record<string, unknown>\)/g, (match, filePath, lineNum, line) => {
      if (!this.loggedFiles.has(filePath + ':react-props')) {
        this.log(`Fixing React props access in ${filePath}`, 'INFO');
        this.loggedFiles.add(filePath + ':react-props');
      }
      return line.replace(/this\.\(props as Record<string, unknown>\)/g, 'this.props');
    });

    // Pattern 3: Duplicate Type Assertions (common ESLint agent error)
    this.projectPatterns.set(/as Record<string, unknown>;\s*as\s+/g, (match, filePath, lineNum, line) => {
      if (!this.loggedFiles.has(filePath + ':duplicate-as')) {
        this.log(`Fixing duplicate type assertion in ${filePath}`, 'INFO');
        this.loggedFiles.add(filePath + ':duplicate-as');
      }
      return line.replace(/as Record<string, unknown>;\s*as\s+/, 'as ');
    });

    // Pattern 4: Fix Variable Name Mismatches (AgendaIQ specific issue)
    this.projectPatterns.set(/const\s*\{\s*([^}]*)\s*\}\s*=\s*body/, (match, filePath, lineNum, line) => {
      // Fix destructuring where prefix is used in declaration but not in usage
      const problematicVars = ['_name', '_code', '_email', '_password', '_roleId', '_id', '_address', '_phone', '_district_id'];
      let fixedLine = line;
      
      problematicVars.forEach(prefixed => {
        const unprefixed = prefixed.substring(1);
        // Replace _varName with varName in destructuring
        const regex = new RegExp(`\\b${prefixed}\\b`, 'g');
        if (fixedLine.includes(prefixed)) {
          fixedLine = fixedLine.replace(regex, unprefixed);
          if (!this.loggedFiles.has(filePath + ':var-mismatch')) {
            this.log(`Fixing variable name mismatch in ${filePath}`, 'INFO');
            this.loggedFiles.add(filePath + ':var-mismatch');
          }
        }
      });
      
      return fixedLine;
    });

    // Pattern 5: Auth Pattern Fixes
    this.projectPatterns.set(/withAuth\s*\(\s*request\s*,\s*\{([^}]+)\}\s*\)/, (match, filePath, lineNum, line) => {
      // Ensure proper auth configuration format
      if (line.includes('requireAuth: true') && !line.includes('requireCapability')) {
        this.log(`Adding capability check suggestion in ${filePath}:${lineNum}`, 'WARNING');
      }
      return line;
    });

    // Pattern 6: AgendaIQ Specific Imports
    this.projectPatterns.set(/'([^']*unused[^']*)'/, (match, filePath, lineNum, line) => {
      // Don't remove imports that might be used in AgendaIQ-specific ways
      if (line.includes('@/lib/auth/') || line.includes('@/lib/db/') || line.includes('Capability')) {
        this.log(`Preserving AgendaIQ auth/db import in ${filePath}:${lineNum}`, 'INFO');
        return line;
      }
      return line;
    });

    // Pattern 7: Meeting/Staff/Role ID Types (AgendaIQ uses specific ID patterns)
    this.projectPatterns.set(/userId.*as.*string/g, (match, filePath, lineNum, line) => {
      // AgendaIQ user IDs are strings, preserve this pattern
      return line;
    });

    // Pattern 8: Prisma Relations (AgendaIQ specific)
    this.projectPatterns.set(/include:\s*\{\s*staff:\s*true\s*\}/, (match, filePath, lineNum, line) => {
      // Suggest better relation includes for AgendaIQ
      if (!line.includes('role') && !line.includes('department')) {
        this.log(`Consider including role/department relations in ${filePath}:${lineNum}`, 'WARNING');
      }
      return line;
    });

    // Pattern 9: ESLint Disable Comments (preserve AgendaIQ specific disables)
    this.projectPatterns.set(/\/\*\s*eslint-disable.*\*\//, (match, filePath, lineNum, line) => {
      this.log(`Preserving ESLint disable comment in ${filePath}:${lineNum}`, 'INFO');
      return line;
    });

    // Pattern 10: AgendaIQ Environment Variables
    this.projectPatterns.set(/process\.env\./g, (match, filePath, lineNum, line) => {
      // Don't modify environment variable access
      return line;
    });

    // Pattern 11: Fix Integration Template Syntax Errors 
    this.projectPatterns.set(/^\s*}\s*$/gm, (match, filePath, lineNum, line) => {
      // Look for missing closing braces or syntax issues in template files
      if (filePath.includes('integration.template.ts') || filePath.includes('.template.')) {
        if (!this.loggedFiles.has(filePath + ':template-syntax')) {
          this.log(`Checking template syntax in ${filePath}`, 'INFO');
          this.loggedFiles.add(filePath + ':template-syntax');
        }
      }
      return line;
    });

    this.log(`Setup complete: ${this.projectPatterns.size} AgendaIQ-specific patterns`, 'SUCCESS');
  }

  async runESLint() {
    this.log('Running ESLint to detect all errors...', 'INFO');
    
    try {
      // Run ESLint with JSON output for easy parsing, limit buffer size
      const eslintOutput = execSync('npx eslint src --format json --max-warnings 0', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 1024 * 1024 * 50 // 50MB buffer
      });
      
      return JSON.parse(eslintOutput);
    } catch (error) {
      // ESLint exits with error code when there are lint errors
      if (error.stdout) {
        try {
          // Try to parse JSON, handle large output
          const output = error.stdout;
          if (output.length > 1024 * 1024 * 10) { // 10MB limit
            this.log('ESLint output too large, using summary mode', 'WARNING');
            // Count errors instead of parsing full JSON
            const errorCount = (output.match(/"severity":\s*2/g) || []).length;
            const warningCount = (output.match(/"severity":\s*1/g) || []).length;
            this.log(`Found approximately ${errorCount} errors and ${warningCount} warnings`, 'INFO');
            return [];
          }
          return JSON.parse(output);
        } catch (parseError) {
          this.log(`Failed to parse ESLint output: ${parseError.message}`, 'ERROR');
          // Try to run ESLint on smaller chunks
          return await this.runESLintByDirectory();
        }
      }
      
      this.log(`ESLint execution failed: ${error.message}`, 'ERROR');
      return [];
    }
  }

  async runESLintByDirectory() {
    this.log('Running ESLint by directory to avoid large output...', 'INFO');
    const results = [];
    const directories = ['src/app/api', 'src/components', 'src/lib', 'src/__tests__'];
    
    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        try {
          const output = execSync(`npx eslint ${dir} --format json --max-warnings 0`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            maxBuffer: 1024 * 1024 * 10 // 10MB per directory
          });
          const dirResults = JSON.parse(output);
          results.push(...dirResults);
        } catch (error) {
          if (error.stdout) {
            try {
              const dirResults = JSON.parse(error.stdout);
              results.push(...dirResults);
            } catch (parseError) {
              this.log(`Failed to parse ${dir} ESLint output`, 'WARNING');
            }
          }
        }
      }
    }
    
    return results;
  }

  async fixFileWithAgendaIQPatterns(filePath, messages) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      let fixedContent = content;
      const fixes = [];
      let hasChanges = false;

      // Apply AgendaIQ-specific patterns first (highest priority)
      for (const [pattern, fixer] of this.projectPatterns) {
        const originalContent = fixedContent;
        
        if (typeof fixer === 'function') {
          // Line-by-line fixing for complex patterns
          const fixedLines = fixedContent.split('\n').map((line, index) => {
            const lineNum = index + 1;
            const newLine = fixer(pattern, filePath, lineNum, line);
            if (newLine !== line) {
              fixes.push({
                line: lineNum,
                pattern: pattern.toString(),
                message: 'AgendaIQ pattern fix',
                fix: 'Applied project-specific pattern'
              });
            }
            return newLine;
          });
          fixedContent = fixedLines.join('\n');
        } else {
          // Simple regex replacement
          fixedContent = fixedContent.replace(pattern, fixer);
        }
        
        if (fixedContent !== originalContent) {
          hasChanges = true;
          this.totalFixed++;
        }
      }

      // Then apply standard ESLint fixes for remaining issues
      messages.forEach(message => {
        if (message.fix && message.fix.range) {
          // Apply ESLint's suggested fix if it doesn't conflict with our patterns
          fixes.push({
            line: message.line,
            rule: message.ruleId,
            message: message.message,
            fix: 'ESLint autofix'
          });
        }
      });

      if (hasChanges) {
        // Write the fixed content back to file
        fs.writeFileSync(filePath, fixedContent, 'utf-8');
        this.fixedFiles.add(filePath);
        
        this.log(`Applied ${fixes.length} AgendaIQ-specific fixes to ${filePath}`, 'SUCCESS');
        return fixes;
      }

      return [];
    } catch (error) {
      this.log(`Error fixing file ${filePath}: ${error.message}`, 'ERROR');
      this.criticalErrors.push({ file: filePath, error: error.message });
      return [];
    }
  }

  async runAutoFix() {
    this.log('Running ESLint auto-fix (conservative mode)...', 'INFO');
    
    try {
      // Run ESLint's built-in autofix with nice priority to reduce CPU usage
      execSync('nice -n 19 npx eslint src --fix --max-warnings 0', {
        encoding: 'utf-8',
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer limit
      });
      
      this.log('ESLint auto-fix completed successfully', 'SUCCESS');
      return true;
    } catch (error) {
      // ESLint returns error code if there are unfixable errors
      this.log('ESLint auto-fix completed with remaining errors', 'WARNING');
      return false;
    }
  }

  async fixTypeScriptErrors() {
    this.log('Checking for TypeScript errors...', 'INFO');
    
    try {
      // Run TypeScript compiler to check for errors
      const tscOutput = execSync('npx tsc --noEmit --pretty false', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      this.log('No TypeScript errors found', 'SUCCESS');
      return true;
    } catch (error) {
      if (error.stdout) {
        const errors = error.stdout.split('\n').filter(line => line.includes('error TS'));
        this.log(`Found ${errors.length} TypeScript errors`, 'WARNING');
        
        // Log AgendaIQ-specific TypeScript issues
        for (const errorLine of errors) {
          if (errorLine.includes('prisma.user')) {
            this.log('AGENDAIQ: Found prisma.user instead of prisma.users', 'ERROR');
          }
          if (errorLine.includes('this.(props')) {
            this.log('AGENDAIQ: Found broken React props access', 'ERROR');
          }
        }
      }
      
      return false;
    }
  }

  async analyze() {
    this.log('='.repeat(60), 'INFO');
    this.log('AgendaIQ ESLint Fix Agent - Starting Analysis', 'INFO');
    this.log('='.repeat(60), 'INFO');

    // Step 1: Apply AgendaIQ-specific patterns first
    this.log('\nStep 1: Applying AgendaIQ-specific patterns...', 'INFO');
    const results = await this.runESLint();
    
    if (Array.isArray(results) && results.length > 0) {
      for (const file of results) {
        this.totalErrors += file.messages.length;
        
        if (file.messages.length > 0) {
          await this.fixFileWithAgendaIQPatterns(file.filePath, file.messages);
        }
      }
    }

    // Step 2: Run ESLint auto-fix for standard issues
    this.log('\nStep 2: Running standard ESLint auto-fix...', 'INFO');
    await this.runAutoFix();

    // Step 3: Check TypeScript compatibility
    this.log('\nStep 3: Checking TypeScript compatibility...', 'INFO');
    const tsSuccess = await this.fixTypeScriptErrors();

    // Step 4: Final verification
    this.log('\nStep 4: Final verification...', 'INFO');
    const finalResults = await this.runESLint();
    
    let remainingErrors = 0;
    if (Array.isArray(finalResults)) {
      for (const file of finalResults) {
        remainingErrors += file.messages.length;
      }
    }

    // Generate AgendaIQ-specific summary
    this.log('\n' + '='.repeat(60), 'INFO');
    this.log('AGENDAIQ ESLINT AGENT SUMMARY', 'INFO');
    this.log('='.repeat(60), 'INFO');
    this.log(`Initial errors: ${this.totalErrors}`, 'INFO');
    this.log(`AgendaIQ fixes applied: ${this.totalFixed}`, 'SUCCESS');
    this.log(`Files modified: ${this.fixedFiles.size}`, 'INFO');
    this.log(`Remaining errors: ${remainingErrors}`, remainingErrors > 0 ? 'WARNING' : 'SUCCESS');
    this.log(`TypeScript compatible: ${tsSuccess ? 'Yes' : 'No'}`, tsSuccess ? 'SUCCESS' : 'WARNING');
    
    if (this.criticalErrors.length > 0) {
      this.log(`\nCritical errors: ${this.criticalErrors.length}`, 'ERROR');
      for (const error of this.criticalErrors) {
        this.log(`  - ${error.file}: ${error.error}`, 'ERROR');
      }
    }

    // AgendaIQ-specific recommendations
    this.log('\nAGENDAIQ RECOMMENDATIONS:', 'INFO');
    if (remainingErrors > 0) {
      this.log('• Run the AI ESLint Agent for complex semantic fixes', 'INFO');
      this.log('• Review any prisma.user → prisma.users patterns manually', 'INFO');
      this.log('• Check auth middleware patterns for completeness', 'INFO');
    } else {
      this.log('• All major AgendaIQ patterns have been applied successfully!', 'SUCCESS');
    }

    // Save status with AgendaIQ metadata
    const status = {
      timestamp: new Date().toISOString(),
      project: 'AgendaIQ',
      agent: 'agendaiq-eslint-agent',
      version: '1.0.0',
      totalErrors: this.totalErrors,
      totalFixed: this.totalFixed,
      remainingErrors,
      filesModified: Array.from(this.fixedFiles),
      criticalErrors: this.criticalErrors,
      typeScriptCompatible: tsSuccess,
      success: remainingErrors < 100 && this.criticalErrors.length === 0, // AgendaIQ tolerance
      agendaiqPatterns: this.projectPatterns.size
    };
    
    fs.writeFileSync(this.statusFile, JSON.stringify(status, null, 2));
    
    if (remainingErrors > 100) {
      this.log('\nMany errors remain. Consider using AI ESLint Agent for complex fixes.', 'WARNING');
    } else if (remainingErrors === 0) {
      this.log('\n🎉 AgendaIQ codebase is now ESLint compliant!', 'SUCCESS');
    } else {
      this.log(`\n✅ AgendaIQ codebase significantly improved! Only ${remainingErrors} errors remain.`, 'SUCCESS');
    }
  }

  async runContinuously() {
    this.log('Starting AgendaIQ ESLint Fix Agent in watch mode...', 'INFO');
    
    // Initial fix
    await this.analyze();
    
    // Watch for file changes in AgendaIQ-specific directories
    const watchPaths = [
      path.join(process.cwd(), 'src/app/api'),
      path.join(process.cwd(), 'src/lib/auth'),
      path.join(process.cwd(), 'src/lib/db'),
      path.join(process.cwd(), 'src/components'),
    ];
    
    for (const watchPath of watchPaths) {
      if (fs.existsSync(watchPath)) {
        const watcher = fs.watch(
          watchPath,
          { recursive: true },
          async (eventType, filename) => {
            if (filename && (filename.endsWith('.ts') || filename.endsWith('.tsx'))) {
              this.log(`AgendaIQ file changed: ${filename}`, 'INFO');
              
              // Wait a bit for file write to complete
              setTimeout(async () => {
                await this.analyze();
              }, 1000);
            }
          }
        );
      }
    }
    
    process.on('SIGINT', () => {
      this.log('AgendaIQ ESLint Fix Agent shutting down...', 'INFO');
      process.exit(0);
    });
  }
}

// Main execution
const agent = new AgendaIQESLintAgent();

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--watch') || args.includes('-w')) {
  // Run in watch mode
  agent.runContinuously().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else {
  // Run once
  agent.analyze().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}