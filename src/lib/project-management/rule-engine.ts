/**
 * PROJECT RULE ENGINE & AUTOMATIC PAGE MANAGEMENT SYSTEM
 * 
 * Bu sistem:
 * 1. Proje kurallarını tanımlar ve yönetir
 * 2. Otomatik sayfa oluşturma/düzenleme yapar
 * 3. Kod standartlarını zorunlu tutar
 * 4. Development workflow'u kontrol eder
 */

import { ProjectTracker, ProjectTask } from './project-tracker';
import { DynamicRBAC } from '../security/dynamic-rbac-simple';
import { AuthenticatedUser } from '../auth/auth-utils';
import { prisma } from '../prisma';
import * as fs from 'fs/promises';
import * as path from 'path';

// ===== RULE DEFINITIONS =====

export interface ProjectRule {
  id: string;
  name: string;
  category: 'security' | 'ui-ux' | 'database' | 'api' | 'structure' | 'workflow';
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  enforced: boolean;
  autoFix: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  triggers: RuleTrigger[];
  validationRules: ValidationRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleCondition {
  type: 'file_exists' | 'file_content' | 'database_schema' | 'api_endpoint' | 'component_structure';
  target: string;
  operator: 'equals' | 'contains' | 'not_contains' | 'matches_regex' | 'exists' | 'not_exists';
  value: any;
  description: string;
}

export interface RuleAction {
  type: 'create_file' | 'modify_file' | 'delete_file' | 'create_task' | 'update_component' | 'generate_code';
  target: string;
  parameters: Record<string, any>;
  template?: string;
  description: string;
}

export interface RuleTrigger {
  type: 'file_change' | 'task_complete' | 'manual' | 'periodic' | 'on_error';
  pattern?: string;
  schedule?: string;
  description: string;
}

export interface ValidationRule {
  type: 'prisma_naming' | 'component_structure' | 'api_pattern' | 'security_check' | 'performance';
  pattern: string;
  message: string;
  autoFixable: boolean;
}

// ===== PREDEFINED RULES =====

export const CORE_PROJECT_RULES: ProjectRule[] = [
  {
    id: 'RULE-001-PRISMA-NAMING',
    name: 'Prisma Field Naming Convention',
    category: 'database',
    description: 'Ensure all Prisma queries use correct field naming (Staff not staff, Role not role)',
    priority: 'critical',
    enforced: true,
    autoFix: true,
    conditions: [
      {
        type: 'file_content',
        target: '**/*.tsx',
        operator: 'contains',
        value: 'include.*staff.*{',
        description: 'Files containing lowercase staff in include statements'
      },
      {
        type: 'file_content',
        target: '**/*.ts',
        operator: 'contains',
        value: 'user\\.staff\\?\\[',
        description: 'Files accessing user.staff array'
      }
    ],
    actions: [
      {
        type: 'modify_file',
        target: 'detected_files',
        parameters: {
          replacements: [
            { from: 'include.*staff.*{', to: 'include: { Staff: {' },
            { from: 'user\\.staff\\?\\[', to: 'user.Staff?.[' },
            { from: '\\.role\\?\\.' , to: '.Role?.' },
            { from: 'include.*role.*true', to: 'include: { Role: true }' }
          ]
        },
        description: 'Fix Prisma field naming to use uppercase'
      },
      {
        type: 'create_task',
        target: 'task_tracker',
        parameters: {
          title: 'Fix Prisma naming in detected files',
          category: 'database',
          priority: 'critical'
        },
        description: 'Create tracking task for manual review'
      }
    ],
    triggers: [
      {
        type: 'file_change',
        pattern: '**/*.{ts,tsx}',
        description: 'Trigger when TypeScript files change'
      },
      {
        type: 'manual',
        description: 'Manual validation trigger'
      }
    ],
    validationRules: [
      {
        type: 'prisma_naming',
        pattern: '\\binclude:\\s*{\\s*Staff:',
        message: 'Use Staff (uppercase) for Prisma includes',
        autoFixable: true
      },
      {
        type: 'prisma_naming',
        pattern: '\\.Staff\\?\\[\\d+\\]\\?\\.Role',
        message: 'Use Role (uppercase) for role access',
        autoFixable: true
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: 'RULE-002-DYNAMIC-RBAC',
    name: 'Dynamic RBAC Implementation',
    category: 'security',
    description: 'Replace static role checks with dynamic RBAC system',
    priority: 'high',
    enforced: true,
    autoFix: true,
    conditions: [
      {
        type: 'file_content',
        target: '**/*.{ts,tsx}',
        operator: 'contains',
        value: 'title.*===.*["\']Administrator["\']',
        description: 'Files with hardcoded Administrator checks'
      },
      {
        type: 'file_content',
        target: '**/*.{ts,tsx}',
        operator: 'contains',
        value: 'role\\.title.*!==',
        description: 'Files with static role title comparisons'
      }
    ],
    actions: [
      {
        type: 'modify_file',
        target: 'detected_files',
        parameters: {
          imports: [
            "import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';"
          ],
          replacements: [
            {
              from: 'if \\(!user \\|\\| user\\.Staff\\?\\[0\\]\\?\\.Role\\?\\.title !== ["\']Administrator["\']\\) {[\\s\\S]*?redirect\\(["\'][^"\']*["\']\\);[\\s\\S]*?}',
              to: 'const user = await requireAuth(AuthPresets.adminOnly);'
            }
          ]
        },
        description: 'Replace static admin checks with dynamic RBAC'
      }
    ],
    triggers: [
      {
        type: 'file_change',
        pattern: '**/*.{ts,tsx}',
        description: 'Monitor TypeScript file changes'
      }
    ],
    validationRules: [
      {
        type: 'security_check',
        pattern: 'requireAuth\\(AuthPresets\\.',
        message: 'Use dynamic RBAC instead of hardcoded role checks',
        autoFixable: true
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: 'RULE-003-COMPONENT-STRUCTURE',
    name: 'Standard Component Structure',
    category: 'ui-ux',
    description: 'Ensure all React components follow standard structure',
    priority: 'medium',
    enforced: true,
    autoFix: true,
    conditions: [
      {
        type: 'file_exists',
        target: 'src/components/**/*.tsx',
        operator: 'exists',
        value: true,
        description: 'React component files'
      }
    ],
    actions: [
      {
        type: 'generate_code',
        target: 'component_template',
        parameters: {
          template: 'standard_component',
          includeTypes: true,
          includeTests: true,
          includeStorybook: false
        },
        description: 'Generate standard component structure'
      }
    ],
    triggers: [
      {
        type: 'file_change',
        pattern: 'src/components/**/*.tsx',
        description: 'Component file changes'
      }
    ],
    validationRules: [
      {
        type: 'component_structure',
        pattern: '^import.*React.*from.*["\']react["\'];',
        message: 'Components should import React',
        autoFixable: true
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: 'RULE-004-API-STRUCTURE',
    name: 'API Endpoint Structure',
    category: 'api',
    description: 'Ensure all API endpoints follow standard structure with proper auth',
    priority: 'high',
    enforced: true,
    autoFix: true,
    conditions: [
      {
        type: 'file_exists',
        target: 'src/app/api/**/route.ts',
        operator: 'exists',
        value: true,
        description: 'API route files'
      }
    ],
    actions: [
      {
        type: 'generate_code',
        target: 'api_template',
        parameters: {
          template: 'standard_api_route',
          includeAuth: true,
          includeValidation: true,
          includeErrorHandling: true
        },
        description: 'Generate standard API route structure'
      }
    ],
    triggers: [
      {
        type: 'file_change',
        pattern: 'src/app/api/**/route.ts',
        description: 'API route file changes'
      }
    ],
    validationRules: [
      {
        type: 'api_pattern',
        pattern: 'export\\s+async\\s+function\\s+(GET|POST|PUT|DELETE)',
        message: 'API routes should export async HTTP methods',
        autoFixable: true
      },
      {
        type: 'security_check',
        pattern: 'APIAuthPatterns\\.',
        message: 'API routes should use authentication patterns',
        autoFixable: true
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: 'RULE-005-PAGE-STRUCTURE',
    name: 'Page Component Structure',
    category: 'structure',
    description: 'Ensure all page components follow standard structure with proper auth',
    priority: 'high',
    enforced: true,
    autoFix: true,
    conditions: [
      {
        type: 'file_exists',
        target: 'src/app/**/page.tsx',
        operator: 'exists',
        value: true,
        description: 'Page component files'
      }
    ],
    actions: [
      {
        type: 'generate_code',
        target: 'page_template',
        parameters: {
          template: 'standard_page',
          includeAuth: true,
          includeMetadata: true,
          includeErrorBoundary: true
        },
        description: 'Generate standard page structure'
      }
    ],
    triggers: [
      {
        type: 'file_change',
        pattern: 'src/app/**/page.tsx',
        description: 'Page component file changes'
      }
    ],
    validationRules: [
      {
        type: 'component_structure',
        pattern: 'export\\s+const\\s+metadata',
        message: 'Pages should export metadata',
        autoFixable: true
      },
      {
        type: 'security_check',
        pattern: 'requireAuth\\(',
        message: 'Pages should use authentication checks',
        autoFixable: true
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ===== RULE ENGINE CLASS =====

export class RuleEngine {
  private static instance: RuleEngine;
  private rules = new Map<string, ProjectRule>();
  private tracker: ProjectTracker;
  private rbac: DynamicRBAC;
  
  static getInstance(): RuleEngine {
    if (!RuleEngine.instance) {
      RuleEngine.instance = new RuleEngine();
    }
    return RuleEngine.instance;
  }

  constructor() {
    this.tracker = ProjectTracker.getInstance();
    this.rbac = DynamicRBAC.getInstance();
    this.loadCoreRules();
  }

  // Load core project rules
  private loadCoreRules(): void {
    CORE_PROJECT_RULES.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  // Add custom rule
  addRule(rule: ProjectRule): void {
    this.rules.set(rule.id, rule);
  }

  // Get rule by ID
  getRule(ruleId: string): ProjectRule | undefined {
    return this.rules.get(ruleId);
  }

  // Get all rules
  getAllRules(): ProjectRule[] {
    return Array.from(this.rules.values());
  }

  // Get rules by category
  getRulesByCategory(category: ProjectRule['category']): ProjectRule[] {
    return this.getAllRules().filter(rule => rule.category === category);
  }

  // Validate all rules
  async validateAllRules(): Promise<RuleValidationResult[]> {
    const results: RuleValidationResult[] = [];
    
    for (const rule of this.getAllRules()) {
      if (rule.enforced) {
        const result = await this.validateRule(rule.id);
        results.push(result);
      }
    }
    
    return results;
  }

  // Validate specific rule
  async validateRule(ruleId: string): Promise<RuleValidationResult> {
    const rule = this.getRule(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    const violations: RuleViolation[] = [];
    const fixes: RuleFix[] = [];

    // Check conditions
    for (const condition of rule.conditions) {
      const conditionResult = await this.checkCondition(condition);
      if (conditionResult.violated) {
        violations.push({
          ruleId: rule.id,
          condition,
          files: conditionResult.files,
          message: conditionResult.message,
          severity: rule.priority
        });

        // Generate fixes if auto-fixable
        if (rule.autoFix) {
          const ruleFixes = await this.generateFixes(rule, conditionResult);
          fixes.push(...ruleFixes);
        }
      }
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      passed: violations.length === 0,
      violations,
      fixes,
      timestamp: new Date()
    };
  }

  // Check condition
  private async checkCondition(condition: RuleCondition): Promise<ConditionResult> {
    switch (condition.type) {
      case 'file_content':
        return await this.checkFileContent(condition);
      case 'file_exists':
        return await this.checkFileExists(condition);
      case 'database_schema':
        return await this.checkDatabaseSchema(condition);
      case 'api_endpoint':
        return await this.checkApiEndpoint(condition);
      case 'component_structure':
        return await this.checkComponentStructure(condition);
      default:
        throw new Error(`Unknown condition type: ${condition.type}`);
    }
  }

  // Check file content condition
  private async checkFileContent(condition: RuleCondition): Promise<ConditionResult> {
    const files = await this.findFiles(condition.target);
    const violatingFiles: string[] = [];
    
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const regex = new RegExp(condition.value, 'gi');
        
        if (condition.operator === 'contains' && regex.test(content)) {
          violatingFiles.push(filePath);
        } else if (condition.operator === 'not_contains' && !regex.test(content)) {
          violatingFiles.push(filePath);
        }
      } catch (error) {
        console.warn(`Could not read file: ${filePath}`);
      }
    }

    return {
      violated: violatingFiles.length > 0,
      files: violatingFiles,
      message: violatingFiles.length > 0 
        ? `Found ${violatingFiles.length} files violating condition: ${condition.description}`
        : 'No violations found'
    };
  }

  // Check file exists condition
  private async checkFileExists(condition: RuleCondition): Promise<ConditionResult> {
    const files = await this.findFiles(condition.target);
    const expectExists = condition.operator === 'exists';
    const actualExists = files.length > 0;
    
    return {
      violated: expectExists !== actualExists,
      files: expectExists ? [] : files,
      message: expectExists && !actualExists 
        ? `Expected files matching ${condition.target} to exist`
        : !expectExists && actualExists 
        ? `Found unexpected files: ${files.join(', ')}`
        : 'Condition satisfied'
    };
  }

  // Find files matching pattern
  private async findFiles(pattern: string): Promise<string[]> {
    // Simple glob implementation - in real system use proper glob library
    const baseDir = process.cwd();
    return await this.searchFiles(baseDir, pattern);
  }

  // Search files recursively
  private async searchFiles(dir: string, pattern: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and .git
          if (!['node_modules', '.git', '.next'].includes(entry.name)) {
            const subFiles = await this.searchFiles(fullPath, pattern);
            files.push(...subFiles);
          }
        } else if (entry.isFile()) {
          // Simple pattern matching
          if (this.matchesPattern(fullPath, pattern)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not read directory: ${dir}`);
    }
    
    return files;
  }

  // Simple pattern matching
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.')
      .replace(/\./g, '\\.');
    
    const regex = new RegExp(regexPattern);
    return regex.test(filePath);
  }

  // Generate fixes for violations
  private async generateFixes(rule: ProjectRule, conditionResult: ConditionResult): Promise<RuleFix[]> {
    const fixes: RuleFix[] = [];
    
    for (const action of rule.actions) {
      if (action.type === 'modify_file') {
        for (const filePath of conditionResult.files) {
          fixes.push({
            type: 'file_modification',
            target: filePath,
            description: action.description,
            changes: action.parameters.replacements || [],
            imports: action.parameters.imports || [],
            autoApply: rule.autoFix
          });
        }
      } else if (action.type === 'create_task') {
        fixes.push({
          type: 'task_creation',
          target: 'project_tracker',
          description: action.description,
          taskData: {
            title: action.parameters.title,
            category: action.parameters.category,
            priority: action.parameters.priority,
            files: conditionResult.files
          },
          autoApply: true
        });
      }
    }
    
    return fixes;
  }

  // Apply fixes
  async applyFixes(fixes: RuleFix[]): Promise<FixApplicationResult[]> {
    const results: FixApplicationResult[] = [];
    
    for (const fix of fixes) {
      try {
        const result = await this.applyFix(fix);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          fix,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  // Apply single fix
  private async applyFix(fix: RuleFix): Promise<FixApplicationResult> {
    switch (fix.type) {
      case 'file_modification':
        return await this.applyFileModification(fix);
      case 'task_creation':
        return await this.applyTaskCreation(fix);
      default:
        throw new Error(`Unknown fix type: ${fix.type}`);
    }
  }

  // Apply file modification
  private async applyFileModification(fix: RuleFix): Promise<FixApplicationResult> {
    try {
      let content = await fs.readFile(fix.target, 'utf-8');
      let modified = false;

      // Apply imports
      if (fix.imports && fix.imports.length > 0) {
        const importLines = fix.imports.join('\n');
        if (!content.includes(importLines)) {
          content = importLines + '\n' + content;
          modified = true;
        }
      }

      // Apply replacements
      if (fix.changes) {
        for (const change of fix.changes) {
          const regex = new RegExp(change.from, 'gi');
          if (regex.test(content)) {
            content = content.replace(regex, change.to);
            modified = true;
          }
        }
      }

      if (modified) {
        await fs.writeFile(fix.target, content, 'utf-8');
      }

      return {
        success: true,
        fix,
        applied: modified,
        message: modified ? 'File successfully modified' : 'No changes needed'
      };
    } catch (error) {
      return {
        success: false,
        fix,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Apply task creation
  private async applyTaskCreation(fix: RuleFix): Promise<FixApplicationResult> {
    try {
      if (fix.taskData) {
        await this.tracker.createTask({
          title: fix.taskData.title,
          description: fix.description,
          category: fix.taskData.category as any,
          priority: fix.taskData.priority as any,
          files: fix.taskData.files || [],
          tags: ['auto-generated', 'rule-violation']
        });
      }

      return {
        success: true,
        fix,
        applied: true,
        message: 'Task successfully created'
      };
    } catch (error) {
      return {
        success: false,
        fix,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Auto-fix all violations
  async autoFixAllViolations(): Promise<AutoFixResult> {
    const validationResults = await this.validateAllRules();
    const allFixes: RuleFix[] = [];
    
    for (const result of validationResults) {
      if (!result.passed && result.fixes.length > 0) {
        allFixes.push(...result.fixes.filter(fix => fix.autoApply));
      }
    }

    const applicationResults = await this.applyFixes(allFixes);
    
    return {
      totalViolations: validationResults.reduce((sum, r) => sum + r.violations.length, 0),
      totalFixes: allFixes.length,
      appliedFixes: applicationResults.filter(r => r.success && r.applied).length,
      failedFixes: applicationResults.filter(r => !r.success).length,
      results: applicationResults
    };
  }

  // Trigger rule validation on file change
  async onFileChange(filePath: string): Promise<void> {
    const affectedRules = this.getAllRules().filter(rule =>
      rule.triggers.some(trigger => 
        trigger.type === 'file_change' && 
        trigger.pattern && 
        this.matchesPattern(filePath, trigger.pattern)
      )
    );

    for (const rule of affectedRules) {
      if (rule.enforced) {
        const result = await this.validateRule(rule.id);
        if (!result.passed && rule.autoFix) {
          await this.applyFixes(result.fixes.filter(fix => fix.autoApply));
        }
      }
    }
  }

  // Check database schema condition
  private async checkDatabaseSchema(condition: RuleCondition): Promise<ConditionResult> {
    // Implementation for database schema validation
    return {
      violated: false,
      files: [],
      message: 'Database schema validation not implemented yet'
    };
  }

  // Check API endpoint condition
  private async checkApiEndpoint(condition: RuleCondition): Promise<ConditionResult> {
    // Implementation for API endpoint validation
    return {
      violated: false,
      files: [],
      message: 'API endpoint validation not implemented yet'
    };
  }

  // Check component structure condition
  private async checkComponentStructure(condition: RuleCondition): Promise<ConditionResult> {
    // Implementation for component structure validation
    return {
      violated: false,
      files: [],
      message: 'Component structure validation not implemented yet'
    };
  }
}

// ===== INTERFACES =====

export interface RuleValidationResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  violations: RuleViolation[];
  fixes: RuleFix[];
  timestamp: Date;
}

export interface RuleViolation {
  ruleId: string;
  condition: RuleCondition;
  files: string[];
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface RuleFix {
  type: 'file_modification' | 'task_creation' | 'code_generation';
  target: string;
  description: string;
  changes?: Array<{ from: string; to: string }>;
  imports?: string[];
  taskData?: {
    title: string;
    category: string;
    priority: string;
    files?: string[];
  };
  autoApply: boolean;
}

export interface ConditionResult {
  violated: boolean;
  files: string[];
  message: string;
}

export interface FixApplicationResult {
  success: boolean;
  fix: RuleFix;
  applied?: boolean;
  message?: string;
  error?: string;
}

export interface AutoFixResult {
  totalViolations: number;
  totalFixes: number;
  appliedFixes: number;
  failedFixes: number;
  results: FixApplicationResult[];
} 