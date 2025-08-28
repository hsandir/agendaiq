/**
 * Safe Agent System Usage Examples
 * 
 * This file demonstrates various ways to use the Enhanced Safe Agent System
 * and Safe TypeScript Lint Enforcer for different scenarios.
 */

import { 
  EnhancedSafeAgentSystem, 
  safeTypeScriptLintEnforcer 
} from './enhanced-safe-agent-system';
import { 
  SafeTypeScriptLintEnforcer, 
  SafePatternFixer, 
  quickSafeLint 
} from './safe-lint-enforcer-wrapper';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Example 1: Basic Safe File Operation
 * 
 * Use the Enhanced Safe Agent System to safely modify a single file
 * with automatic backup and rollback protection.
 */
export async function basicSafeFileOperation() {
  const safeSystem = new EnhancedSafeAgentSystem('Basic File Modification');
  
  try {
    await safeSystem.initialize();
    
    const filePath = './src/components/example.tsx';
    
    const result = await safeSystem.executeTypeScriptLintEnforcer(
      [filePath],
      async () => {
        // Your agent logic here - for example, fixing ESLint issues
        await execAsync(`npx eslint "${filePath}" --fix`);
        console.log('✅ Applied ESLint fixes');
      },
      {
        allowableErrorIncrease: 0,
        rollbackOnAnyIncrease: true,
        description: 'Fix ESLint issues in example component'
      }
    );
    
    console.log(`Operation ${result.success ? 'succeeded' : 'failed'}`);
    console.log(result.report);
    
    // Cleanup (keep reports on success)
    await safeSystem.cleanup(true);
    
    return result;
    
  } catch (error) {
    console.error('Safe file operation failed:', error);
    await safeSystem.cleanup(true); // Always keep reports on error
    throw error;
  }
}

/**
 * Example 2: Batch Processing with Safe Lint Enforcer
 * 
 * Process multiple files safely with automatic batching and rollback
 * protection per batch.
 */
export async function batchProcessingExample() {
  const lintEnforcer = new SafeTypeScriptLintEnforcer({
    targetPattern: 'src/components/**/*.tsx',
    maxFilesPerBatch: 5,
    skipTests: true,
    allowableErrorIncrease: 0,
    rollbackOnAnyIncrease: true,
    dryRun: false // Set to true for preview
  });

  console.log('🚀 Starting batch processing example...');
  
  const result = await lintEnforcer.processAllFiles();
  
  console.log('📊 Batch Processing Results:');
  console.log(`   Total files: ${result.totalFiles}`);
  console.log(`   Total batches: ${result.totalBatches}`);
  console.log(`   Successful batches: ${result.successfulBatches}`);
  console.log(`   Failed batches: ${result.failedBatches}`);
  console.log(`   Overall success: ${result.success ? '✅' : '❌'}`);
  
  // Save detailed report
  const reportPath = `./reports/batch-processing-${Date.now()}.txt`;
  await fs.writeFile(reportPath, result.overallReport, 'utf-8');
  console.log(`📄 Detailed report saved: ${reportPath}`);
  
  return result;
}

/**
 * Example 3: Pattern-Specific Fixes
 * 
 * Apply specific pattern fixes (JSX, TypeScript casting, imports) 
 * with targeted safety measures.
 */
export async function patternSpecificFixes() {
  const targetFiles = [
    './src/components/broken-jsx.tsx',
    './src/components/casting-issues.ts',
    './src/lib/import-issues.ts'
  ];

  console.log('🎯 Running pattern-specific fixes...');

  // Fix JSX Fragment issues
  console.log('\n1. 🔧 Fixing JSX Fragment issues...');
  const jsxResult = await SafePatternFixer.fixJSXFragments(
    targetFiles.filter(f => f.endsWith('.tsx'))
  );
  console.log(`JSX fixes: ${jsxResult.success ? '✅ Success' : '❌ Failed'}`);

  // Fix TypeScript casting issues
  console.log('\n2. 🔧 Fixing TypeScript casting issues...');
  const castingResult = await SafePatternFixer.fixTypeScriptCasting(targetFiles);
  console.log(`Casting fixes: ${castingResult.success ? '✅ Success' : '❌ Failed'}`);

  // Fix import/export issues
  console.log('\n3. 🔧 Fixing import/export issues...');
  const importResult = await SafePatternFixer.fixImportExports(targetFiles);
  console.log(`Import fixes: ${importResult.success ? '✅ Success' : '❌ Failed'}`);

  return {
    jsx: jsxResult,
    casting: castingResult,
    imports: importResult
  };
}

/**
 * Example 4: Custom Agent Integration
 * 
 * Integrate your own custom agent with the safe system for
 * comprehensive protection.
 */
export async function customAgentIntegration() {
  const customAgentFunction = async () => {
    console.log('🤖 Running custom agent logic...');
    
    // Example: Custom TypeScript refactoring agent
    const filesToModify = [
      './src/lib/example.ts',
      './src/components/example.tsx'
    ];

    for (const filePath of filesToModify) {
      try {
        // Read file
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Apply custom transformations
        let modifiedContent = content
          .replace(/interface\s+(\w+)\s*\{/g, 'interface $1 {') // Normalize interface spacing
          .replace(/,\s*}/g, '\n}') // Remove trailing commas in objects
          .replace(/;\s*}/g, '\n}'); // Clean up semicolons before closing braces
        
        // Write back
        await fs.writeFile(filePath, modifiedContent, 'utf-8');
        console.log(`   ✅ Modified: ${filePath}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`   ❌ Failed to modify: ${filePath} - ${errorMessage}`);
        throw error;
      }
    }
    
    return { modifiedFiles: filesToModify.length };
  };

  // Execute with safe system
  const result = await safeTypeScriptLintEnforcer(
    ['./src/lib/example.ts', './src/components/example.tsx'],
    customAgentFunction,
    {
      description: 'Custom TypeScript Refactoring Agent',
      allowableErrorIncrease: 0,
      rollbackOnAnyIncrease: true,
      keepReportsOnSuccess: true
    }
  );

  console.log('🎨 Custom Agent Results:');
  console.log(`   Success: ${result.success ? '✅' : '❌'}`);
  console.log(`   Modified files: ${result.result?.modifiedFiles || 0}`);
  
  return result;
}

/**
 * Example 5: Quick Safe Lint for Single Files
 * 
 * Quick utility for safely linting a small number of specific files.
 */
export async function quickSafeLintExample() {
  const filesToLint = [
    './src/components/problem-component.tsx',
    './src/lib/utility-functions.ts'
  ];

  console.log('⚡ Quick safe lint example...');
  
  const result = await quickSafeLint(filesToLint, {
    allowableErrorIncrease: 0,
    rollbackOnAnyIncrease: true,
    description: 'Quick lint fix for specific files'
  });

  console.log('📊 Quick Lint Results:');
  console.log(`   Success: ${result.success ? '✅' : '❌'}`);
  console.log(`   Files processed: ${result.processedFiles}/${result.totalFiles}`);
  console.log(`   Files improved: ${result.successfulFiles}`);
  
  // Show per-file results
  result.results.forEach((fileResult, index) => {
    const fileName = fileResult.filePath.split('/').pop();
    const status = fileResult.fixed ? '✅ Fixed' : fileResult.errors.length > 0 ? '❌ Failed' : '➖ No changes';
    console.log(`   ${index + 1}. ${fileName}: ${status}`);
  });

  return result;
}

/**
 * Example 6: Dry Run Mode
 * 
 * Preview what changes would be made without actually applying them.
 */
export async function dryRunExample() {
  console.log('🧪 Dry run example - preview changes without applying...');
  
  const lintEnforcer = new SafeTypeScriptLintEnforcer({
    targetPattern: 'src/**/*.{ts,tsx}',
    maxFilesPerBatch: 10,
    skipTests: true,
    dryRun: true // Enable dry run mode
  });

  const result = await lintEnforcer.processAllFiles();
  
  console.log('🧪 Dry Run Results:');
  console.log(`   Files that would be processed: ${result.totalFiles}`);
  console.log(`   Batches that would be created: ${result.totalBatches}`);
  console.log('   No actual changes were made');
  
  return result;
}

/**
 * Example 7: Error Recovery and Reporting
 * 
 * Demonstrate how the system handles errors and provides detailed reporting.
 */
export async function errorRecoveryExample() {
  console.log('🚨 Error recovery example...');
  
  const problematicAgentFunction = async () => {
    // Simulate an agent that introduces errors
    const filePath = './src/components/test-error-recovery.tsx';
    
    // Create a file with intentional syntax errors
    const badContent = `
import React from 'react';

export function BrokenComponent() {
  return (
    <div>
      <span>This will have syntax issues</span
      // Missing closing tag and other issues
    </div>
  `;
    
    await fs.writeFile(filePath, badContent, 'utf-8');
    console.log('   ⚠️  Introduced syntax errors intentionally');
    
    return { message: 'This should fail validation and rollback' };
  };

  try {
    const result = await safeTypeScriptLintEnforcer(
      ['./src/components/test-error-recovery.tsx'],
      problematicAgentFunction,
      {
        description: 'Error Recovery Test Agent',
        allowableErrorIncrease: 0,
        rollbackOnAnyIncrease: true
      }
    );

    console.log('🔄 Error Recovery Results:');
    console.log(`   Expected failure: ${!result.success ? '✅ Correctly failed' : '❌ Should have failed'}`);
    console.log('   Files were automatically restored from backup');
    
    return result;
    
  } catch (error) {
    console.log('✅ Error properly caught and handled');
    console.log('✅ Automatic rollback completed');
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Example 8: Production-Safe Batch Processing
 * 
 * Configuration for production environments with extra safety measures.
 */
export async function productionSafeBatchProcessing() {
  console.log('🏭 Production-safe batch processing...');
  
  const lintEnforcer = new SafeTypeScriptLintEnforcer({
    targetPattern: 'src/**/*.{ts,tsx}',
    maxFilesPerBatch: 3, // Smaller batches for production
    skipTests: true,
    skipNodeModules: true,
    allowableErrorIncrease: 0, // Zero tolerance for new errors
    rollbackOnAnyIncrease: true, // Immediate rollback
    dryRun: false
  });

  // Get preview first
  const previewEnforcer = new SafeTypeScriptLintEnforcer({
    ...lintEnforcer,
    dryRun: true
  });
  
  console.log('1. 🧪 Running dry run preview...');
  const preview = await previewEnforcer.processAllFiles();
  console.log(`   Would process ${preview.totalFiles} files in ${preview.totalBatches} batches`);
  
  // Confirm processing
  console.log('2. 🚀 Processing with maximum safety...');
  const result = await lintEnforcer.processAllFiles();
  
  console.log('🏭 Production Results:');
  console.log(`   Success rate: ${result.successfulBatches}/${result.totalBatches} batches`);
  console.log(`   Zero-error guarantee: ${result.success ? '✅ Maintained' : '❌ Violated'}`);
  
  return result;
}

// Export all examples for easy testing
export const examples = {
  basicSafeFileOperation,
  batchProcessingExample,
  patternSpecificFixes,
  customAgentIntegration,
  quickSafeLintExample,
  dryRunExample,
  errorRecoveryExample,
  productionSafeBatchProcessing
};

/**
 * Run all examples (for testing purposes)
 */
export async function runAllExamples() {
  console.log('🧪 Running all Safe Agent System examples...\n');
  
  const results = {};
  const exampleNames = Object.keys(examples);
  
  for (let i = 0; i < exampleNames.length; i++) {
    const exampleName = exampleNames[i];
    const exampleFunction = examples[exampleName as keyof typeof examples];
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Example ${i + 1}/${exampleNames.length}: ${exampleName}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const result = await exampleFunction();
      (results as Record<string, any>)[exampleName] = {
        success: true,
        result
      };
      console.log(`✅ Example ${exampleName} completed successfully`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      (results as Record<string, any>)[exampleName] = {
        success: false,
        error: errorMessage
      };
      console.log(`❌ Example ${exampleName} failed: ${errorMessage}`);
    }
    
    // Brief pause between examples
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 EXAMPLES SUMMARY');
  console.log(`${'='.repeat(60)}`);
  
  const successful = Object.values(results).filter((r: any) => r.success).length;
  const total = Object.values(results).length;
  
  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);
  
  Object.entries(results).forEach(([name, result]) => {
    const resultObj = result as { success: boolean };
    console.log(`   ${resultObj.success ? '✅' : '❌'} ${name}`);
  });
  
  return results;
}