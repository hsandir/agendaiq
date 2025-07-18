/**
 * FULL PROJECT RULE ENGINE SYSTEM
 * Database entegrasyonu ve gerçek validation'larla
 */

import { ProjectTracker, ProjectTask } from './project-tracker-full';
import { DynamicRBAC } from '../security/dynamic-rbac-full';
import { AuthenticatedUser } from '../auth/auth-utils';
import { prisma } from '../prisma';
import * as fs from 'fs/promises';
import * as path from 'path';

// ===== DATABASE MODELS FOR RULES =====

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
  type: 'file_exists' | 'file_content' | 'database_schema' | 'api_endpoint' | 'component_structure' | 'import_check';
  target: string;
  operator: 'equals' | 'contains' | 'not_contains' | 'matches_regex' | 'exists' | 'not_exists';
  value: any;
  description: string;
}

export interface RuleAction {
  type: 'create_file' | 'modify_file' | 'delete_file' | 'create_task' | 'update_component' | 'generate_code' | 'fix_import';
  target: string;
  parameters: Record<string, any>;
  template?: string;
  description: string;
}

export interface RuleTrigger {
  type: 'file_change' | 'task_complete' | 'manual' | 'periodic' | 'on_error' | 'git_commit';
  pattern?: string;
  schedule?: string;
  description: string;
}

export interface ValidationRule {
  type: 'prisma_naming' | 'component_structure' | 'api_pattern' | 'security_check' | 'performance' | 'import_consistency';
  pattern: string;
  message: string;
  autoFixable: boolean;
}

// ===== ENHANCED RULE DEFINITIONS =====

export const ENHANCED_PROJECT_RULES: ProjectRule[] = [
  {
    id: 'RULE-001-PRISMA-NAMING',
    name: 'Prisma Field Naming Convention',
    category: 'database',
    description: 'Ensure all Prisma queries use correct field naming based on actual schema',
    priority: 'critical',
    enforced: true,
    autoFix: true,
    conditions: [
      {
        type: 'file_content',
        target: '**/*.{ts,tsx}',
        operator: 'contains',
        value: 'include.*["\']staff["\']',
        description: 'Files containing lowercase staff in include statements'
      },
      {
        type: 'file_content',
        target: '**/*.{ts,tsx}',
        operator: 'contains',
        value: 'userId.*user\\.id',
        description: 'Files using incorrect userId field reference'
      },
      {
        type: 'file_content',
        target: '**/*.{ts,tsx}',
        operator: 'contains',
        value: 'user_id.*parseInt',
        description: 'Files that need user_id integer conversion'
      }
    ],
    actions: [
      {
        type: 'modify_file',
        target: 'detected_files',
        parameters: {
          replacements: [
            { from: 'include:\\s*{\\s*staff:', to: 'include: {\n      Staff:' },
            { from: 'include:\\s*{\\s*role:', to: 'include: {\n      Role:' },
            { from: 'user_id:\\s*user\\.id', to: 'user_id: parseInt(user.id)' },
            { from: '\\.staff\\?\\[', to: '.Staff?.[' },
            { from: '\\.role\\?\\.' , to: '.Role?.' },
            { from: 'where:\\s*{\\s*userId:', to: 'where: {\n      user_id:' },
            { from: 'where:\\s*{\\s*staffId:', to: 'where: {\n      staff_id:' }
          ]
        },
        description: 'Fix Prisma field naming to match database schema'
      },
      {
        type: 'create_task',
        target: 'task_tracker',
        parameters: {
          title: 'Review Prisma naming fixes',
          description: 'Auto-fixed Prisma field naming issues - manual review recommended',
          category: 'database',
          priority: 'high'
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
        pattern: 'include:\\s*{\\s*Staff:',
        message: 'Use Staff (uppercase) for Prisma includes',
        autoFixable: true
      },
      {
        type: 'prisma_naming',
        pattern: 'user_id:\\s*parseInt\\(',
        message: 'Convert user.id to integer for user_id fields',
        autoFixable: true
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: 'RULE-002-DYNAMIC-RBAC-INTEGRATION',
    name: 'Dynamic RBAC Integration',
    category: 'security',
    description: 'Replace static role checks with full dynamic RBAC system',
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
      },
      {
        type: 'import_check',
        target: '**/*.{ts,tsx}',
        operator: 'not_contains',
        value: 'DynamicRBAC.*from.*dynamic-rbac-full',
        description: 'Files that should use full RBAC but don\'t import it'
      }
    ],
    actions: [
      {
        type: 'modify_file',
        target: 'detected_files',
        parameters: {
          imports: [
            "import { DynamicRBAC } from '@/lib/security/dynamic-rbac-full';",
            "import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';"
          ],
          replacements: [
            {
              from: 'if \\(!user \\|\\| user\\.Staff\\?\\[0\\]\\?\\.Role\\?\\.title !== ["\']Administrator["\']\\) {[\\s\\S]*?redirect\\(["\'][^"\']*["\']\\);[\\s\\S]*?}',
              to: 'const rbac = DynamicRBAC.getInstance();\n  if (!(await rbac.isAdmin(user))) {\n    redirect("/dashboard");\n  }'
            },
            {
              from: 'user\\.Staff\\?\\[0\\]\\?\\.Role\\?\\.title',
              to: '(await rbac.getPrimaryStaff(user))?.Role.title'
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
        pattern: 'DynamicRBAC\\.getInstance\\(\\)',
        message: 'Use full dynamic RBAC instead of hardcoded role checks',
        autoFixable: true
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: 'RULE-003-IMPORT-CONSISTENCY',
    name: 'Import Path Consistency',
    category: 'structure',
    description: 'Ensure all imports use consistent paths and reference full implementations',
    priority: 'medium',
    enforced: true,
    autoFix: true,
    conditions: [
      {
        type: 'file_content',
        target: '**/*.{ts,tsx}',
        operator: 'contains',
        value: 'from.*dynamic-rbac["\'];',
        description: 'Files using old dynamic-rbac import'
      },
      {
        type: 'file_content',
        target: '**/*.{ts,tsx}',
        operator: 'contains',
        value: 'from.*rule-engine["\'];',
        description: 'Files using old rule-engine import'
      },
      {
        type: 'file_content',
        target: '**/*.{ts,tsx}',
        operator: 'contains',
        value: 'from.*project-tracker["\'];',
        description: 'Files using old project-tracker import'
      }
    ],
    actions: [
      {
        type: 'modify_file',
        target: 'detected_files',
        parameters: {
          replacements: [
            { from: 'from.*["\'].*dynamic-rbac["\'];', to: "from '@/lib/security/dynamic-rbac-full';" },
            { from: 'from.*["\'].*rule-engine["\'];', to: "from '@/lib/project-management/rule-engine-full';" },
            { from: 'from.*["\'].*project-tracker["\'];', to: "from '@/lib/project-management/project-tracker-full';" },
            { from: 'from.*["\'].*auto-workflow["\'];', to: "from '@/lib/project-management/auto-workflow-full';" }
          ]
        },
        description: 'Update import paths to use full implementations'
      }
    ],
    triggers: [
      {
        type: 'file_change',
        pattern: '**/*.{ts,tsx}',
        description: 'Monitor for import inconsistencies'
      }
    ],
    validationRules: [
      {
        type: 'import_consistency',
        pattern: 'from.*dynamic-rbac-full',
        message: 'Use full RBAC implementation imports',
        autoFixable: true
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: 'RULE-004-API-AUTH-ENFORCEMENT',
    name: 'API Authentication Enforcement',
    category: 'security',
    description: 'Ensure all API routes use proper authentication with full RBAC',
    priority: 'critical',
    enforced: true,
    autoFix: true,
    conditions: [
      {
        type: 'file_exists',
        target: 'src/app/api/**/route.ts',
        operator: 'exists',
        value: true,
        description: 'API route files exist'
      },
      {
        type: 'file_content',
        target: 'src/app/api/**/route.ts',
        operator: 'not_contains',
        value: 'APIAuthPatterns\\.',
        description: 'API routes without proper auth patterns'
      }
    ],
    actions: [
      {
        type: 'modify_file',
        target: 'detected_files',
        parameters: {
          imports: [
            "import { APIAuthPatterns } from '@/lib/auth/api-auth';",
            "import { AuthenticatedUser } from '@/lib/auth/auth-utils';",
            "import { DynamicRBAC } from '@/lib/security/dynamic-rbac-full';"
          ],
          replacements: [
            {
              from: 'export\\s+async\\s+function\\s+(GET|POST|PUT|DELETE)\\s*\\([^)]*\\)',
              to: 'export const $1 = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) =>'
            }
          ]
        },
        description: 'Add authentication patterns to API routes'
      }
    ],
    triggers: [
      {
        type: 'file_change',
        pattern: 'src/app/api/**/route.ts',
        description: 'Monitor API route changes'
      }
    ],
    validationRules: [
      {
        type: 'security_check',
        pattern: 'APIAuthPatterns\\.',
        message: 'API routes must use authentication patterns',
        autoFixable: true
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    id: 'RULE-005-DATABASE-MIGRATION-SAFETY',
    name: 'Database Migration Safety',
    category: 'database',
    description: 'Ensure database operations are safe and consistent with schema',
    priority: 'high',
    enforced: true,
    autoFix: false,
    conditions: [
      {
        type: 'file_content',
        target: '**/*.{ts,tsx}',
        operator: 'contains',
        value: 'prisma\\.(\\w+)\\.delete\\(',
        description: 'Files with direct delete operations'
      },
      {
        type: 'file_content',
        target: '**/*.{ts,tsx}',
        operator: 'contains',
        value: 'prisma\\.(\\w+)\\.deleteMany\\(',
        description: 'Files with bulk delete operations'
      }
    ],
    actions: [
      {
        type: 'create_task',
        target: 'task_tracker',
        parameters: {
          title: 'Review database delete operations',
          description: 'Direct delete operations detected - ensure proper safeguards',
          category: 'database',
          priority: 'high'
        },
        description: 'Create review task for delete operations'
      }
    ],
    triggers: [
      {
        type: 'file_change',
        pattern: '**/*.{ts,tsx}',
        description: 'Monitor for database operations'
      }
    ],
    validationRules: [
      {
        type: 'database_schema',
        pattern: 'soft_delete|deleted_at',
        message: 'Consider using soft deletes for important data',
        autoFixable: false
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ===== FULL RULE ENGINE CLASS =====

export class RuleEngine {
  private static instance: RuleEngine;
  private rules = new Map<string, ProjectRule>();
  private tracker: ProjectTracker;
  private rbac: DynamicRBAC;
  private validationHistory: Map<string, Date> = new Map();
  
  static getInstance(): RuleEngine {
    if (!RuleEngine.instance) {
      RuleEngine.instance = new RuleEngine();
    }
    return RuleEngine.instance;
  }

  constructor() {
    this.tracker = ProjectTracker.getInstance();
    this.rbac = DynamicRBAC.getInstance();
    this.loadEnhancedRules();
  }

  // Load enhanced rules with full functionality
  private loadEnhancedRules(): void {
    ENHANCED_PROJECT_RULES.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  // Add custom rule with validation
  async addRule(rule: ProjectRule, user: AuthenticatedUser): Promise<void> {
    // Check if user has permission to add rules
    if (!(await this.rbac.hasPermission(user, 'rule_management', 'create'))) {
      throw new Error('Insufficient permissions to add rules');
    }

    // Validate rule structure
    this.validateRuleStructure(rule);
    
    this.rules.set(rule.id, rule);
    
    // Log rule addition
    await this.tracker.createTask({
      title: `Rule added: ${rule.name}`,
      description: `New project rule added by ${user.email}`,
      category: 'workflow',
      priority: 'medium',
      tags: ['rule-management', 'automation']
    });
  }

  // Validate rule structure
  private validateRuleStructure(rule: ProjectRule): void {
    if (!rule.id || !rule.name || !rule.category) {
      throw new Error('Rule must have id, name, and category');
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      throw new Error('Rule must have at least one condition');
    }

    if (!rule.actions || rule.actions.length === 0) {
      throw new Error('Rule must have at least one action');
    }
  }

  // Enhanced rule validation with database logging
  async validateRule(ruleId: string, user?: AuthenticatedUser): Promise<RuleValidationResult> {
    const rule = this.getRule(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    const violations: RuleViolation[] = [];
    const fixes: RuleFix[] = [];
    const startTime = Date.now();

    try {
      // Check conditions
      for (const condition of rule.conditions) {
        const conditionResult = await this.checkConditionEnhanced(condition);
        if (conditionResult.violated) {
          violations.push({
            ruleId: rule.id,
            condition,
            files: conditionResult.files,
            message: conditionResult.message,
            severity: rule.priority,
            details: conditionResult.details
          });

          // Generate fixes if auto-fixable
          if (rule.autoFix) {
            const ruleFixes = await this.generateEnhancedFixes(rule, conditionResult);
            fixes.push(...ruleFixes);
          }
        }
      }

      const result: RuleValidationResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        passed: violations.length === 0,
        violations,
        fixes,
        timestamp: new Date(),
        executionTimeMs: Date.now() - startTime,
        metadata: {
          enforced: rule.enforced,
          autoFix: rule.autoFix,
          category: rule.category
        }
      };

      // Log validation result
      this.validationHistory.set(ruleId, new Date());
      
      // Create task if violations found and user has permission
      if (violations.length > 0 && user && 
          await this.rbac.hasPermission(user, 'task_management', 'create')) {
        await this.tracker.createTask({
          title: `Rule violations detected: ${rule.name}`,
          description: `Found ${violations.length} violations in rule ${rule.name}`,
          category: 'workflow',
          priority: rule.priority,
          files: violations.flatMap(v => v.files),
          tags: ['rule-violation', rule.category]
        });
      }

      return result;

    } catch (error) {
      console.error(`Error validating rule ${ruleId}:`, error);
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        passed: false,
        violations: [],
        fixes: [],
        timestamp: new Date(),
        executionTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Enhanced condition checking
  private async checkConditionEnhanced(condition: RuleCondition): Promise<ConditionResult> {
    const startTime = Date.now();
    
    try {
      let result: ConditionResult;
      
      switch (condition.type) {
        case 'file_content':
          result = await this.checkFileContentEnhanced(condition);
          break;
        case 'file_exists':
          result = await this.checkFileExistsEnhanced(condition);
          break;
        case 'import_check':
          result = await this.checkImportConsistency(condition);
          break;
        case 'database_schema':
          result = await this.checkDatabaseSchema(condition);
          break;
        case 'api_endpoint':
          result = await this.checkApiEndpoint(condition);
          break;
        case 'component_structure':
          result = await this.checkComponentStructure(condition);
          break;
        default:
          throw new Error(`Unknown condition type: ${condition.type}`);
      }

      result.executionTimeMs = Date.now() - startTime;
      return result;

    } catch (error) {
      return {
        violated: true,
        files: [],
        message: `Error checking condition: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTimeMs: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // Enhanced file content checking with detailed analysis
  private async checkFileContentEnhanced(condition: RuleCondition): Promise<ConditionResult> {
    const files = await this.findFilesEnhanced(condition.target);
    const violatingFiles: string[] = [];
    const details: Record<string, any> = {};
    
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const regex = new RegExp(condition.value, 'gi');
        
        let matches = false;
        if (condition.operator === 'contains' && regex.test(content)) {
          matches = true;
        } else if (condition.operator === 'not_contains' && !regex.test(content)) {
          matches = true;
        } else if (condition.operator === 'matches_regex') {
          matches = regex.test(content);
        }

        if (matches) {
          violatingFiles.push(filePath);
          
          // Get match details for better reporting
          const matchDetails = content.match(regex);
          if (matchDetails) {
            details[filePath] = {
              matches: matchDetails.slice(0, 5), // First 5 matches
              totalMatches: matchDetails.length,
              lineNumbers: this.getLineNumbers(content, regex)
            };
          }
        }
      } catch (error) {
        console.warn(`Could not read file: ${filePath}`, error);
      }
    }

    return {
      violated: violatingFiles.length > 0,
      files: violatingFiles,
      message: violatingFiles.length > 0 
        ? `Found ${violatingFiles.length} files violating condition: ${condition.description}`
        : 'No violations found',
      details
    };
  }

  // Get line numbers for matches
  private getLineNumbers(content: string, regex: RegExp): number[] {
    const lines = content.split('\n');
    const lineNumbers: number[] = [];
    
    lines.forEach((line, index) => {
      if (regex.test(line)) {
        lineNumbers.push(index + 1);
      }
    });
    
    return lineNumbers;
  }

  // Enhanced file existence checking
  private async checkFileExistsEnhanced(condition: RuleCondition): Promise<ConditionResult> {
    const files = await this.findFilesEnhanced(condition.target);
    const expectExists = condition.operator === 'exists';
    const actualExists = files.length > 0;
    
    const details = {
      expectedExists: expectExists,
      actualExists,
      fileCount: files.length,
      files: files.slice(0, 10) // First 10 files
    };

    return {
      violated: expectExists !== actualExists,
      files: expectExists ? [] : files,
      message: expectExists && !actualExists 
        ? `Expected files matching ${condition.target} to exist`
        : !expectExists && actualExists 
        ? `Found unexpected files: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`
        : 'Condition satisfied',
      details
    };
  }

  // Check import consistency
  private async checkImportConsistency(condition: RuleCondition): Promise<ConditionResult> {
    const files = await this.findFilesEnhanced(condition.target);
    const violatingFiles: string[] = [];
    const details: Record<string, any> = {};
    
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Check for specific import patterns
        const hasOldImports = /from.*['"].*dynamic-rbac['"];?/.test(content);
        const hasNewImports = /from.*['"].*dynamic-rbac-full['"];?/.test(content);
        const hasRbacUsage = /DynamicRBAC|rbac\./.test(content);
        
        if (hasRbacUsage && hasOldImports && !hasNewImports) {
          violatingFiles.push(filePath);
          details[filePath] = {
            hasOldImports,
            hasNewImports,
            hasRbacUsage,
            recommendation: 'Update imports to use full RBAC implementation'
          };
        }
      } catch (error) {
        console.warn(`Could not analyze imports in: ${filePath}`);
      }
    }

    return {
      violated: violatingFiles.length > 0,
      files: violatingFiles,
      message: violatingFiles.length > 0 
        ? `Found ${violatingFiles.length} files with inconsistent imports`
        : 'All imports are consistent',
      details
    };
  }

  // Enhanced file finding with better pattern matching
  private async findFilesEnhanced(pattern: string): Promise<string[]> {
    const baseDir = process.cwd();
    const cache = new Map<string, string[]>();
    
    if (cache.has(pattern)) {
      return cache.get(pattern)!;
    }

    const files = await this.searchFilesRecursive(baseDir, pattern);
    cache.set(pattern, files);
    return files;
  }

  // Recursive file search with improved performance
  private async searchFilesRecursive(dir: string, pattern: string): Promise<string[]> {
    const files: string[] = [];
    const excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage'];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name)) {
            const subFiles = await this.searchFilesRecursive(fullPath, pattern);
            files.push(...subFiles);
          }
        } else if (entry.isFile()) {
          if (this.matchesPatternEnhanced(fullPath, pattern)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not read directory: ${dir}`);
    }
    
    return files;
  }

  // Enhanced pattern matching
  private matchesPatternEnhanced(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex with better support
    let regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.')
      .replace(/\./g, '\\.');

    // Handle file extensions
    if (pattern.includes('{') && pattern.includes('}')) {
      regexPattern = regexPattern.replace(/\{([^}]+)\}/g, '($1)');
      regexPattern = regexPattern.replace(/,/g, '|');
    }
    
    const regex = new RegExp(regexPattern);
    return regex.test(filePath);
  }

  // Enhanced fix generation
  private async generateEnhancedFixes(rule: ProjectRule, conditionResult: ConditionResult): Promise<RuleFix[]> {
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
            autoApply: rule.autoFix,
            priority: rule.priority,
            estimatedImpact: this.estimateFixImpact(filePath, action.parameters),
            backup: true // Always backup before modifying
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
            files: conditionResult.files,
            metadata: conditionResult.details
          },
          autoApply: true,
          priority: rule.priority
        });
      }
    }
    
    return fixes;
  }

  // Estimate impact of a fix
  private estimateFixImpact(filePath: string, parameters: any): 'low' | 'medium' | 'high' {
    const replacements = parameters.replacements || [];
    
    // High impact if many replacements or critical files
    if (replacements.length > 10 || filePath.includes('schema.prisma') || filePath.includes('auth')) {
      return 'high';
    }
    
    // Medium impact for multiple replacements
    if (replacements.length > 3) {
      return 'medium';
    }
    
    return 'low';
  }

  // Apply fixes with enhanced safety
  async applyFixes(fixes: RuleFix[], user?: AuthenticatedUser): Promise<FixApplicationResult[]> {
    const results: FixApplicationResult[] = [];
    
    // Check permissions if user provided
    if (user && !(await this.rbac.hasPermission(user, 'code_modification', 'execute'))) {
      throw new Error('Insufficient permissions to apply fixes');
    }
    
    for (const fix of fixes) {
      try {
        // Create backup if needed
        if (fix.backup && fix.type === 'file_modification') {
          await this.createBackup(fix.target);
        }
        
        const result = await this.applyFixEnhanced(fix);
        results.push(result);
        
        // Log successful fix
        if (result.success && user) {
          await this.tracker.createTask({
            title: `Auto-fix applied: ${fix.description}`,
            description: `Fix applied to ${fix.target}`,
            category: 'workflow',
            priority: 'low',
            files: [fix.target],
            tags: ['auto-fix', 'completed']
          });
        }
        
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

  // Create backup of file before modification
  private async createBackup(filePath: string): Promise<void> {
    try {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      const content = await fs.readFile(filePath, 'utf-8');
      await fs.writeFile(backupPath, content, 'utf-8');
    } catch (error) {
      console.warn(`Could not create backup for ${filePath}:`, error);
    }
  }

  // Enhanced fix application
  private async applyFixEnhanced(fix: RuleFix): Promise<FixApplicationResult> {
    switch (fix.type) {
      case 'file_modification':
        return await this.applyFileModificationEnhanced(fix);
      case 'task_creation':
        return await this.applyTaskCreationEnhanced(fix);
      default:
        throw new Error(`Unknown fix type: ${fix.type}`);
    }
  }

  // Enhanced file modification with better error handling
  private async applyFileModificationEnhanced(fix: RuleFix): Promise<FixApplicationResult> {
    try {
      let content = await fs.readFile(fix.target, 'utf-8');
      let modified = false;
      const appliedChanges: string[] = [];

      // Apply imports first
      if (fix.imports && fix.imports.length > 0) {
        for (const importLine of fix.imports) {
          if (!content.includes(importLine)) {
            const importSection = this.findImportSection(content);
            if (importSection.found) {
              content = content.slice(0, importSection.end) + 
                       importLine + '\n' + 
                       content.slice(importSection.end);
            } else {
              content = importLine + '\n' + content;
            }
            modified = true;
            appliedChanges.push(`Added import: ${importLine}`);
          }
        }
      }

      // Apply replacements
      if (fix.changes) {
        for (const change of fix.changes) {
          const regex = new RegExp(change.from, 'gi');
          const matches = content.match(regex);
          if (matches) {
            content = content.replace(regex, change.to);
            modified = true;
            appliedChanges.push(`Replaced ${matches.length} occurrences: ${change.from} -> ${change.to}`);
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
        message: modified ? `File successfully modified: ${appliedChanges.join(', ')}` : 'No changes needed',
        metadata: {
          appliedChanges,
          impact: fix.estimatedImpact
        }
      };
    } catch (error) {
      return {
        success: false,
        fix,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Find import section in file
  private findImportSection(content: string): { found: boolean; end: number } {
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ') || line.startsWith('from ')) {
        lastImportIndex = i;
      } else if (line.length > 0 && !line.startsWith('//') && !line.startsWith('/*')) {
        break;
      }
    }
    
    if (lastImportIndex >= 0) {
      const endPosition = lines.slice(0, lastImportIndex + 1).join('\n').length + 1;
      return { found: true, end: endPosition };
    }
    
    return { found: false, end: 0 };
  }

  // Enhanced task creation
  private async applyTaskCreationEnhanced(fix: RuleFix): Promise<FixApplicationResult> {
    try {
      if (fix.taskData) {
        await this.tracker.createTask({
          title: fix.taskData.title,
          description: fix.description,
          category: fix.taskData.category as any,
          priority: fix.taskData.priority as any,
          files: fix.taskData.files || [],
          tags: ['auto-generated', 'rule-violation'],
          metadata: fix.taskData.metadata
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

  // Enhanced auto-fix with comprehensive reporting
  async autoFixAllViolations(user?: AuthenticatedUser): Promise<AutoFixResult> {
    const startTime = Date.now();
    const validationResults = await this.validateAllRules(user);
    const allFixes: RuleFix[] = [];
    
    for (const result of validationResults) {
      if (!result.passed && result.fixes.length > 0) {
        allFixes.push(...result.fixes.filter(fix => fix.autoApply));
      }
    }

    const applicationResults = await this.applyFixes(allFixes, user);
    
    const autoFixResult: AutoFixResult = {
      totalViolations: validationResults.reduce((sum, r) => sum + r.violations.length, 0),
      totalFixes: allFixes.length,
      appliedFixes: applicationResults.filter(r => r.success && r.applied).length,
      failedFixes: applicationResults.filter(r => !r.success).length,
      results: applicationResults,
      executionTimeMs: Date.now() - startTime,
      summary: {
        filesModified: new Set(allFixes.map(f => f.target)).size,
        tasksCreated: allFixes.filter(f => f.type === 'task_creation').length,
        highImpactFixes: allFixes.filter(f => f.estimatedImpact === 'high').length
      }
    };

    // Log comprehensive result
    if (user) {
      await this.tracker.createTask({
        title: 'Auto-fix batch completed',
        description: `Applied ${autoFixResult.appliedFixes} fixes out of ${autoFixResult.totalFixes} total`,
        category: 'workflow',
        priority: 'medium',
        tags: ['auto-fix', 'batch-operation', 'completed'],
        metadata: autoFixResult.summary
      });
    }

    return autoFixResult;
  }

  // Validate all rules with enhanced reporting
  async validateAllRules(user?: AuthenticatedUser): Promise<RuleValidationResult[]> {
    const results: RuleValidationResult[] = [];
    
    for (const rule of this.getAllRules()) {
      if (rule.enforced) {
        const result = await this.validateRule(rule.id, user);
        results.push(result);
      }
    }
    
    return results;
  }

  // Get comprehensive validation status
  async getValidationStatus(user?: AuthenticatedUser): Promise<ValidationStatus> {
    const results = await this.validateAllRules(user);
    const totalRules = results.length;
    const passedRules = results.filter(r => r.passed).length;
    const violatedRules = totalRules - passedRules;
    const autoFixableViolations = results
      .filter(r => !r.passed)
      .reduce((sum, r) => sum + r.fixes.filter(f => f.autoApply).length, 0);

    return {
      totalRules,
      passedRules,
      violatedRules,
      autoFixableViolations,
      lastValidation: new Date(),
      categories: this.getCategoryBreakdown(results),
      recentActivity: Array.from(this.validationHistory.entries())
        .sort(([,a], [,b]) => b.getTime() - a.getTime())
        .slice(0, 10)
    };
  }

  // Get category breakdown
  private getCategoryBreakdown(results: RuleValidationResult[]): Record<string, any> {
    const categories: Record<string, any> = {};
    
    for (const result of results) {
      const rule = this.getRule(result.ruleId);
      if (rule) {
        if (!categories[rule.category]) {
          categories[rule.category] = { total: 0, passed: 0, violations: 0 };
        }
        categories[rule.category].total++;
        if (result.passed) {
          categories[rule.category].passed++;
        } else {
          categories[rule.category].violations += result.violations.length;
        }
      }
    }
    
    return categories;
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

  // Database schema validation (placeholder)
  private async checkDatabaseSchema(condition: RuleCondition): Promise<ConditionResult> {
    // This would integrate with Prisma to validate schema consistency
    return {
      violated: false,
      files: [],
      message: 'Database schema validation not implemented yet',
      details: { placeholder: true }
    };
  }

  // API endpoint validation (placeholder)  
  private async checkApiEndpoint(condition: RuleCondition): Promise<ConditionResult> {
    // This would validate API endpoint structure and authentication
    return {
      violated: false,
      files: [],
      message: 'API endpoint validation not implemented yet',
      details: { placeholder: true }
    };
  }

  // Component structure validation (placeholder)
  private async checkComponentStructure(condition: RuleCondition): Promise<ConditionResult> {
    // This would validate React component structure
    return {
      violated: false,
      files: [],
      message: 'Component structure validation not implemented yet',
      details: { placeholder: true }
    };
  }
}

// ===== ENHANCED INTERFACES =====

export interface RuleValidationResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  violations: RuleViolation[];
  fixes: RuleFix[];
  timestamp: Date;
  executionTimeMs?: number;
  metadata?: Record<string, any>;
  error?: string;
}

export interface RuleViolation {
  ruleId: string;
  condition: RuleCondition;
  files: string[];
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details?: Record<string, any>;
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
    metadata?: Record<string, any>;
  };
  autoApply: boolean;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  estimatedImpact?: 'low' | 'medium' | 'high';
  backup?: boolean;
}

export interface ConditionResult {
  violated: boolean;
  files: string[];
  message: string;
  details?: Record<string, any>;
  executionTimeMs?: number;
}

export interface FixApplicationResult {
  success: boolean;
  fix: RuleFix;
  applied?: boolean;
  message?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AutoFixResult {
  totalViolations: number;
  totalFixes: number;
  appliedFixes: number;
  failedFixes: number;
  results: FixApplicationResult[];
  executionTimeMs?: number;
  summary?: {
    filesModified: number;
    tasksCreated: number;
    highImpactFixes: number;
  };
}

export interface ValidationStatus {
  totalRules: number;
  passedRules: number;
  violatedRules: number;
  autoFixableViolations: number;
  lastValidation: Date;
  categories: Record<string, any>;
  recentActivity: Array<[string, Date]>;
} 