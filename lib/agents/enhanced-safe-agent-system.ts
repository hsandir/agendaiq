/**
 * Enhanced Safe Agent System - TypeScript Lint Enforcer Integration
 * 
 * This system provides comprehensive protection when running agents that modify TypeScript files.
 * It includes:
 * - Pre-execution baseline establishment
 * - Comprehensive backup management
 * - Post-execution validation with error comparison
 * - Automatic rollback on validation failure
 * - Detailed reporting and logging
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface BackupEntry {
  filePath: string;
  backupPath: string;
  originalContent: string;
  timestamp: number;
  checksum: string;
}

interface ErrorCount {
  syntaxErrors: number;
  typeErrors: number;
  totalErrors: number;
  totalWarnings: number;
  errorsByFile: Map<string, number>;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  baseline: ErrorCount;
  current: ErrorCount;
  errorDelta: number;
  warningDelta: number;
  newSyntaxErrors: string[];
  fixedErrors: string[];
}

interface AgentSession {
  sessionId: string;
  timestamp: number;
  backupDir: string;
  logFile: string;
  description: string;
}

export class EnhancedSafeAgentSystem {
  private backups = new Map<string, BackupEntry>();
  private session: AgentSession;
  private baseline: ErrorCount | null = null;

  constructor(description = 'Safe Agent Operation') {
    const timestamp = Date.now();
    this.session = {
      sessionId: timestamp.toString(),
      timestamp,
      backupDir: path.join(process.cwd(), '.agent-backups', timestamp.toString()),
      logFile: path.join(process.cwd(), '.agent-backups', `${timestamp}.log`),
      description
    };
  }

  /**
   * Initialize session and establish baseline error count
   */
  async initialize(): Promise<void> {
    await this.log('🚀 Initializing Enhanced Safe Agent System');
    await this.log(`📋 Session: ${this.session.description}`);
    
    // Create backup directory
    await fs.mkdir(this.session.backupDir, { recursive: true });
    await fs.mkdir(path.dirname(this.session.logFile), { recursive: true });

    // Establish baseline
    await this.log('📊 Establishing TypeScript error baseline...');
    this.baseline = await this.getTypeScriptErrorCount();
    
    await this.log(`📈 Baseline established: ${this.baseline.totalErrors} errors, ${this.baseline.totalWarnings} warnings`);
    await this.log(`   - Syntax errors: ${this.baseline.syntaxErrors}`);
    await this.log(`   - Type errors: ${this.baseline.typeErrors}`);
    await this.log(`   - Files with errors: ${this.baseline.errorsByFile.size}`);
  }

  /**
   * Get comprehensive TypeScript error count
   */
  private async getTypeScriptErrorCount(): Promise<ErrorCount> {
    const errorCount: ErrorCount = {
      syntaxErrors: 0,
      typeErrors: 0,
      totalErrors: 0,
      totalWarnings: 0,
      errorsByFile: new Map()
    };

    try {
      const { stderr } = await execAsync('npm run type-check', { 
        cwd: process.cwd(),
        timeout: 120000 // 2 minute timeout
      });

      if (stderr) {
        const lines = stderr.split('\n');
        for (const line of lines) {
          if (line.includes('error TS')) {
            errorCount.totalErrors++;
            
            // Parse file path
            const fileMatch = line.match(/^([^(]+)\(/);
            if (fileMatch) {
              const filePath = fileMatch[1];
              const currentCount = errorCount.errorsByFile.get(filePath) || 0;
              errorCount.errorsByFile.set(filePath, currentCount + 1);
            }

            // Categorize error types
            if (line.includes('error TS1') || line.includes('error TS2657')) {
              errorCount.syntaxErrors++;
            } else {
              errorCount.typeErrors++;
            }
          }
        }
      }
    } catch (error) {
      // If type-check fails, count the errors from the error output
      if (typeof error === 'object' && error !== null && 'stderr' in error) {
        const stderr = (error as any).stderr;
        const lines = stderr.split('\n');
        for (const line of lines) {
          if (line.includes('error TS')) {
            errorCount.totalErrors++;
            if (line.includes('error TS1') || line.includes('error TS2657')) {
              errorCount.syntaxErrors++;
            } else {
              errorCount.typeErrors++;
            }
          }
        }
      }
    }

    return errorCount;
  }

  /**
   * Create backup of a file with checksum verification
   */
  async createBackup(filePath: string): Promise<void> {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read original content
      const originalContent = await fs.readFile(filePath, 'utf-8');
      
      // Generate checksum
      const checksum = this.generateChecksum(originalContent);
      
      // Create backup path
      const relativePath = path.relative(process.cwd(), filePath).replace(/[/\\]/g, '_');
      const backupPath = path.join(this.session.backupDir, `${relativePath}.backup`);
      
      // Write backup
      await fs.writeFile(backupPath, originalContent, 'utf-8');
      
      // Store backup entry
      this.backups.set(filePath, {
        filePath,
        backupPath,
        originalContent,
        timestamp: Date.now(),
        checksum
      });

      await this.log(`✅ Backup created: ${filePath}`);
      
    } catch (error) {
      await this.log(`❌ Failed to backup ${filePath}: ${error}`);
      throw error;
    }
  }

  /**
   * Create backups for multiple files
   */
  async createBackups(filePaths: string[]): Promise<void> {
    await this.log(`📦 Creating backups for ${filePaths.length} files...`);
    
    for (const filePath of filePaths) {
      await this.createBackup(filePath);
    }
    
    await this.log(`✅ All backups created successfully`);
  }

  /**
   * Restore a single file from backup
   */
  async restoreBackup(filePath: string): Promise<void> {
    const backup = this.backups.get(filePath);
    if (!backup) {
      throw new Error(`No backup found for: ${filePath}`);
    }

    try {
      await fs.writeFile(filePath, backup.originalContent, 'utf-8');
      await this.log(`🔄 Restored: ${filePath}`);
    } catch (error) {
      await this.log(`❌ Failed to restore ${filePath}: ${error}`);
      throw error;
    }
  }

  /**
   * Restore all files from backups
   */
  async restoreAllBackups(): Promise<void> {
    await this.log(`🔄 Restoring ${this.backups.size} files from backup...`);
    
    const errors: string[] = [];
    for (const [filePath] of this.backups) {
      try {
        await this.restoreBackup(filePath);
      } catch (error) {
        errors.push(`${filePath}: ${error}`);
      }
    }

    if (errors.length > 0) {
      await this.log(`⚠️  Some files failed to restore:`);
      for (const error of errors) {
        await this.log(`   - ${error}`);
      }
      throw new Error(`Failed to restore ${errors.length} files`);
    }

    await this.log(`✅ All files restored successfully`);
  }

  /**
   * Validate current state against baseline
   */
  async validateChanges(): Promise<ValidationResult> {
    await this.log('🔍 Validating changes against baseline...');
    
    const current = await this.getTypeScriptErrorCount();
    const baseline = this.baseline!;
    
    const errorDelta = current.totalErrors - baseline.totalErrors;
    const warningDelta = current.totalWarnings - baseline.totalWarnings;
    
    const result: ValidationResult = {
      isValid: errorDelta <= 0, // Valid if errors didn't increase
      errors: [],
      warnings: [],
      baseline,
      current,
      errorDelta,
      warningDelta,
      newSyntaxErrors: [],
      fixedErrors: []
    };

    // Analyze error changes
    if (errorDelta > 0) {
      result.errors.push(`TypeScript errors increased by ${errorDelta}`);
      result.isValid = false;
    } else if (errorDelta < 0) {
      result.fixedErrors.push(`Fixed ${Math.abs(errorDelta)} TypeScript errors`);
    }

    // Check for new syntax errors
    const syntaxErrorDelta = current.syntaxErrors - baseline.syntaxErrors;
    if (syntaxErrorDelta > 0) {
      result.errors.push(`New syntax errors introduced: ${syntaxErrorDelta}`);
      result.newSyntaxErrors.push(`${syntaxErrorDelta} new syntax errors detected`);
      result.isValid = false;
    }

    // Log validation results
    await this.log('📊 Validation Results:');
    await this.log(`   - Baseline errors: ${baseline.totalErrors}`);
    await this.log(`   - Current errors: ${current.totalErrors}`);
    await this.log(`   - Error delta: ${errorDelta > 0 ? '+' : ''}${errorDelta}`);
    await this.log(`   - Syntax error delta: ${syntaxErrorDelta > 0 ? '+' : ''}${syntaxErrorDelta}`);
    await this.log(`   - Valid: ${result.isValid ? '✅' : '❌'}`);

    return result;
  }

  /**
   * Execute TypeScript Lint Enforcer Agent safely
   */
  async executeTypeScriptLintEnforcer(
    targetFiles: string[],
    agentFunction: () => Promise<any>,
    options: {
      allowableErrorIncrease?: number;
      rollbackOnAnyIncrease?: boolean;
      description?: string;
    } = {}
  ): Promise<{ success: boolean; result?: any; validationResult: ValidationResult; report: string }> {
    
    const startTime = Date.now();
    await this.log(`\n🎯 Starting TypeScript Lint Enforcer Agent`);
    await this.log(`📁 Target files: ${targetFiles.length}`);
    
    try {
      // Step 1: Create backups
      await this.createBackups(targetFiles);
      
      // Step 2: Execute agent
      await this.log('🤖 Executing TypeScript Lint Enforcer...');
      const agentResult = await agentFunction();
      await this.log('✅ Agent execution completed');
      
      // Step 3: Validate changes
      const validationResult = await this.validateChanges();
      
      // Step 4: Decision logic
      const shouldRollback = this.shouldRollback(validationResult, options);
      
      if (shouldRollback) {
        // Rollback
        await this.log('❌ Validation failed - rolling back changes...');
        await this.restoreAllBackups();
        
        const report = await this.generateReport(validationResult, false, Date.now() - startTime);
        return { 
          success: false, 
          validationResult, 
          report 
        };
      } else {
        // Success
        await this.log('✅ Validation passed - changes accepted');
        const report = await this.generateReport(validationResult, true, Date.now() - startTime);
        return { 
          success: true, 
          result: agentResult, 
          validationResult, 
          report 
        };
      }
      
    } catch (error) {
      await this.log(`💥 Agent execution failed: ${error}`);
      
      // Attempt rollback on error
      try {
        await this.restoreAllBackups();
        await this.log('🔄 Emergency rollback completed');
      } catch (rollbackError) {
        await this.log(`💥 Emergency rollback failed: ${rollbackError}`);
      }
      
      throw error;
    }
  }

  /**
   * Determine if changes should be rolled back
   */
  private shouldRollback(
    validation: ValidationResult, 
    options: { allowableErrorIncrease?: number; rollbackOnAnyIncrease?: boolean }
  ): boolean {
    // Always rollback on syntax errors
    if (validation.newSyntaxErrors.length > 0) {
      return true;
    }
    
    // Rollback if configured to do so on any increase
    if (options.rollbackOnAnyIncrease && validation.errorDelta > 0) {
      return true;
    }
    
    // Rollback if errors increased beyond allowable threshold
    const allowableIncrease = options.allowableErrorIncrease ?? 0;
    if (validation.errorDelta > allowableIncrease) {
      return true;
    }
    
    // Don't rollback if validation passed
    return !validation.isValid;
  }

  /**
   * Generate comprehensive report
   */
  private async generateReport(
    validation: ValidationResult, 
    success: boolean, 
    executionTimeMs: number
  ): Promise<string> {
    const report = [
      '=' .repeat(60),
      '🛡️  ENHANCED SAFE AGENT SYSTEM REPORT',
      '=' .repeat(60),
      '',
      `📋 Session: ${this.session.description}`,
      `🕐 Execution Time: ${(executionTimeMs / 1000).toFixed(2)}s`,
      `📅 Timestamp: ${new Date().toISOString()}`,
      `📁 Backup Directory: ${this.session.backupDir}`,
      `📄 Log File: ${this.session.logFile}`,
      '',
      '📊 BASELINE vs CURRENT',
      `   Baseline Errors: ${validation.baseline.totalErrors}`,
      `   Current Errors:  ${validation.current.totalErrors}`,
      `   Error Delta:     ${validation.errorDelta > 0 ? '+' : ''}${validation.errorDelta}`,
      `   Syntax Errors:   ${validation.baseline.syntaxErrors} → ${validation.current.syntaxErrors}`,
      `   Type Errors:     ${validation.baseline.typeErrors} → ${validation.current.typeErrors}`,
      '',
      `🎯 RESULT: ${success ? '✅ SUCCESS' : '❌ FAILED'}`,
      ''
    ];

    if (success) {
      report.push('🎉 CHANGES ACCEPTED:');
      if (validation.errorDelta < 0) {
        report.push(`   ✅ Fixed ${Math.abs(validation.errorDelta)} errors`);
      } else if (validation.errorDelta === 0) {
        report.push(`   ✅ No new errors introduced`);
      }
      
      if (validation.fixedErrors.length > 0) {
        report.push('   🔧 Improvements:');
        for (const fix of validation.fixedErrors) {
          report.push(`      - ${fix}`);
        }
      }
    } else {
      report.push('🚫 CHANGES ROLLED BACK:');
      for (const error of validation.errors) {
        report.push(`   ❌ ${error}`);
      }
      
      if (validation.newSyntaxErrors.length > 0) {
        report.push('   🚨 New syntax errors detected:');
        for (const syntaxError of validation.newSyntaxErrors) {
          report.push(`      - ${syntaxError}`);
        }
      }
    }

    report.push('');
    report.push('📦 BACKUP INFORMATION:');
    report.push(`   Files backed up: ${this.backups.size}`);
    for (const [filePath] of this.backups) {
      report.push(`   - ${path.relative(process.cwd(), filePath)}`);
    }
    
    report.push('');
    report.push('=' .repeat(60));

    const reportText = report.join('\n');
    
    // Save report to file
    const reportPath = path.join(this.session.backupDir, 'execution-report.txt');
    await fs.writeFile(reportPath, reportText, 'utf-8');
    
    return reportText;
  }

  /**
   * Log message with timestamp
   */
  private async log(message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    // Log to console
    console.log(message);
    
    // Log to file
    await fs.appendFile(this.session.logFile, logEntry, 'utf-8');
  }

  /**
   * Generate simple checksum for content verification
   */
  private generateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Clean up session files
   */
  async cleanup(keepReports = true): Promise<void> {
    try {
      if (keepReports) {
        // Only remove backup files, keep reports and logs
        for (const [, backup] of this.backups) {
          try {
            await fs.unlink(backup.backupPath);
          } catch {
            // Ignore if file doesn't exist
          }
        }
        await this.log('🗑️  Cleaned up backup files (keeping reports)');
      } else {
        // Remove entire session directory
        await fs.rm(this.session.backupDir, { recursive: true, force: true });
        await this.log('🗑️  Cleaned up entire session');
      }
      
      this.backups.clear();
    } catch (error) {
      await this.log(`❌ Cleanup failed: ${error}`);
    }
  }

  /**
   * Get session information
   */
  getSessionInfo(): AgentSession {
    return { ...this.session };
  }

  /**
   * Get backup information
   */
  getBackupInfo(): BackupEntry[] {
    return Array.from(this.backups.values());
  }
}

/**
 * Convenience function for TypeScript Lint Enforcer integration
 */
export async function safeTypeScriptLintEnforcer(
  targetFiles: string[],
  lintEnforcerFunction: () => Promise<any>,
  options: {
    description?: string;
    allowableErrorIncrease?: number;
    rollbackOnAnyIncrease?: boolean;
    keepReportsOnSuccess?: boolean;
  } = {}
): Promise<{ 
  success: boolean; 
  result?: any; 
  report: string; 
  sessionInfo: AgentSession 
}> {
  
  const safeSystem = new EnhancedSafeAgentSystem(
    options.description || 'TypeScript Lint Enforcer Safe Operation'
  );
  
  try {
    // Initialize system
    await safeSystem.initialize();
    
    // Execute safe operation
    const executionResult = await safeSystem.executeTypeScriptLintEnforcer(
      targetFiles,
      lintEnforcerFunction,
      {
        allowableErrorIncrease: options.allowableErrorIncrease,
        rollbackOnAnyIncrease: options.rollbackOnAnyIncrease
      }
    );
    
    // Cleanup (keep reports if successful and requested)
    const keepReports = executionResult.success && (options.keepReportsOnSuccess ?? true);
    await safeSystem.cleanup(keepReports);
    
    return {
      success: executionResult.success,
      result: executionResult.result,
      report: executionResult.report,
      sessionInfo: safeSystem.getSessionInfo()
    };
    
  } catch (error) {
    await safeSystem.cleanup(true); // Always keep reports on error
    throw error;
  }
}

export default EnhancedSafeAgentSystem;