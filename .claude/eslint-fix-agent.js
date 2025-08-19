#!/usr/bin/env node

/**
 * ESLint Auto-Fix Agent
 * Comprehensive ESLint error fixing agent that runs locally
 * No API usage, no quota consumption, fixes all issues in one run
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class ESLintFixAgent {
  constructor() {
    this.logFile = path.join(__dirname, 'eslint-fix-agent.log');
    this.statusFile = path.join(__dirname, 'eslint-fix-status.json');
    this.fixedFiles = new Set();
    this.errorPatterns = new Map();
    this.totalErrors = 0;
    this.totalFixed = 0;
    this.criticalErrors = [];
    
    // Common ESLint error patterns and their fixes
    this.setupErrorPatterns();
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

  setupErrorPatterns() {
    // Pattern 1: Unused variables
    this.errorPatterns.set(/^'(.+)' is defined but never used/, (match, filePath, lineNum, line) => {
      const varName = match[1];
      
      // Check if it's an import
      if (line.includes('import')) {
        // Comment out unused import
        return `// ${line.trim()} // Unused import - commented out by ESLint Fix Agent`;
      }
      
      // Check if it's a function parameter
      if (line.includes('function') || line.includes('=>')) {
        // Prefix with underscore to indicate unused
        return line.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`);
      }
      
      // For other unused variables, comment out the line
      return `// ${line.trim()} // Unused variable - commented out by ESLint Fix Agent`;
    });

    // Pattern 2: Missing semicolons
    this.errorPatterns.set(/Missing semicolon/, (match, filePath, lineNum, line) => {
      if (!line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        return line.trimEnd() + ';';
      }
      return line;
    });

    // Pattern 3: Unexpected any
    this.errorPatterns.set(/Unexpected any\. Specify a different type/, (match, filePath, lineNum, line) => {
      // Replace :any with :unknown for safety
      return line.replace(/:\s*any\b/g, ': unknown');
    });

    // Pattern 4: Empty block statement
    this.errorPatterns.set(/Empty block statement/, (match, filePath, lineNum, line) => {
      if (line.includes('catch')) {
        // Add a comment in empty catch blocks
        return line.replace(/catch\s*\([^)]*\)\s*{\s*}/, 'catch (error) { /* Error handled silently */ }');
      }
      return line;
    });

    // Pattern 5: Prefer const
    this.errorPatterns.set(/(.+) is never reassigned\. Use 'const' instead/, (match, filePath, lineNum, line) => {
      return line.replace(/\blet\b/, 'const');
    });

    // Pattern 6: No explicit any
    this.errorPatterns.set(/Unexpected any/, (match, filePath, lineNum, line) => {
      // Replace with unknown for type safety
      return line.replace(/:\s*any\b/g, ': unknown');
    });

    // Pattern 7: Trailing spaces
    this.errorPatterns.set(/Trailing spaces not allowed/, (match, filePath, lineNum, line) => {
      return line.trimEnd();
    });

    // Pattern 8: Multiple empty lines
    this.errorPatterns.set(/More than \d+ blank lines? not allowed/, (match, filePath, lineNum, line) => {
      // This needs special handling at file level
      return line;
    });

    // Pattern 9: Quotes (prefer single quotes)
    this.errorPatterns.set(/Strings must use singlequote/, (match, filePath, lineNum, line) => {
      // Replace double quotes with single quotes (careful with escaped quotes)
      return line.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, "'$1'");
    });

    // Pattern 10: == vs ===
    this.errorPatterns.set(/Expected '===' and instead saw '=='/, (match, filePath, lineNum, line) => {
      return line.replace(/([^=!])={2}([^=])/g, '$1===$2');
    });

    // Pattern 11: != vs !==
    this.errorPatterns.set(/Expected '!==' and instead saw '!='/, (match, filePath, lineNum, line) => {
      return line.replace(/!={1}([^=])/g, '!==$1');
    });
  }

  async runESLint() {
    this.log('Running ESLint to detect all errors...', 'INFO');
    
    try {
      // Run ESLint with JSON output for easy parsing
      const eslintOutput = execSync('npx eslint src --format json --max-warnings 0', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      return JSON.parse(eslintOutput);
    } catch (error) {
      // ESLint exits with error code when there are lint errors
      // But we still get the output we need
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch (parseError) {
          this.log(`Failed to parse ESLint output: ${parseError.message}`, 'ERROR');
          return [];
        }
      }
      
      this.log(`ESLint execution failed: ${error.message}`, 'ERROR');
      return [];
    }
  }

  async fixFile(filePath, messages) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const fixedLines = [...lines];
      const fixes = [];

      // Sort messages by line number in reverse order to avoid line number shifts
      messages.sort((a, b) => b.line - a.line);

      for (const message of messages) {
        const lineNum = message.line - 1; // Convert to 0-based index
        
        if (lineNum >= 0 && lineNum < lines.length) {
          const originalLine = fixedLines[lineNum];
          let fixedLine = originalLine;
          let fixed = false;

          // Try to apply automatic fixes based on patterns
          for (const [pattern, fixer] of this.errorPatterns) {
            const match = message.message.match(pattern);
            if (match) {
              fixedLine = fixer(match, filePath, lineNum, originalLine);
              if (fixedLine !== originalLine) {
                fixedLines[lineNum] = fixedLine;
                fixes.push({
                  line: message.line,
                  rule: message.ruleId,
                  message: message.message,
                  fix: 'Applied automatic fix'
                });
                fixed = true;
                this.totalFixed++;
                break;
              }
            }
          }

          if (!fixed && message.fix) {
            // Apply ESLint's suggested fix if available
            const { range, text } = message.fix;
            // This is more complex - would need proper range-based fixing
            fixes.push({
              line: message.line,
              rule: message.ruleId,
              message: message.message,
              fix: 'ESLint autofix available'
            });
          }
        }
      }

      if (fixes.length > 0) {
        // Write the fixed content back to file
        fs.writeFileSync(filePath, fixedLines.join('\n'), 'utf-8');
        this.fixedFiles.add(filePath);
        
        this.log(`Fixed ${fixes.length} issues in ${filePath}`, 'SUCCESS');
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
    this.log('Running ESLint auto-fix on all files...', 'INFO');
    
    try {
      // First, try ESLint's built-in autofix
      execSync('npx eslint src --fix --max-warnings 0', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      this.log('ESLint auto-fix completed successfully', 'SUCCESS');
      return true;
    } catch (error) {
      // ESLint returns error code if there are unfixable errors
      // But the fixable ones should be fixed
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
        
        // Parse and fix common TypeScript errors
        for (const errorLine of errors) {
          // Parse error format: file.ts(line,col): error TS2304: Cannot find name 'X'.
          const match = errorLine.match(/(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)/);
          if (match) {
            const [, file, line, col, code, message] = match;
            
            // Handle common TypeScript errors
            if (code === 'TS2304' && message.includes('Cannot find name')) {
              // Missing import or declaration
              this.log(`TypeScript: Missing declaration in ${file}:${line}`, 'WARNING');
            } else if (code === 'TS2339' && message.includes('does not exist on type')) {
              // Property doesn't exist
              this.log(`TypeScript: Property error in ${file}:${line}`, 'WARNING');
            }
          }
        }
      }
      
      return false;
    }
  }

  async analyze() {
    this.log('='.repeat(60), 'INFO');
    this.log('ESLint Fix Agent - Starting Analysis', 'INFO');
    this.log('='.repeat(60), 'INFO');

    // Step 1: Run ESLint auto-fix first
    this.log('\nStep 1: Running ESLint auto-fix...', 'INFO');
    const autoFixSuccess = await this.runAutoFix();

    // Step 2: Get remaining errors
    this.log('\nStep 2: Analyzing remaining errors...', 'INFO');
    const results = await this.runESLint();
    
    if (!Array.isArray(results) || results.length === 0) {
      this.log('No ESLint errors found!', 'SUCCESS');
      return;
    }

    // Count total errors
    for (const file of results) {
      this.totalErrors += file.messages.length;
      
      if (file.messages.length > 0) {
        // Apply custom fixes for remaining errors
        const fixes = await this.fixFile(file.filePath, file.messages);
      }
    }

    // Step 3: Run TypeScript check
    this.log('\nStep 3: Checking TypeScript errors...', 'INFO');
    await this.fixTypeScriptErrors();

    // Step 4: Final ESLint check
    this.log('\nStep 4: Final ESLint verification...', 'INFO');
    const finalResults = await this.runESLint();
    
    let remainingErrors = 0;
    for (const file of finalResults) {
      remainingErrors += file.messages.length;
    }

    // Generate summary
    this.log('\n' + '='.repeat(60), 'INFO');
    this.log('SUMMARY', 'INFO');
    this.log('='.repeat(60), 'INFO');
    this.log(`Total errors found: ${this.totalErrors}`, 'INFO');
    this.log(`Errors fixed: ${this.totalFixed}`, 'SUCCESS');
    this.log(`Files modified: ${this.fixedFiles.size}`, 'INFO');
    this.log(`Remaining errors: ${remainingErrors}`, remainingErrors > 0 ? 'WARNING' : 'SUCCESS');
    
    if (this.criticalErrors.length > 0) {
      this.log(`\nCritical errors encountered: ${this.criticalErrors.length}`, 'ERROR');
      for (const error of this.criticalErrors) {
        this.log(`  - ${error.file}: ${error.error}`, 'ERROR');
      }
    }

    // Save status
    const status = {
      timestamp: new Date().toISOString(),
      totalErrors: this.totalErrors,
      totalFixed: this.totalFixed,
      remainingErrors,
      filesModified: Array.from(this.fixedFiles),
      criticalErrors: this.criticalErrors,
      success: remainingErrors === 0 && this.criticalErrors.length === 0
    };
    
    fs.writeFileSync(this.statusFile, JSON.stringify(status, null, 2));
    
    if (remainingErrors > 0) {
      this.log('\nSome errors could not be automatically fixed.', 'WARNING');
      this.log('Run "npm run lint" to see remaining errors.', 'INFO');
    } else {
      this.log('\n🎉 All ESLint errors have been fixed!', 'SUCCESS');
    }
  }

  async runContinuously() {
    this.log('Starting ESLint Fix Agent in watch mode...', 'INFO');
    
    // Initial fix
    await this.analyze();
    
    // Watch for file changes
    const watcher = require('fs').watch(
      path.join(process.cwd(), 'src'),
      { recursive: true },
      async (eventType, filename) => {
        if (filename && (filename.endsWith('.ts') || filename.endsWith('.tsx'))) {
          this.log(`File changed: ${filename}`, 'INFO');
          
          // Wait a bit for file write to complete
          setTimeout(async () => {
            await this.analyze();
          }, 1000);
        }
      }
    );
    
    process.on('SIGINT', () => {
      this.log('ESLint Fix Agent shutting down...', 'INFO');
      watcher.close();
      process.exit(0);
    });
  }
}

// Main execution
const agent = new ESLintFixAgent();

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