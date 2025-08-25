/**
 * Safe Task Integration
 * Mevcut Task tool'unu güvenli agent sistemi ile entegre eder
 */

import { SafeAgentSystem, safeAgentWrapper } from './safe-agent-system';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface SafeTaskOptions {
  maxSyntaxErrors?: number;
  maxBuildErrors?: number;
  backupEnabled?: boolean;
  validationEnabled?: boolean;
  dryRun?: boolean;
}

interface SafeTaskResult {
  success: boolean;
  filesProcessed: string[];
  filesRestored: string[];
  validationResults: Array<{
    file: string;
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>;
  agentOutput?: string;
  error?: string;
}

export class SafeTaskIntegration {
  private safeSystem: SafeAgentSystem;

  constructor() {
    this.safeSystem = new SafeAgentSystem();
  }

  /**
   * Güvenli Task çalıştırma - TypeScript Lint Enforcer için
   */
  async runSafeTypescriptLintEnforcer(
    prompt: string,
    options: SafeTaskOptions = {}
  ): Promise<SafeTaskResult> {
    
    const opts = {
      maxSyntaxErrors: 0,
      maxBuildErrors: 0,
      backupEnabled: true,
      validationEnabled: true,
      dryRun: false,
      ...options
    };

    console.log(`🔒 Starting Safe TypeScript Lint Enforcer`);
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`⚙️  Options:`, opts);

    const result: SafeTaskResult = {
      success: false,
      filesProcessed: [],
      filesRestored: [],
      validationResults: []
    };

    try {
      // 1. Etkilenebilecek dosyaları belirle
      const affectedFiles = await this.identifyAffectedFiles(prompt);
      console.log(`📁 Identified ${affectedFiles.length} potentially affected files`);

      if (affectedFiles.length === 0) {
        result.success = true;
        return result;
      }

      // 2. Dry run kontrolü
      if (opts.dryRun) {
        console.log('🏃 Dry run mode - no actual changes will be made');
        result.filesProcessed = affectedFiles;
        result.success = true;
        return result;
      }

      // 3. Güvenli agent wrapper ile Task çalıştır
      const wrapperResult = await safeAgentWrapper(
        async () => {
          // Burada gerçek Task agent'ı çalışır
          return await this.executeTypescriptLintEnforcer(prompt, affectedFiles);
        },
        affectedFiles,
        {
          maxSyntaxErrors: opts.maxSyntaxErrors,
          maxBuildErrors: opts.maxBuildErrors,
          description: `TypeScript Lint Enforcer: ${prompt.substring(0, 50)}...`
        }
      );

      // 4. Sonuçları işle
      result.success = wrapperResult.success;
      result.agentOutput = wrapperResult.result;
      
      if (wrapperResult.failures.length > 0) {
        result.filesRestored = wrapperResult.failures;
        console.log(`🔄 Restored ${result.filesRestored.length} files due to validation failures`);
      } else {
        result.filesProcessed = affectedFiles;
        console.log(`✅ Successfully processed ${result.filesProcessed.length} files`);
      }

      // 5. Validation sonuçlarını topla
      for (const filePath of affectedFiles) {
        const validation = await this.safeSystem.validateFile(filePath);
        result.validationResults.push({
          file: filePath,
          valid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings
        });
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`💥 Safe Task execution failed:`, error);
    }

    return result;
  }

  /**
   * Prompt'tan etkilenebilecek dosyaları belirle
   */
  private async identifyAffectedFiles(prompt: string): Promise<string[]> {
    const files: string[] = [];

    try {
      // Prompt'ta bahsedilen dosya tiplerini analiz et
      const patterns: string[] = [];

      if (prompt.includes('TypeScript') || prompt.includes('.ts') || prompt.includes('tsx')) {
        patterns.push('**/*.ts', '**/*.tsx');
      }
      if (prompt.includes('API') || prompt.includes('route')) {
        patterns.push('**/api/**/*.ts');
      }
      if (prompt.includes('component')) {
        patterns.push('**/components/**/*.tsx', '**/components/**/*.ts');
      }
      if (prompt.includes('build') || prompt.includes('compile')) {
        patterns.push('**/*.ts', '**/*.tsx');
      }

      // Eğer spesifik pattern bulunamazsa, genel TypeScript dosyalarını al
      if (patterns.length === 0) {
        patterns.push('**/*.ts', '**/*.tsx');
      }

      // Git ile değişmiş dosyaları al (öncelik)
      try {
        const { stdout } = await execAsync('git diff --name-only HEAD~1..HEAD');
        const changedFiles = stdout.split('\n')
          .filter(f => f.trim() && (f.endsWith('.ts') || f.endsWith('.tsx')));
        files.push(...changedFiles);
      } catch {
        // Git bilgisi alınamazsa devam et
      }

      // Glob pattern'lar ile dosya bul (limitli)
      for (const pattern of patterns) {
        try {
          const { stdout } = await execAsync(`find src -name "*.ts" -o -name "*.tsx" | head -20`);
          const foundFiles = stdout.split('\n').filter(f => f.trim());
          files.push(...foundFiles);
        } catch {
          // Find komutu başarısızsa devam et
        }
      }

      // Duplicate'ları kaldır ve mutlak path'e çevir
      const uniqueFiles = [...new Set(files)]
        .map(f => path.resolve(f))
        .filter(async f => {
          try {
            await fs.access(f);
            return true;
          } catch {
            return false;
          }
        });

      return uniqueFiles.slice(0, 10); // Max 10 dosya ile sınırla

    } catch (error) {
      console.warn(`⚠️  Could not identify affected files:`, error);
      return [];
    }
  }

  /**
   * Gerçek TypeScript Lint Enforcer çalıştırma simülasyonu
   */
  private async executeTypescriptLintEnforcer(prompt: string, files: string[]): Promise<string> {
    console.log(`🤖 Executing TypeScript Lint Enforcer on ${files.length} files`);

    // Basit lint düzeltmeleri yap
    let fixCount = 0;
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        let fixed = content;

        // Güvenli düzeltmeler
        const fixes = [
          // Missing semicolons
          { pattern: /(\n\s*return [^;]+)(\n)/g, replacement: '$1;$2' },
          // Double semicolons
          { pattern: /;;+/g, replacement: ';' },
          // Trailing spaces
          { pattern: /\s+$/gm, replacement: '' }
        ];

        for (const fix of fixes) {
          const beforeLength = fixed.length;
          fixed = fixed.replace(fix.pattern, fix.replacement);
          if (fixed.length !== beforeLength) fixCount++;
        }

        if (fixed !== content) {
          await fs.writeFile(filePath, fixed, 'utf-8');
          console.log(`🔧 Applied fixes to: ${path.relative(process.cwd(), filePath)}`);
        }

      } catch (error) {
        console.warn(`⚠️  Could not process ${filePath}:`, error);
      }
    }

    return `Applied ${fixCount} lint fixes across ${files.length} files`;
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    await this.safeSystem.cleanup();
  }
}

/**
 * Safe Task wrapper function - kolay kullanım için
 */
export async function runSafeTask(
  agentType: string,
  prompt: string,
  options: SafeTaskOptions = {}
): Promise<SafeTaskResult> {
  
  const integration = new SafeTaskIntegration();
  
  try {
    switch (agentType) {
      case 'typescript-lint-enforcer':
        return await integration.runSafeTypescriptLintEnforcer(prompt, options);
      
      default:
        throw new Error(`Unsupported agent type: ${agentType}`);
    }
  } finally {
    await integration.cleanup();
  }
}

/**
 * CLI wrapper - terminal'den kullanım için
 */
export async function safeLintCLI(args: string[]): Promise<void> {
  const [agentType, ...promptParts] = args;
  const prompt = promptParts.join(' ');

  if (!agentType || !prompt) {
    console.log(`
Usage: node safe-task-integration.js <agent-type> <prompt>

Agent Types:
  typescript-lint-enforcer  - Fix TypeScript and ESLint issues safely

Examples:
  node safe-task-integration.js typescript-lint-enforcer "Fix all syntax errors"
  node safe-task-integration.js typescript-lint-enforcer "Remove unused variables"
    `);
    return;
  }

  const result = await runSafeTask(agentType, prompt, {
    maxSyntaxErrors: 0,
    maxBuildErrors: 0,
    validationEnabled: true
  });

  console.log('\n🏁 Safe Task Results:');
  console.log(`✅ Success: ${result.success}`);
  console.log(`📁 Files Processed: ${result.filesProcessed.length}`);
  console.log(`🔄 Files Restored: ${result.filesRestored.length}`);
  
  if (result.error) {
    console.log(`❌ Error: ${result.error}`);
  }

  if (result.validationResults.length > 0) {
    console.log(`\n📊 Validation Results:`);
    result.validationResults.forEach(r => {
      const status = r.valid ? '✅' : '❌';
      console.log(`${status} ${r.file}: ${r.errors.length} errors, ${r.warnings.length} warnings`);
    });
  }
}

// CLI entrypoint
if (require.main === module) {
  safeLintCLI(process.argv.slice(2));
}

export default SafeTaskIntegration;