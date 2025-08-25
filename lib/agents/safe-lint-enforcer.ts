/**
 * Safe TypeScript Lint Enforcer
 * Güvenli backup-verify-restore sistemi ile çalışan lint enforcer
 */

import { SafeAgentSystem, safeAgentWrapper } from './safe-agent-system';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface LintError {
  file: string;
  line: number;
  column: number;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

interface LintResult {
  fixedFiles: string[];
  failedFiles: string[];
  errors: LintError[];
  totalFixed: number;
}

export class SafeLintEnforcer {
  private safeSystem: SafeAgentSystem;

  constructor() {
    this.safeSystem = new SafeAgentSystem();
  }

  /**
   * Güvenli lint düzeltme işlemi
   */
  async fixLintErrors(filePaths: string[]): Promise<LintResult> {
    const result: LintResult = {
      fixedFiles: [],
      failedFiles: [],
      errors: [],
      totalFixed: 0
    };

    console.log(`🔧 Starting safe lint enforcement on ${filePaths.length} files`);

    for (const filePath of filePaths) {
      try {
        const { success, validationResult } = await this.safeSystem.safeFileOperation(
          filePath,
          async () => {
            // TypeScript ve ESLint düzeltmeleri yap
            await this.performLintFixes(filePath);
          },
          {
            maxSyntaxErrors: 0, // Hiç syntax hatası tolere etme
            maxBuildErrors: 0   // Hiç build hatası tolere etme
          }
        );

        if (success) {
          result.fixedFiles.push(filePath);
          result.totalFixed++;
          console.log(`✅ Successfully fixed: ${filePath}`);
        } else {
          result.failedFiles.push(filePath);
          result.errors.push({
            file: filePath,
            line: 0,
            column: 0,
            rule: 'validation-failed',
            message: validationResult.errors.join('; '),
            severity: 'error'
          });
          console.log(`❌ Failed to fix: ${filePath} - ${validationResult.errors.join(', ')}`);
        }
      } catch (error) {
        result.failedFiles.push(filePath);
        result.errors.push({
          file: filePath,
          line: 0,
          column: 0,
          rule: 'operation-failed',
          message: error instanceof Error ? error.message : String(error),
          severity: 'error'
        });
        console.error(`💥 Operation failed for ${filePath}:`, error);
      }
    }

    return result;
  }

  /**
   * Belirli bir dosya için lint düzeltmeleri yap
   */
  private async performLintFixes(filePath: string): Promise<void> {
    console.log(`🔨 Fixing lint errors in: ${filePath}`);

    // Dosya içeriğini oku
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;

    // Güvenli düzeltmeler - sadece kesin olan syntax hatalarını düzelt
    content = this.applySafeFixes(content);

    // İçerik değişti mi kontrol et
    if (content !== originalContent) {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`💾 Applied safe fixes to: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed for: ${filePath}`);
    }
  }

  /**
   * Sadece güvenli ve kesin olan düzeltmeleri uygula
   */
  private applySafeFixes(content: string): string {
    let fixedContent = content;
    let fixCount = 0;

    // 1. Missing semicolons - ENHANCED CONTEXT-AWARE VERSION  
    // This logic completely avoids problematic patterns that cause "Expected ',', got ';'" errors
    
    // First, identify lines that are clearly NOT inside arrays, objects, or function calls
    const lines = fixedContent.split('\n');
    let globalContext = '';
    let bracketDepth = 0;
    let braceDepth = 0;
    let parenDepth = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Count brackets/braces/parens GLOBALLY across all lines
      bracketDepth += (line.match(/\[/g) || []).length - (line.match(/\]/g) || []).length;
      braceDepth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      parenDepth += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
      
      // Determine current global context
      if (bracketDepth > 0) globalContext = 'array';
      else if (braceDepth > 0) globalContext = 'object';
      else if (parenDepth > 0) globalContext = 'function';
      else globalContext = 'statement';
      
      // STRICT RULES: Only add semicolons in very specific, safe cases
      const shouldAddSemicolon = (
        globalContext === 'statement' && // Must be at top level
        !line.endsWith(';') && 
        !line.endsWith('{') && 
        !line.endsWith('}') && 
        !line.endsWith(',') &&
        !line.endsWith('(') &&
        !line.endsWith('[') &&
        !trimmedLine.endsWith(')') && // Don't add to function call endings
        !trimmedLine.endsWith(']') && // Don't add to array endings
        trimmedLine.length > 0 &&
        
        // Only these VERY specific statement types
        (
          trimmedLine.startsWith('return ') ||
          trimmedLine.startsWith('break') ||
          trimmedLine.startsWith('continue') ||
          trimmedLine.startsWith('throw ') ||
          trimmedLine.match(/^\s*import\s+/) ||
          trimmedLine.match(/^\s*export\s+/) ||
          // Variable declarations only at start of line  
          trimmedLine.match(/^\s*(const|let|var)\s+\w+\s*=/) 
        )
      );
      
      if (shouldAddSemicolon) {
        // Additional safety check: next line shouldn't start with continuation
        const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
        if (!nextLine.startsWith('.') && !nextLine.startsWith('[') && !nextLine.startsWith('(')) {
          lines[i] = line + ';';
          fixCount++;
        }
      }
    }
    
    fixedContent = lines.join('\n');

    // 2. Double semicolons düzelt
    const doubleSemicolonRegex = /;;+/g;
    fixedContent = fixedContent.replace(doubleSemicolonRegex, ';');
    fixCount += (content.match(doubleSemicolonRegex) || []).length;

    // 3. Trailing comma eksikliklerini düzelt (sadece object/array literals)
    const missingTrailingCommaRegex = /(\w+|"[^"]*"|'[^']*'|\d+)\s*\n\s*(\}|\])/g;
    fixedContent = fixedContent.replace(missingTrailingCommaRegex, '$1,\n$2');
    fixCount += (content.match(missingTrailingCommaRegex) || []).length;

    // 4. Consistent quotes - sadece string literals
    const inconsistentQuotesRegex = /"([^"\\]*(\\.[^"\\]*)*)"/g;
    let quoteStyle = content.includes("'") ? "'" : '"';
    fixedContent = fixedContent.replace(inconsistentQuotesRegex, `${quoteStyle}$1${quoteStyle}`);

    if (fixCount > 0) {
      console.log(`🔧 Applied ${fixCount} safe fixes`);
    }

    return fixedContent;
  }

  /**
   * Cleanup - backup'ları temizle
   */
  async cleanup(): Promise<void> {
    await this.safeSystem.cleanup();
  }
}

/**
 * Wrapper function - kolay kullanım için
 */
export async function safeTypescriptLintFix(
  filePaths: string | string[]
): Promise<LintResult> {
  const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
  const enforcer = new SafeLintEnforcer();
  
  try {
    const result = await enforcer.fixLintErrors(paths);
    return result;
  } finally {
    await enforcer.cleanup();
  }
}

/**
 * Saafe agent wrapper kullanarak toplu lint düzeltme
 */
export async function batchSafeLintFix(
  filePaths: string[]
): Promise<{ success: boolean; result?: LintResult; failures: string[] }> {
  
  return safeAgentWrapper(
    async () => {
      const enforcer = new SafeLintEnforcer();
      try {
        return await enforcer.fixLintErrors(filePaths);
      } finally {
        await enforcer.cleanup();
      }
    },
    filePaths,
    {
      maxSyntaxErrors: 0,
      maxBuildErrors: 0,
      description: `Batch lint fix for ${filePaths.length} files`
    }
  );
}

export default SafeLintEnforcer;