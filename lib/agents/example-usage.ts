/**
 * Safe Agent System - Kullanım Örnekleri
 * Bu dosya güvenli agent sisteminin nasıl kullanılacağını gösterir
 */

import { SafeAgentSystem, safeAgentWrapper } from './safe-agent-system';
import { SafeLintEnforcer, safeTypescriptLintFix, batchSafeLintFix } from './safe-lint-enforcer';
import fs from 'fs/promises';

/**
 * Örnek 1: Tek dosya üzerinde güvenli işlem
 */
async function exampleSingleFileOperation() {
  const safeSystem = new SafeAgentSystem();
  const filePath = './src/example.ts';

  const result = await safeSystem.safeFileOperation(
    filePath,
    async () => {
      // Burada dosya üzerinde değişiklik yapılır
      const content = await fs.readFile(filePath, 'utf-8');
      const modifiedContent = content.replace(/var /g, 'const ');
      await fs.writeFile(filePath, modifiedContent, 'utf-8');
    },
    {
      maxSyntaxErrors: 0,  // Hiç syntax hatası kabul etme
      maxBuildErrors: 0    // Hiç build hatası kabul etme
    }
  );

  if (result.success) {
    console.log('✅ Operation successful!');
  } else {
    console.log('❌ Operation failed, file restored:', result.validationResult.errors);
  }

  await safeSystem.cleanup();
}

/**
 * Örnek 2: Lint enforcer ile güvenli düzeltme
 */
async function exampleLintEnforcement() {
  const filesToFix = [
    './src/app/api/auth/signup/route.ts',
    './src/app/api/dev/ci-cd/runs/route.ts'
  ];

  const result = await batchSafeLintFix(filesToFix);

  if (result.success && result.result) {
    console.log(`✅ Successfully fixed ${result.result.fixedFiles.length} files`);
    console.log(`❌ Failed to fix ${result.result.failedFiles.length} files`);
  } else {
    console.log('❌ Batch fix failed:', result.failures);
  }
}

/**
 * Örnek 3: Custom agent wrapper
 */
async function exampleCustomAgent() {
  const filePaths = ['./src/example1.ts', './src/example2.ts'];

  const result = await safeAgentWrapper(
    async () => {
      // Custom agent logic buraya
      for (const filePath of filePaths) {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Örnek: console.log'ları kaldır
        const cleanContent = content.replace(/console\.log\([^)]*\);?\n?/g, '');
        
        await fs.writeFile(filePath, cleanContent, 'utf-8');
      }
      
      return { processedFiles: filePaths.length };
    },
    filePaths,
    {
      maxSyntaxErrors: 0,
      maxBuildErrors: 1, // Bir tane build hatası tolere et
      description: 'Remove console.log statements'
    }
  );

  console.log('Custom agent result:', result);
}

/**
 * Örnek 4: Hata durumu simülasyonu
 */
async function exampleErrorHandling() {
  const safeSystem = new SafeAgentSystem();
  const filePath = './src/test-error.ts';

  try {
    const result = await safeSystem.safeFileOperation(
      filePath,
      async () => {
        // Kasıtlı olarak bozuk kod yaz
        const brokenCode = `
          function test() {
            return "test";  // syntax hatası yaratacak değişiklik
          ;  // <- bu hata yaratır
        `;
        await fs.writeFile(filePath, brokenCode, 'utf-8');
      }
    );

    if (!result.success) {
      console.log('✅ Error handling worked! File was restored automatically.');
      console.log('Validation errors:', result.validationResult.errors);
    }
  } catch (error) {
    console.log('✅ Exception handling worked! File was restored.');
  } finally {
    await safeSystem.cleanup();
  }
}

/**
 * Örnek 5: Threshold ayarları ile esnek kontrol
 */
async function exampleThresholdControl() {
  const safeSystem = new SafeAgentSystem();
  const filePath = './src/flexible-example.ts';

  // Esnek threshold - birkaç warning'e izin ver
  const result = await safeSystem.safeFileOperation(
    filePath,
    async () => {
      // Bazı style sorunları olan ama çalışan kod
      const codeWithWarnings = `
        function example() {
          let unused_variable = "test";  // ESLint warning
          return "working code";
        }
      `;
      await fs.writeFile(filePath, codeWithWarnings, 'utf-8');
    },
    {
      maxSyntaxErrors: 0,     // Syntax hatası yok
      maxBuildErrors: 0       // Build hatası yok
    }
  );

  console.log('Flexible operation result:', result.success);
  await safeSystem.cleanup();
}

/**
 * Ana test function
 */
export async function runSafeAgentExamples() {
  console.log('🚀 Running Safe Agent System Examples...\n');

  try {
    console.log('1️⃣ Single File Operation Example:');
    await exampleSingleFileOperation();

    console.log('\n2️⃣ Lint Enforcement Example:');
    await exampleLintEnforcement();

    console.log('\n3️⃣ Custom Agent Example:');
    await exampleCustomAgent();

    console.log('\n4️⃣ Error Handling Example:');
    await exampleErrorHandling();

    console.log('\n5️⃣ Threshold Control Example:');
    await exampleThresholdControl();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// CLI usage
if (require.main === module) {
  runSafeAgentExamples();
}