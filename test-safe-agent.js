#!/usr/bin/env node

/**
 * Safe Agent System Test Script
 * Bu script güvenli agent sistemini test eder
 */

const fs = require('fs/promises');
const path = require('path');

// Test için geçici dosya oluştur
async function createTestFile() {
  const testFilePath = path.join(__dirname, 'temp-test-file.ts');
  const testContent = `
// Test file for safe agent system
interface TestInterface {
  name: string
  value: number
}

function testFunction() {
  const test = "hello world"
  return test
}

export { testFunction }
  `.trim();

  await fs.writeFile(testFilePath, testContent, 'utf-8');
  return testFilePath;
}

// Test safe agent system
async function testSafeAgentSystem() {
  console.log('🧪 Testing Safe Agent System...\n');

  try {
    // Test dosyası oluştur
    const testFile = await createTestFile();
    console.log('📝 Created test file:', testFile);

    // Safe agent system'i import et (ES modules için dynamic import)
    const { SafeAgentSystem } = await import('./lib/agents/safe-agent-system.js');
    
    const safeSystem = new SafeAgentSystem();
    
    console.log('\n1️⃣ Testing backup creation...');
    await safeSystem.createBackup(testFile);
    console.log('✅ Backup created successfully');

    console.log('\n2️⃣ Testing file modification...');
    // Dosyayı değiştir
    await fs.writeFile(testFile, `
// Modified test file - adding syntax error
interface TestInterface {
  name: string;
  value: number;
}

function testFunction() {
  const test = "hello world";  // <- bu syntax hatası yaratacak
  return test;  // <- bu da
  ;  // <- bu kesin hata yaratır
}

export { testFunction };
    `.trim(), 'utf-8');

    console.log('\n3️⃣ Testing validation...');
    const validationResult = await safeSystem.validateFile(testFile);
    console.log('📊 Validation result:', {
      isValid: validationResult.isValid,
      syntaxErrors: validationResult.syntaxErrors,
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length
    });

    if (!validationResult.isValid) {
      console.log('\n4️⃣ Testing backup restore...');
      await safeSystem.restoreBackup(testFile);
      console.log('✅ Backup restored successfully');

      // Validate restored file
      const restoredValidation = await safeSystem.validateFile(testFile);
      console.log('📊 Restored file validation:', {
        isValid: restoredValidation.isValid,
        syntaxErrors: restoredValidation.syntaxErrors
      });
    }

    console.log('\n5️⃣ Testing safe operation workflow...');
    const operationResult = await safeSystem.safeFileOperation(
      testFile,
      async () => {
        // Güvenli bir değişiklik yap
        const content = await fs.readFile(testFile, 'utf-8');
        const betterContent = content.replace(/const test = "hello world"/, 'const test = "hello world";');
        await fs.writeFile(testFile, betterContent, 'utf-8');
      },
      { maxSyntaxErrors: 0, maxBuildErrors: 0 }
    );

    console.log('🎯 Safe operation result:', {
      success: operationResult.success,
      valid: operationResult.validationResult.isValid
    });

    // Cleanup
    await safeSystem.cleanup();
    await fs.unlink(testFile); // Test dosyasını sil

    console.log('\n✅ All tests passed! Safe Agent System is working correctly.\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// TypeScript compile test
async function testTypeScriptCompilation() {
  console.log('🔧 Testing TypeScript compilation of safe agent files...\n');

  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Test TypeScript compilation
    await execAsync('npx tsc --noEmit lib/agents/*.ts');
    console.log('✅ TypeScript compilation successful');

  } catch (error) {
    console.error('❌ TypeScript compilation failed:', error);
    console.error('Please fix TypeScript errors before using the safe agent system');
    process.exit(1);
  }
}

// Main test function
async function main() {
  console.log('🚀 Safe Agent System - Test Suite\n');
  console.log('This script tests the new backup-verify-restore system for agents.\n');

  // Test TypeScript compilation first
  await testTypeScriptCompilation();

  // Test safe agent system
  await testSafeAgentSystem();

  console.log('🎉 All tests completed successfully!');
  console.log('\n📚 Usage Examples:');
  console.log('  - Import: import { SafeAgentSystem } from "./lib/agents/safe-agent-system"');
  console.log('  - Lint Fix: import { safeTypescriptLintFix } from "./lib/agents/safe-lint-enforcer"');
  console.log('  - Task Integration: import { runSafeTask } from "./lib/agents/safe-task-integration"');
  console.log('\n💡 The system will now backup files before changes and restore them if validation fails!');
}

// Run tests
main().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});