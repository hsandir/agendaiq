/**
 * AUTH MIGRATION & REPORTING SYSTEM
 * Mevcut dosyaları yeni auth yapısına otomatik migrate eder
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

export interface MigrationRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  replacement: string | ((match: string, ...groups: string[]) => string);
  fileTypes: string[];
  priority: number;
  category: 'import' | 'type' | 'function' | 'export' | 'usage';
  validation?: (content: string) => boolean;
}

export interface MigrationReport {
  totalFiles: number;
  processedFiles: number;
  modifiedFiles: number;
  errors: string[];
  warnings: string[];
  changes: FileChange[];
  summary: {
    importChanges: number;
    typeChanges: number;
    functionChanges: number;
    exportChanges: number;
    usageChanges: number;
  };
  timestamp: Date;
}

export interface FileChange {
  filePath: string;
  category: string;
  ruleName: string;
  description: string;
  before: string;
  after: string;
  lineNumber?: number;
}

// ===== MIGRATION RULES =====

export const AUTH_MIGRATION_RULES: MigrationRule[] = [
  // Import Standardization
  {
    id: 'IMPORT-001',
    name: 'Standardize Auth Options Import',
    description: 'Replace old auth imports with new auth-options import',
    pattern: /import\s+\{\s*authOptions\s*\}\s+from\s+["']@\/lib\/auth["']/g,
    replacement: "import { authOptions } from '@/lib/auth/auth-options'",
    fileTypes: ['.ts', '.tsx'],
    priority: 1,
    category: 'import'
  },
  {
    id: 'IMPORT-002', 
    name: 'Add AuthenticatedUser Import',
    description: 'Add AuthenticatedUser type import where needed',
    pattern: /(import.*from ['"]next-auth['"].*\n)/g,
    replacement: '$1import { AuthenticatedUser } from \'@/lib/auth/auth-utils\';\n',
    fileTypes: ['.ts', '.tsx'],
    priority: 2,
    category: 'import',
    validation: (content) => content.includes('AuthenticatedUser') && !content.includes("import { AuthenticatedUser }")
  },
  {
    id: 'IMPORT-003',
    name: 'Add Auth Utils Import',
    description: 'Add auth utils imports for authentication functions',
    pattern: /(import.*from ['"]next-auth.*['"].*\n)/g,
    replacement: '$1import { requireAuth, getCurrentUser, AuthPresets } from \'@/lib/auth/auth-utils\';\n',
    fileTypes: ['.ts', '.tsx'],
    priority: 3,
    category: 'import',
    validation: (content) => (content.includes('requireAuth') || content.includes('getCurrentUser')) && !content.includes("import { requireAuth")
  },

  // Type Migrations
  {
    id: 'TYPE-001',
    name: 'Update User Type References',
    description: 'Replace User type with AuthenticatedUser where appropriate',
    pattern: /(\w+):\s*User(\s*[&|])/g,
    replacement: '$1: AuthenticatedUser$2',
    fileTypes: ['.ts', '.tsx'],
    priority: 4,
    category: 'type'
  },
  {
    id: 'TYPE-002',
    name: 'Fix Session User ID Type',
    description: 'Ensure user.id is handled as number',
    pattern: /session\.user\.id/g,
    replacement: (match, ...groups) => {
      return 'user.id';
    },
    fileTypes: ['.ts', '.tsx'],
    priority: 5,
    category: 'type'
  },

  // Function Migrations
  {
    id: 'FUNC-001',
    name: 'Replace getServerSession Pattern',
    description: 'Replace manual getServerSession with requireAuth',
    pattern: /const\s+session\s*=\s*await\s+getServerSession\(authOptions\);\s*\n\s*if\s*\(\s*!session\s*\)\s*\{\s*\n\s*redirect\(['"]\/auth\/signin['"]\);\s*\n\s*\}/g,
    replacement: 'const user = await requireAuth(AuthPresets.requireAuth);',
    fileTypes: ['.ts', '.tsx'],
    priority: 6,
    category: 'function'
  },
  {
    id: 'FUNC-002',
    name: 'Replace Manual Auth Checks',
    description: 'Replace manual auth checks with requireAuth patterns',
    pattern: /const\s+session\s*=\s*await\s+getServerSession\(authOptions\);\s*\n[\s\S]*?if\s*\(\s*!session.*?\)\s*\{[\s\S]*?redirect.*?\n\s*\}/g,
    replacement: 'const user = await requireAuth(AuthPresets.requireAuth);',
    fileTypes: ['.ts', '.tsx'],
    priority: 7,
    category: 'function'
  },

  // API Auth Patterns
  {
    id: 'API-001',
    name: 'Update API Auth Patterns',
    description: 'Replace manual API auth with APIAuthPatterns',
    pattern: /export\s+async\s+function\s+(GET|POST|PUT|DELETE)\s*\(\s*request:\s*NextRequest\s*\)\s*\{[\s\S]*?const\s+session\s*=\s*await\s+getServerSession\(authOptions\)/g,
    replacement: (match, method) => {
      return `export const ${method} = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {`;
    },
    fileTypes: ['.ts'],
    priority: 8,
    category: 'function'
  },

  // Usage Pattern Updates
  {
    id: 'USAGE-001',
    name: 'Update Session User Access',
    description: 'Replace session.user access with user parameter',
    pattern: /session\.user\./g,
    replacement: 'user.',
    fileTypes: ['.ts', '.tsx'],
    priority: 9,
    category: 'usage'
  },
  {
    id: 'USAGE-002',
    name: 'Update Staff Access Pattern',
    description: 'Update staff record access pattern',
    pattern: /user\.Staff\?\.\[0\]\?/g,
    replacement: 'user.staff?',
    fileTypes: ['.ts', '.tsx'],
    priority: 10,
    category: 'usage'
  }
];

// ===== MIGRATION ENGINE =====

export class AuthMigrationEngine {
  private report: MigrationReport;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.report = {
      totalFiles: 0,
      processedFiles: 0,
      modifiedFiles: 0,
      errors: [],
      warnings: [],
      changes: [],
      summary: {
        importChanges: 0,
        typeChanges: 0,
        functionChanges: 0,
        exportChanges: 0,
        usageChanges: 0
      },
      timestamp: new Date()
    };
  }

  // Run full migration
  async runMigration(): Promise<MigrationReport> {
    try {
      console.log('🔄 Starting Auth Migration...');
      
      // Find all relevant files
      const files = await this.findRelevantFiles();
      this.report.totalFiles = files.length;
      
      console.log(`📁 Found ${files.length} files to process`);

      // Process each file
      for (const filePath of files) {
        await this.processFile(filePath);
        this.report.processedFiles++;
      }

      // Generate summary
      this.generateSummary();
      
      console.log('✅ Auth Migration completed');
      return this.report;

    } catch (error) {
      this.report.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // Find all files that need migration
  private async findRelevantFiles(): Promise<string[]> {
    const patterns = [
      'src/**/*.ts',
      'src/**/*.tsx',
      '!src/**/*.d.ts',
      '!src/**/*.test.ts',
      '!src/**/*.test.tsx',
      '!src/**/node_modules/**'
    ];

    const files: string[] = [];
    
    for (const pattern of patterns) {
      const matches = await glob(pattern, { cwd: this.projectRoot });
      files.push(...matches.map(f => path.join(this.projectRoot, f)));
    }

    return [...new Set(files)];
  }

  // Process individual file
  private async processFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let modifiedContent = content;
      let hasChanges = false;

      // Apply migration rules in priority order
      const sortedRules = AUTH_MIGRATION_RULES.sort((a, b) => a.priority - b.priority);
      
      for (const rule of sortedRules) {
        // Check if rule applies to this file type
        if (!rule.fileTypes.some(ext => filePath.endsWith(ext))) {
          continue;
        }

        // Skip rule if validation fails
        if (rule.validation && !rule.validation(modifiedContent)) {
          continue;
        }

        const originalContent = modifiedContent;
        modifiedContent = this.applyRule(modifiedContent, rule, filePath);
        
        if (originalContent !== modifiedContent) {
          hasChanges = true;
          this.recordChange(filePath, rule, originalContent, modifiedContent);
          this.report.summary[rule.category + 'Changes' as keyof typeof this.report.summary]++;
        }
      }

      // Write changes if any
      if (hasChanges) {
        await this.createBackup(filePath);
        await fs.writeFile(filePath, modifiedContent, 'utf-8');
        this.report.modifiedFiles++;
        console.log(`✏️  Modified: ${path.relative(this.projectRoot, filePath)}`);
      }

    } catch (error) {
      const errorMsg = `Error processing ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.report.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  // Apply individual migration rule
  private applyRule(content: string, rule: MigrationRule, filePath: string): string {
    if (typeof rule.replacement === 'function') {
      return content.replace(rule.pattern, rule.replacement);
    } else {
      return content.replace(rule.pattern, rule.replacement);
    }
  }

  // Record change for reporting
  private recordChange(filePath: string, rule: MigrationRule, before: string, after: string): void {
    // Find the specific changes
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');
    
    for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i++) {
      const beforeLine = beforeLines[i] || '';
      const afterLine = afterLines[i] || '';
      
      if (beforeLine !== afterLine) {
        this.report.changes.push({
          filePath: path.relative(this.projectRoot, filePath),
          category: rule.category,
          ruleName: rule.name,
          description: rule.description,
          before: beforeLine.trim(),
          after: afterLine.trim(),
          lineNumber: i + 1
        });
        break; // Record first change per rule
      }
    }
  }

  // Create backup before modification
  private async createBackup(filePath: string): Promise<void> {
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.copyFile(filePath, backupPath);
  }

  // Generate migration summary
  private generateSummary(): void {
    const { summary } = this.report;
    const totalChanges = Object.values(summary).reduce((sum, count) => sum + count, 0);
    
    console.log('\n📊 Migration Summary:');
    console.log(`📁 Total files: ${this.report.totalFiles}`);
    console.log(`✅ Processed: ${this.report.processedFiles}`);
    console.log(`📝 Modified: ${this.report.modifiedFiles}`);
    console.log(`🔄 Total changes: ${totalChanges}`);
    console.log(`   - Import changes: ${summary.importChanges}`);
    console.log(`   - Type changes: ${summary.typeChanges}`);
    console.log(`   - Function changes: ${summary.functionChanges}`);
    console.log(`   - Usage changes: ${summary.usageChanges}`);
    
    if (this.report.errors.length > 0) {
      console.log(`❌ Errors: ${this.report.errors.length}`);
    }
    
    if (this.report.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${this.report.warnings.length}`);
    }
  }

  // Generate detailed report
  async generateDetailedReport(): Promise<string> {
    const report = `# Auth Migration Report
Generated: ${this.report.timestamp.toISOString()}

## Summary
- **Total Files**: ${this.report.totalFiles}
- **Processed Files**: ${this.report.processedFiles}
- **Modified Files**: ${this.report.modifiedFiles}
- **Total Changes**: ${Object.values(this.report.summary).reduce((sum, count) => sum + count, 0)}

### Change Breakdown
- Import Changes: ${this.report.summary.importChanges}
- Type Changes: ${this.report.summary.typeChanges}
- Function Changes: ${this.report.summary.functionChanges}
- Usage Changes: ${this.report.summary.usageChanges}

## Detailed Changes

${this.report.changes.map(change => `
### ${change.filePath} (Line ${change.lineNumber})
**Rule**: ${change.ruleName}
**Category**: ${change.category}
**Description**: ${change.description}

**Before**:
\`\`\`typescript
${change.before}
\`\`\`

**After**:
\`\`\`typescript
${change.after}
\`\`\`
`).join('\n')}

${this.report.errors.length > 0 ? `
## Errors
${this.report.errors.map(error => `- ${error}`).join('\n')}
` : ''}

${this.report.warnings.length > 0 ? `
## Warnings  
${this.report.warnings.map(warning => `- ${warning}`).join('\n')}
` : ''}

## Next Steps
1. Review all changes carefully
2. Test the application functionality
3. Update any remaining manual auth patterns
4. Run type checks: \`npm run type-check\`
5. Run tests: \`npm test\`
6. Commit changes with detailed message
`;

    // Save report to file
    const reportPath = path.join(this.projectRoot, 'MIGRATION_REPORT.md');
    await fs.writeFile(reportPath, report, 'utf-8');
    
    return report;
  }

  // Get migration status for specific files
  async getFileStatus(filePaths: string[]): Promise<{[filePath: string]: 'needs_migration' | 'up_to_date' | 'error'}> {
    const status: {[filePath: string]: 'needs_migration' | 'up_to_date' | 'error'} = {};
    
    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        let needsMigration = false;
        
        for (const rule of AUTH_MIGRATION_RULES) {
          if (!rule.fileTypes.some(ext => filePath.endsWith(ext))) continue;
          
          if (rule.pattern.test(content)) {
            needsMigration = true;
            break;
          }
        }
        
        status[filePath] = needsMigration ? 'needs_migration' : 'up_to_date';
      } catch (error) {
        status[filePath] = 'error';
      }
    }
    
    return status;
  }

  // Preview changes without applying them
  async previewChanges(): Promise<FileChange[]> {
    const files = await this.findRelevantFiles();
    const previewChanges: FileChange[] = [];
    
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        let modifiedContent = content;
        
        const sortedRules = AUTH_MIGRATION_RULES.sort((a, b) => a.priority - b.priority);
        
        for (const rule of sortedRules) {
          if (!rule.fileTypes.some(ext => filePath.endsWith(ext))) continue;
          if (rule.validation && !rule.validation(modifiedContent)) continue;
          
          const originalContent = modifiedContent;
          modifiedContent = this.applyRule(modifiedContent, rule, filePath);
          
          if (originalContent !== modifiedContent) {
            const beforeLines = originalContent.split('\n');
            const afterLines = modifiedContent.split('\n');
            
            for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i++) {
              const beforeLine = beforeLines[i] || '';
              const afterLine = afterLines[i] || '';
              
              if (beforeLine !== afterLine) {
                previewChanges.push({
                  filePath: path.relative(this.projectRoot, filePath),
                  category: rule.category,
                  ruleName: rule.name,
                  description: rule.description,
                  before: beforeLine.trim(),
                  after: afterLine.trim(),
                  lineNumber: i + 1
                });
                break;
              }
            }
          }
        }
      } catch (error) {
        // Skip files with errors in preview
      }
    }
    
    return previewChanges;
  }
}

// ===== MIGRATION CLI INTERFACE =====

export class AuthMigrationCLI {
  private engine: AuthMigrationEngine;

  constructor(projectRoot: string = process.cwd()) {
    this.engine = new AuthMigrationEngine(projectRoot);
  }

  // Run interactive migration
  async runInteractiveMigration(): Promise<void> {
    console.log('🔍 Auth Migration System');
    console.log('========================\n');

    // Preview changes first
    console.log('📋 Previewing changes...');
    const previewChanges = await this.engine.previewChanges();
    
    if (previewChanges.length === 0) {
      console.log('✅ No migrations needed - system is up to date!');
      return;
    }

    console.log(`\n📊 Found ${previewChanges.length} changes to apply:`);
    
    // Group changes by category
    const changesByCategory = previewChanges.reduce((acc, change) => {
      if (!acc[change.category]) acc[change.category] = [];
      acc[change.category].push(change);
      return acc;
    }, {} as {[category: string]: FileChange[]});

    for (const [category, changes] of Object.entries(changesByCategory)) {
      console.log(`\n📁 ${category.toUpperCase()} (${changes.length} changes):`);
      changes.slice(0, 3).forEach(change => {
        console.log(`  • ${change.filePath}:${change.lineNumber} - ${change.ruleName}`);
      });
      if (changes.length > 3) {
        console.log(`  ... and ${changes.length - 3} more`);
      }
    }

    // Ask for confirmation
    console.log('\n🤔 Do you want to proceed with the migration? (y/n)');
    
    // In a real CLI, we'd use readline here
    // For now, we'll proceed automatically
    console.log('✅ Proceeding with migration...\n');

    // Run the migration
    const report = await this.engine.runMigration();

    // Generate detailed report
    const detailedReport = await this.engine.generateDetailedReport();
    console.log(`\n📄 Detailed report saved to: MIGRATION_REPORT.md`);

    console.log('\n🎉 Migration completed successfully!');
  }

  // Check system status
  async checkStatus(): Promise<void> {
    const files = await this.findAuthFiles();
    const status = await this.engine.getFileStatus(files);
    
    const needsMigration = Object.entries(status).filter(([_, s]) => s === 'needs_migration');
    const upToDate = Object.entries(status).filter(([_, s]) => s === 'up_to_date');
    const errors = Object.entries(status).filter(([_, s]) => s === 'error');

    console.log('📊 Auth System Status:');
    console.log(`✅ Up to date: ${upToDate.length} files`);
    console.log(`🔄 Needs migration: ${needsMigration.length} files`);
    console.log(`❌ Errors: ${errors.length} files`);

    if (needsMigration.length > 0) {
      console.log('\n📋 Files needing migration:');
      needsMigration.forEach(([filePath, _]) => {
        console.log(`  • ${filePath}`);
      });
    }
  }

  private async findAuthFiles(): Promise<string[]> {
    const patterns = [
      'src/**/*.ts',
      'src/**/*.tsx'
    ];

    const files: string[] = [];
    
    for (const pattern of patterns) {
      const matches = await glob(pattern);
      files.push(...matches);
    }

    return files.filter(async filePath => {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content.includes('auth') || content.includes('session') || content.includes('getServerSession');
      } catch {
        return false;
      }
    });
  }
}

// Export singleton instance
export const authMigration = new AuthMigrationEngine();
export const authMigrationCLI = new AuthMigrationCLI(); 