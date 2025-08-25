/**
 * Safe Agent System - Backup-Verify-Restore Pattern
 * Bu sistem agent'ların dosyalarda çalışmadan önce yedek almasını,
 * değişiklik sonrası doğrulama yapmasını, ve hatalıysa eski haline döndürmesini sağlar
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
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  syntaxErrors: number;
  buildErrors: number;
}

export class SafeAgentSystem {
  private backups = new Map<string, BackupEntry>();
  private backupDir: string;
  private sessionId: string;

  constructor() {
    this.sessionId = Date.now().toString();
    this.backupDir = path.join(process.cwd(), '.agent-backups', this.sessionId);
  }

  /**
   * Dosya üzerinde çalışmaya başlamadan önce güvenli yedek oluştur
   */
  async createBackup(filePath: string): Promise<void> {
    try {
      // Backup dizinini oluştur
      await fs.mkdir(this.backupDir, { recursive: true });

      // Orijinal dosyayı oku
      const originalContent = await fs.readFile(filePath, 'utf-8');
      
      // Yedek dosya yolu oluştur
      const fileName = path.basename(filePath);
      const relativePath = path.relative(process.cwd(), filePath).replace(/\//g, '_');
      const backupPath = path.join(this.backupDir, `${relativePath}.backup`);

      // Yedek dosyayı kaydet
      await fs.writeFile(backupPath, originalContent, 'utf-8');

      // Backup kaydını tut
      this.backups.set(filePath, {
        filePath,
        backupPath,
        originalContent,
        timestamp: Date.now()
      });

      console.log(`✅ Backup created for: ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to create backup for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Dosya değişikliği sonrası validation yap
   */
  async validateFile(filePath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      syntaxErrors: 0,
      buildErrors: 0
    };

    try {
      // 1. Dosya mevcudiyeti kontrolü
      await fs.access(filePath);

      // 2. TypeScript syntax kontrolü
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        try {
          const { stderr } = await execAsync(`npx tsc --noEmit ${filePath}`);
          if (stderr) {
            const syntaxErrors = (stderr.match(/error TS/g) || []).length;
            result.syntaxErrors = syntaxErrors;
            if (syntaxErrors > 0) {
              result.isValid = false;
              result.errors.push(`TypeScript errors: ${syntaxErrors}`);
            }
          }
        } catch (error) {
          result.syntaxErrors++;
          result.isValid = false;
          result.errors.push(`TypeScript compilation failed: ${error}`);
        }
      }

      // 3. ESLint kontrolü
      try {
        const { stdout, stderr } = await execAsync(`npx eslint ${filePath} --format json`);
        if (stdout) {
          const eslintResults = JSON.parse(stdout);
          const errorCount = eslintResults.reduce((acc: number, file: any) => acc + file.errorCount, 0);
          const warningCount = eslintResults.reduce((acc: number, file: any) => acc + file.warningCount, 0);
          
          if (errorCount > 0) {
            result.isValid = false;
            result.errors.push(`ESLint errors: ${errorCount}`);
          }
          if (warningCount > 0) {
            result.warnings.push(`ESLint warnings: ${warningCount}`);
          }
        }
      } catch (error) {
        result.warnings.push(`ESLint check failed: ${error}`);
      }

      // 4. Temel build testi (sadece değiştirilen dosya için)
      if (filePath.includes('/api/')) {
        // API dosyaları için basit import testi
        try {
          await execAsync(`node -c "${filePath}"`);
        } catch (error) {
          result.buildErrors++;
          result.isValid = false;
          result.errors.push(`Node.js syntax check failed: ${error}`);
        }
      }

      // 5. Kritik dosya içerik kontrolü
      const content = await fs.readFile(filePath, 'utf-8');
      
      // JSX Fragment syntax kontrolü
      if (content.includes('<>') && !content.includes('React.Fragment')) {
        const fragmentMatches = content.match(/<>/g);
        const closingFragmentMatches = content.match(/<\/>/g);
        if (fragmentMatches?.length !== closingFragmentMatches?.length) {
          result.isValid = false;
          result.errors.push('JSX Fragment syntax error: Unmatched opening/closing fragments');
        }
      }

      // Method chaining syntax kontrolü
      const methodChainingErrors = content.match(/\.\s*;\s*\./g);
      if (methodChainingErrors) {
        result.syntaxErrors += methodChainingErrors.length;
        result.isValid = false;
        result.errors.push(`Method chaining syntax errors found: ${methodChainingErrors.length}`);
      }

      // Ternary operator syntax kontrolü
      const ternaryErrors = content.match(/\?\s*;|\;\s*:/g);
      if (ternaryErrors) {
        result.syntaxErrors += ternaryErrors.length;
        result.isValid = false;
        result.errors.push(`Ternary operator syntax errors found: ${ternaryErrors.length}`);
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation failed: ${error}`);
    }

    return result;
  }

  /**
   * Dosyayı önceki haline geri döndür
   */
  async restoreBackup(filePath: string): Promise<void> {
    const backup = this.backups.get(filePath);
    if (!backup) {
      throw new Error(`No backup found for: ${filePath}`);
    }

    try {
      await fs.writeFile(filePath, backup.originalContent, 'utf-8');
      console.log(`🔄 Restored backup for: ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to restore backup for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Agent çalışma prosedürü - güvenli dosya modifikasyonu
   */
  async safeFileOperation(
    filePath: string,
    operation: () => Promise<void>,
    validationThreshold = { maxSyntaxErrors: 0, maxBuildErrors: 0 }
  ): Promise<{ success: boolean; validationResult: ValidationResult }> {
    
    console.log(`🔒 Starting safe operation on: ${filePath}`);

    // 1. Yedek oluştur
    await this.createBackup(filePath);

    try {
      // 2. Operation'ı çalıştır
      await operation();
      console.log(`⚙️  Operation completed on: ${filePath}`);

      // 3. Validation yap
      const validationResult = await this.validateFile(filePath);
      console.log(`🔍 Validation result for ${filePath}:`, {
        isValid: validationResult.isValid,
        syntaxErrors: validationResult.syntaxErrors,
        buildErrors: validationResult.buildErrors,
        errors: validationResult.errors.length
      });

      // 4. Threshold kontrolü
      const exceedsThreshold = 
        validationResult.syntaxErrors > validationThreshold.maxSyntaxErrors ||
        validationResult.buildErrors > validationThreshold.maxBuildErrors ||
        !validationResult.isValid;

      if (exceedsThreshold) {
        // Threshold aşıldı - restore yap
        console.log(`❌ Validation failed, restoring backup for: ${filePath}`);
        await this.restoreBackup(filePath);
        return { success: false, validationResult };
      }

      // 5. Başarılı - backup'ı temizle
      console.log(`✅ Operation successful on: ${filePath}`);
      return { success: true, validationResult };

    } catch (error) {
      // Operation başarısız - restore yap
      console.log(`💥 Operation failed, restoring backup for: ${filePath}`);
      await this.restoreBackup(filePath);
      throw error;
    }
  }

  /**
   * Tüm backupları temizle
   */
  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.backupDir, { recursive: true, force: true });
      this.backups.clear();
      console.log(`🗑️  Cleaned up backups for session: ${this.sessionId}`);
    } catch (error) {
      console.error(`❌ Failed to cleanup backups:`, error);
    }
  }

  /**
   * Aktif backupları listele
   */
  listBackups(): string[] {
    return Array.from(this.backups.keys());
  }
}

/**
 * Agent wrapper'ı - mevcut agent'ları güvenli hale getirir
 */
export async function safeAgentWrapper<T>(
  agentFunction: () => Promise<T>,
  filePaths: string[],
  options: {
    maxSyntaxErrors?: number;
    maxBuildErrors?: number;
    description?: string;
  } = {}
): Promise<{ success: boolean; result?: T; failures: string[] }> {
  
  const safeSystem = new SafeAgentSystem();
  const failures: string[] = [];
  
  console.log(`🚀 Starting safe agent operation: ${options.description || 'Unknown'}`);

  try {
    // Tüm dosyalar için backup oluştur
    for (const filePath of filePaths) {
      await safeSystem.createBackup(filePath);
    }

    // Agent'ı çalıştır
    const result = await agentFunction();

    // Tüm dosyaları validate et
    for (const filePath of filePaths) {
      const { success, validationResult } = await safeSystem.safeFileOperation(
        filePath,
        async () => {}, // Operation zaten yapıldı
        {
          maxSyntaxErrors: options.maxSyntaxErrors || 0,
          maxBuildErrors: options.maxBuildErrors || 0
        }
      );

      if (!success) {
        failures.push(`${filePath}: ${validationResult.errors.join(', ')}`);
      }
    }

    if (failures.length > 0) {
      console.log(`⚠️  Agent completed with ${failures.length} file failures`);
    } else {
      console.log(`✅ Agent completed successfully on all ${filePaths.length} files`);
    }

    return { success: failures.length === 0, result, failures };

  } catch (error) {
    console.error(`💥 Safe agent operation failed:`, error);
    return { success: false, failures: [`Agent execution failed: ${error}`] };
    
  } finally {
    // Cleanup
    await safeSystem.cleanup();
  }
}

export default SafeAgentSystem;