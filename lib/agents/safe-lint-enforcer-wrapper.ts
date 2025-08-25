/**
 * Safe TypeScript Lint Enforcer Wrapper
 * 
 * This module provides safe wrappers around TypeScript linting operations,
 * integrating with the Enhanced Safe Agent System to ensure no systematic
 * errors are introduced during automated code fixes.
 */

import { EnhancedSafeAgentSystem, safeTypeScriptLintEnforcer } from './enhanced-safe-agent-system';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface LintEnforcerOptions {
  targetPattern?: string;
  maxFilesPerBatch?: number;
  skipTests?: boolean;
  skipNodeModules?: boolean;
  allowableErrorIncrease?: number;
  rollbackOnAnyIncrease?: boolean;
  dryRun?: boolean;
}

interface LintResult {
  filePath: string;
  originalErrors: number;
  newErrors: number;
  fixed: boolean;
  errors: string[];
}

interface BatchResult {
  success: boolean;
  totalFiles: number;
  processedFiles: number;
  successfulFiles: number;
  failedFiles: number;
  results: LintResult[];
  report: string;
  sessionInfo: any;
}

/**
 * Safe TypeScript Lint Enforcer - processes files in batches with safety guarantees
 */
export class SafeTypeScriptLintEnforcer {
  private options: Required<LintEnforcerOptions>;

  constructor(options: LintEnforcerOptions = {}) {
    this.options = {
      targetPattern: options.targetPattern ?? 'src/**/*.{ts,tsx}',
      maxFilesPerBatch: options.maxFilesPerBatch ?? 10,
      skipTests: options.skipTests ?? true,
      skipNodeModules: options.skipNodeModules ?? true,
      allowableErrorIncrease: options.allowableErrorIncrease ?? 0,
      rollbackOnAnyIncrease: options.rollbackOnAnyIncrease ?? true,
      dryRun: options.dryRun ?? false
    };
  }

  /**
   * Get list of files to process based on pattern and filters
   */
  async getTargetFiles(): Promise<string[]> {
    try {
      // Use find command to get files
      const { stdout } = await execAsync(
        `find src -name "*.ts" -o -name "*.tsx" | head -100`, // Limit to 100 files for safety
        { cwd: process.cwd() }
      );

      let files = stdout.trim().split('\n').filter(Boolean);

      // Apply filters
      if (this.options.skipTests) {
        files = files.filter(file => !file.includes('test') && !file.includes('spec') && !file.includes('__tests__'));
      }

      if (this.options.skipNodeModules) {
        files = files.filter(file => !file.includes('node_modules'));
      }

      // Convert to absolute paths
      return files.map(file => path.resolve(process.cwd(), file));
      
    } catch (error) {
      throw new Error(`Failed to get target files: ${error}`);
    }
  }

  /**
   * Run ESLint on a file and get error count
   */
  private async getFileErrorCount(filePath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `npx eslint "${filePath}" --format json`,
        { cwd: process.cwd() }
      );

      const results = JSON.parse(stdout);
      return results.reduce((total: number, result: any) => total + result.errorCount, 0);
      
    } catch (error) {
      // If ESLint fails, assume there are errors
      return 1;
    }
  }

  /**
   * Apply ESLint fixes to a file
   */
  private async applyESLintFixes(filePath: string): Promise<void> {
    await execAsync(
      `npx eslint "${filePath}" --fix`,
      { cwd: process.cwd() }
    );
  }

  /**
   * Process a single batch of files safely
   */
  async processBatch(files: string[]): Promise<BatchResult> {
    const batchDescription = `TypeScript Lint Enforcer - Batch of ${files.length} files`;
    
    console.log(`\n🔧 Processing batch: ${files.length} files`);
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${path.relative(process.cwd(), file)}`);
    });

    if (this.options.dryRun) {
      console.log('🧪 DRY RUN MODE - No changes will be made');
      return {
        success: true,
        totalFiles: files.length,
        processedFiles: files.length,
        successfulFiles: files.length,
        failedFiles: 0,
        results: files.map(file => ({
          filePath: file,
          originalErrors: 0,
          newErrors: 0,
          fixed: false,
          errors: []
        })),
        report: 'Dry run completed - no changes made',
        sessionInfo: {}
      };
    }

    // Create lint enforcer function
    const lintEnforcerFunction = async () => {
      const results: LintResult[] = [];
      
      for (const filePath of files) {
        try {
          console.log(`🔍 Processing: ${path.relative(process.cwd(), filePath)}`);
          
          const originalErrors = await this.getFileErrorCount(filePath);
          await this.applyESLintFixes(filePath);
          const newErrors = await this.getFileErrorCount(filePath);
          
          results.push({
            filePath,
            originalErrors,
            newErrors,
            fixed: newErrors < originalErrors,
            errors: []
          });
          
          console.log(`   Errors: ${originalErrors} → ${newErrors} ${newErrors < originalErrors ? '✅' : newErrors > originalErrors ? '❌' : '➖'}`);
          
        } catch (error) {
          results.push({
            filePath,
            originalErrors: 0,
            newErrors: 0,
            fixed: false,
            errors: [String(error)]
          });
          console.log(`   ❌ Failed: ${error}`);
        }
      }
      
      return results;
    };

    // Execute with safe system
    try {
      const result = await safeTypeScriptLintEnforcer(
        files,
        lintEnforcerFunction,
        {
          description: batchDescription,
          allowableErrorIncrease: this.options.allowableErrorIncrease,
          rollbackOnAnyIncrease: this.options.rollbackOnAnyIncrease,
          keepReportsOnSuccess: true
        }
      );

      const lintResults = result.result as LintResult[] || [];
      
      return {
        success: result.success,
        totalFiles: files.length,
        processedFiles: lintResults.length,
        successfulFiles: lintResults.filter(r => r.fixed).length,
        failedFiles: lintResults.filter(r => r.errors.length > 0).length,
        results: lintResults,
        report: result.report,
        sessionInfo: result.sessionInfo
      };

    } catch (error) {
      return {
        success: false,
        totalFiles: files.length,
        processedFiles: 0,
        successfulFiles: 0,
        failedFiles: files.length,
        results: [],
        report: `Batch processing failed: ${error}`,
        sessionInfo: {}
      };
    }
  }

  /**
   * Process all target files in safe batches
   */
  async processAllFiles(): Promise<{
    success: boolean;
    totalFiles: number;
    totalBatches: number;
    successfulBatches: number;
    failedBatches: number;
    overallReport: string;
    batchResults: BatchResult[];
  }> {
    
    console.log('🚀 Starting Safe TypeScript Lint Enforcer');
    console.log(`📋 Configuration:`);
    console.log(`   - Target pattern: ${this.options.targetPattern}`);
    console.log(`   - Max files per batch: ${this.options.maxFilesPerBatch}`);
    console.log(`   - Skip tests: ${this.options.skipTests}`);
    console.log(`   - Allowable error increase: ${this.options.allowableErrorIncrease}`);
    console.log(`   - Rollback on any increase: ${this.options.rollbackOnAnyIncrease}`);
    console.log(`   - Dry run: ${this.options.dryRun}`);

    // Get target files
    const allFiles = await this.getTargetFiles();
    console.log(`📁 Found ${allFiles.length} files to process`);

    if (allFiles.length === 0) {
      return {
        success: true,
        totalFiles: 0,
        totalBatches: 0,
        successfulBatches: 0,
        failedBatches: 0,
        overallReport: 'No files found to process',
        batchResults: []
      };
    }

    // Split into batches
    const batches: string[][] = [];
    for (let i = 0; i < allFiles.length; i += this.options.maxFilesPerBatch) {
      batches.push(allFiles.slice(i, i + this.options.maxFilesPerBatch));
    }

    console.log(`📦 Split into ${batches.length} batches`);

    // Process batches
    const batchResults: BatchResult[] = [];
    let successfulBatches = 0;
    let failedBatches = 0;

    for (let i = 0; i < batches.length; i++) {
      console.log(`\n📦 Processing batch ${i + 1}/${batches.length}`);
      
      const batchResult = await this.processBatch(batches[i]);
      batchResults.push(batchResult);

      if (batchResult.success) {
        successfulBatches++;
        console.log(`✅ Batch ${i + 1} completed successfully`);
      } else {
        failedBatches++;
        console.log(`❌ Batch ${i + 1} failed - changes rolled back`);
      }

      // Log batch summary
      console.log(`📊 Batch ${i + 1} Summary:`);
      console.log(`   - Processed: ${batchResult.processedFiles}/${batchResult.totalFiles} files`);
      console.log(`   - Successful: ${batchResult.successfulFiles} files`);
      console.log(`   - Failed: ${batchResult.failedFiles} files`);
    }

    // Generate overall report
    const totalProcessed = batchResults.reduce((sum, batch) => sum + batch.processedFiles, 0);
    const totalSuccessful = batchResults.reduce((sum, batch) => sum + batch.successfulFiles, 0);
    const totalFailed = batchResults.reduce((sum, batch) => sum + batch.failedFiles, 0);

    const overallReport = [
      '=' .repeat(80),
      '🛡️  SAFE TYPESCRIPT LINT ENFORCER - OVERALL REPORT',
      '=' .repeat(80),
      '',
      `📅 Timestamp: ${new Date().toISOString()}`,
      `📁 Total files found: ${allFiles.length}`,
      `📦 Total batches: ${batches.length}`,
      `✅ Successful batches: ${successfulBatches}`,
      `❌ Failed batches: ${failedBatches}`,
      '',
      '📊 FILE PROCESSING SUMMARY:',
      `   Total processed: ${totalProcessed}`,
      `   Successfully fixed: ${totalSuccessful}`,
      `   Failed/rolled back: ${totalFailed}`,
      `   Success rate: ${totalProcessed > 0 ? ((totalSuccessful / totalProcessed) * 100).toFixed(1) : 0}%`,
      '',
      '📋 BATCH DETAILS:',
      ...batchResults.map((batch, index) => [
        `   Batch ${index + 1}: ${batch.success ? '✅' : '❌'} (${batch.successfulFiles}/${batch.totalFiles} files)`
      ]).flat(),
      '',
      '🎯 RECOMMENDATIONS:',
      failedBatches > 0 ? '   - Review failed batches and their error reports' : '   - All batches completed successfully!',
      totalFailed > 0 ? '   - Investigate files that failed processing' : '   - Consider expanding to more file types',
      '   - Review backup logs for detailed change information',
      '',
      '=' .repeat(80)
    ].join('\n');

    console.log('\n' + overallReport);

    return {
      success: failedBatches === 0,
      totalFiles: allFiles.length,
      totalBatches: batches.length,
      successfulBatches,
      failedBatches,
      overallReport,
      batchResults
    };
  }
}

/**
 * Convenience function for quick safe linting
 */
export async function quickSafeLint(
  files: string[],
  options: {
    allowableErrorIncrease?: number;
    rollbackOnAnyIncrease?: boolean;
    description?: string;
  } = {}
): Promise<BatchResult> {
  
  const lintEnforcer = new SafeTypeScriptLintEnforcer({
    maxFilesPerBatch: files.length, // Process all files as one batch
    allowableErrorIncrease: options.allowableErrorIncrease,
    rollbackOnAnyIncrease: options.rollbackOnAnyIncrease
  });

  return await lintEnforcer.processBatch(files);
}

/**
 * Safe fix for common TypeScript patterns
 */
export class SafePatternFixer {
  
  /**
   * Fix common JSX fragment issues safely
   */
  static async fixJSXFragments(files: string[]): Promise<BatchResult> {
    return await quickSafeLint(files, {
      description: 'JSX Fragment Pattern Fix',
      allowableErrorIncrease: 0,
      rollbackOnAnyIncrease: true
    });
  }

  /**
   * Fix common TypeScript casting issues safely
   */
  static async fixTypeScriptCasting(files: string[]): Promise<BatchResult> {
    return await quickSafeLint(files, {
      description: 'TypeScript Casting Pattern Fix',
      allowableErrorIncrease: 0,
      rollbackOnAnyIncrease: true
    });
  }

  /**
   * Fix import/export issues safely
   */
  static async fixImportExports(files: string[]): Promise<BatchResult> {
    return await quickSafeLint(files, {
      description: 'Import/Export Pattern Fix',
      allowableErrorIncrease: 0,
      rollbackOnAnyIncrease: true
    });
  }
}

export default SafeTypeScriptLintEnforcer;