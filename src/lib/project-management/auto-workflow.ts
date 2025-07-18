/**
 * AUTOMATIC WORKFLOW SYSTEM
 * 
 * Bu sistem dosya değişikliklerini izler ve otomatik olarak:
 * 1. Kuralları kontrol eder
 * 2. Gerekli düzeltmeleri yapar
 * 3. Görev oluşturur
 * 4. Kod standardizasyonu yapar
 */

import { RuleEngine } from './rule-engine';
import { CodeGenerator } from './code-generator';
import { ProjectTracker } from './project-tracker';
import * as fs from 'fs/promises';
import * as path from 'path';
// File watching temporarily disabled - will implement later
// import * as chokidar from 'chokidar';

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  priority: number;
}

export interface WorkflowTrigger {
  type: 'file_created' | 'file_modified' | 'file_deleted' | 'git_commit' | 'manual';
  pattern?: string;
  excludePatterns?: string[];
  debounceMs?: number;
}

export interface WorkflowCondition {
  type: 'file_extension' | 'file_content' | 'file_size' | 'git_status' | 'rule_violation';
  operator: 'equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'matches_regex';
  value: any;
  description: string;
}

export interface WorkflowAction {
  type: 'validate_rules' | 'auto_fix' | 'generate_code' | 'create_task' | 'run_command' | 'notify';
  parameters: Record<string, any>;
  description: string;
  async: boolean;
}

// ===== PREDEFINED WORKFLOW RULES =====

export const WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: 'WORKFLOW-001-PRISMA-AUTO-FIX',
    name: 'Auto-fix Prisma Field Naming',
    description: 'Automatically fix Prisma field naming issues when TypeScript files are modified',
    trigger: {
      type: 'file_modified',
      pattern: '**/*.{ts,tsx}',
      excludePatterns: ['node_modules/**', '.next/**', 'dist/**'],
      debounceMs: 1000
    },
    conditions: [
      {
        type: 'file_content',
        operator: 'contains',
        value: 'include.*staff.*{',
        description: 'File contains Prisma include with lowercase staff'
      }
    ],
    actions: [
      {
        type: 'validate_rules',
        parameters: { ruleIds: ['RULE-001-PRISMA-NAMING'] },
        description: 'Validate Prisma naming rules',
        async: false
      },
      {
        type: 'auto_fix',
        parameters: { 
          ruleIds: ['RULE-001-PRISMA-NAMING'],
          autoApplyFixes: true
        },
        description: 'Auto-fix Prisma naming violations',
        async: false
      },
      {
        type: 'notify',
        parameters: {
          message: 'Auto-fixed Prisma field naming issues',
          type: 'success'
        },
        description: 'Notify about auto-fix',
        async: false
      }
    ],
    enabled: true,
    priority: 1
  },

  {
    id: 'WORKFLOW-002-NEW-PAGE-STANDARDIZE',
    name: 'Standardize New Page Components',
    description: 'Automatically standardize new page components when created',
    trigger: {
      type: 'file_created',
      pattern: 'src/app/**/page.tsx',
      excludePatterns: ['node_modules/**'],
      debounceMs: 500
    },
    conditions: [
      {
        type: 'file_extension',
        operator: 'equals',
        value: '.tsx',
        description: 'File is a TypeScript React component'
      }
    ],
    actions: [
      {
        type: 'validate_rules',
        parameters: { ruleIds: ['RULE-005-PAGE-STRUCTURE'] },
        description: 'Validate page structure',
        async: false
      },
      {
        type: 'auto_fix',
        parameters: { 
          ruleIds: ['RULE-005-PAGE-STRUCTURE'],
          autoApplyFixes: true 
        },
        description: 'Apply page structure fixes',
        async: false
      },
      {
        type: 'create_task',
        parameters: {
          title: 'Review new page component',
          description: 'New page component created and auto-standardized',
          category: 'ui-ux',
          priority: 'medium'
        },
        description: 'Create review task',
        async: true
      }
    ],
    enabled: true,
    priority: 2
  },

  {
    id: 'WORKFLOW-003-API-ROUTE-STANDARDIZE',
    name: 'Standardize New API Routes',
    description: 'Automatically standardize new API routes when created',
    trigger: {
      type: 'file_created',
      pattern: 'src/app/api/**/route.ts',
      excludePatterns: ['node_modules/**'],
      debounceMs: 500
    },
    conditions: [
      {
        type: 'file_extension',
        operator: 'equals',
        value: '.ts',
        description: 'File is a TypeScript file'
      }
    ],
    actions: [
      {
        type: 'validate_rules',
        parameters: { ruleIds: ['RULE-004-API-STRUCTURE'] },
        description: 'Validate API structure',
        async: false
      },
      {
        type: 'auto_fix',
        parameters: { 
          ruleIds: ['RULE-004-API-STRUCTURE'],
          autoApplyFixes: true 
        },
        description: 'Apply API structure fixes',
        async: false
      },
      {
        type: 'create_task',
        parameters: {
          title: 'Review new API endpoint',
          description: 'New API endpoint created and auto-standardized',
          category: 'api',
          priority: 'medium'
        },
        description: 'Create review task',
        async: true
      }
    ],
    enabled: true,
    priority: 2
  },

  {
    id: 'WORKFLOW-004-COMPONENT-STANDARDIZE',
    name: 'Standardize New Components',
    description: 'Automatically standardize new UI components when created',
    trigger: {
      type: 'file_created',
      pattern: 'src/components/**/*.tsx',
      excludePatterns: ['node_modules/**'],
      debounceMs: 500
    },
    conditions: [
      {
        type: 'file_extension',
        operator: 'equals',
        value: '.tsx',
        description: 'File is a TypeScript React component'
      }
    ],
    actions: [
      {
        type: 'validate_rules',
        parameters: { ruleIds: ['RULE-003-COMPONENT-STRUCTURE'] },
        description: 'Validate component structure',
        async: false
      },
      {
        type: 'auto_fix',
        parameters: { 
          ruleIds: ['RULE-003-COMPONENT-STRUCTURE'],
          autoApplyFixes: true 
        },
        description: 'Apply component structure fixes',
        async: false
      }
    ],
    enabled: true,
    priority: 3
  },

  {
    id: 'WORKFLOW-005-GLOBAL-RULE-CHECK',
    name: 'Global Rule Validation',
    description: 'Run global rule validation on any TypeScript file change',
    trigger: {
      type: 'file_modified',
      pattern: 'src/**/*.{ts,tsx}',
      excludePatterns: ['node_modules/**', '.next/**', 'dist/**'],
      debounceMs: 2000
    },
    conditions: [],
    actions: [
      {
        type: 'validate_rules',
        parameters: { 
          ruleIds: [
            'RULE-001-PRISMA-NAMING',
            'RULE-002-DYNAMIC-RBAC',
            'RULE-003-COMPONENT-STRUCTURE',
            'RULE-004-API-STRUCTURE',
            'RULE-005-PAGE-STRUCTURE'
          ]
        },
        description: 'Validate all core rules',
        async: true
      }
    ],
    enabled: true,
    priority: 10
  }
];

// ===== WORKFLOW ENGINE CLASS =====

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private rules = new Map<string, WorkflowRule>();
  private ruleEngine: RuleEngine;
  private codeGenerator: CodeGenerator;
  private projectTracker: ProjectTracker;
  private watcher?: chokidar.FSWatcher;
  private isWatching = false;
  private pendingActions = new Map<string, NodeJS.Timeout>();

  static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  constructor() {
    this.ruleEngine = RuleEngine.getInstance();
    this.codeGenerator = CodeGenerator.getInstance();
    this.projectTracker = ProjectTracker.getInstance();
    this.loadWorkflowRules();
  }

  // Load predefined workflow rules
  private loadWorkflowRules(): void {
    WORKFLOW_RULES.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  // Start file watching
  async startWatching(projectRoot: string = process.cwd()): Promise<void> {
    if (this.isWatching) {
      return;
    }

    console.log('🔄 Starting workflow engine file watcher...');

    this.watcher = chokidar.watch(projectRoot, {
      ignored: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/.git/**',
        '**/coverage/**'
      ],
      ignoreInitial: true,
      persistent: true
    });

    // File created
    this.watcher.on('add', (filePath) => {
      this.handleFileEvent('file_created', filePath);
    });

    // File modified
    this.watcher.on('change', (filePath) => {
      this.handleFileEvent('file_modified', filePath);
    });

    // File deleted
    this.watcher.on('unlink', (filePath) => {
      this.handleFileEvent('file_deleted', filePath);
    });

    this.isWatching = true;
    console.log('✅ Workflow engine is now watching for file changes');
  }

  // Stop file watching
  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }
    this.isWatching = false;
    
    // Clear pending actions
    this.pendingActions.forEach(timeout => clearTimeout(timeout));
    this.pendingActions.clear();
    
    console.log('🛑 Workflow engine stopped watching');
  }

  // Handle file events
  private handleFileEvent(eventType: 'file_created' | 'file_modified' | 'file_deleted', filePath: string): void {
    const applicableRules = this.findApplicableRules(eventType, filePath);
    
    for (const rule of applicableRules) {
      if (rule.enabled) {
        this.scheduleRuleExecution(rule, filePath);
      }
    }
  }

  // Find applicable rules for file event
  private findApplicableRules(eventType: string, filePath: string): WorkflowRule[] {
    return Array.from(this.rules.values()).filter(rule => {
      // Check trigger type
      if (rule.trigger.type !== eventType) {
        return false;
      }

      // Check pattern match
      if (rule.trigger.pattern && !this.matchesPattern(filePath, rule.trigger.pattern)) {
        return false;
      }

      // Check exclude patterns
      if (rule.trigger.excludePatterns) {
        for (const excludePattern of rule.trigger.excludePatterns) {
          if (this.matchesPattern(filePath, excludePattern)) {
            return false;
          }
        }
      }

      return true;
    });
  }

  // Pattern matching (simple glob)
  private matchesPattern(filePath: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.')
      .replace(/\./g, '\\.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  // Schedule rule execution with debouncing
  private scheduleRuleExecution(rule: WorkflowRule, filePath: string): void {
    const key = `${rule.id}_${filePath}`;
    
    // Clear existing timeout
    if (this.pendingActions.has(key)) {
      clearTimeout(this.pendingActions.get(key)!);
    }

    // Schedule new execution
    const timeout = setTimeout(async () => {
      this.pendingActions.delete(key);
      await this.executeRule(rule, filePath);
    }, rule.trigger.debounceMs || 1000);

    this.pendingActions.set(key, timeout);
  }

  // Execute workflow rule
  private async executeRule(rule: WorkflowRule, filePath: string): Promise<void> {
    try {
      console.log(`🔄 Executing workflow rule: ${rule.name} for ${filePath}`);

      // Check conditions
      const conditionsMet = await this.checkConditions(rule.conditions, filePath);
      if (!conditionsMet) {
        console.log(`⏭️  Conditions not met for rule: ${rule.name}`);
        return;
      }

      // Execute actions
      for (const action of rule.actions) {
        if (action.async) {
          // Execute async actions without waiting
          this.executeAction(action, filePath, rule).catch(error => {
            console.error(`Error executing async action: ${action.type}`, error);
          });
        } else {
          // Execute sync actions and wait
          await this.executeAction(action, filePath, rule);
        }
      }

      console.log(`✅ Completed workflow rule: ${rule.name}`);

    } catch (error) {
      console.error(`❌ Error executing workflow rule ${rule.name}:`, error);
    }
  }

  // Check if conditions are met
  private async checkConditions(conditions: WorkflowCondition[], filePath: string): Promise<boolean> {
    if (conditions.length === 0) {
      return true;
    }

    for (const condition of conditions) {
      const result = await this.checkCondition(condition, filePath);
      if (!result) {
        return false;
      }
    }

    return true;
  }

  // Check single condition
  private async checkCondition(condition: WorkflowCondition, filePath: string): Promise<boolean> {
    try {
      switch (condition.type) {
        case 'file_extension':
          const ext = path.extname(filePath);
          return this.compareValues(ext, condition.operator, condition.value);

        case 'file_content':
          const content = await fs.readFile(filePath, 'utf-8');
          return this.compareValues(content, condition.operator, condition.value);

        case 'file_size':
          const stats = await fs.stat(filePath);
          return this.compareValues(stats.size, condition.operator, condition.value);

        case 'rule_violation':
          // Check if specific rule is violated
          const ruleResult = await this.ruleEngine.validateRule(condition.value);
          return !ruleResult.passed;

        default:
          console.warn(`Unknown condition type: ${condition.type}`);
          return true;
      }
    } catch (error) {
      console.warn(`Error checking condition: ${condition.type}`, error);
      return false;
    }
  }

  // Compare values based on operator
  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'contains':
        return String(actual).includes(String(expected));
      case 'not_contains':
        return !String(actual).includes(String(expected));
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      case 'matches_regex':
        const regex = new RegExp(expected);
        return regex.test(String(actual));
      default:
        return true;
    }
  }

  // Execute workflow action
  private async executeAction(action: WorkflowAction, filePath: string, rule: WorkflowRule): Promise<void> {
    try {
      switch (action.type) {
        case 'validate_rules':
          await this.executeValidateRules(action, filePath);
          break;

        case 'auto_fix':
          await this.executeAutoFix(action, filePath);
          break;

        case 'generate_code':
          await this.executeGenerateCode(action, filePath);
          break;

        case 'create_task':
          await this.executeCreateTask(action, filePath);
          break;

        case 'run_command':
          await this.executeRunCommand(action, filePath);
          break;

        case 'notify':
          await this.executeNotify(action, filePath);
          break;

        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
    }
  }

  // Execute validate rules action
  private async executeValidateRules(action: WorkflowAction, filePath: string): Promise<void> {
    const ruleIds = action.parameters.ruleIds as string[];
    
    for (const ruleId of ruleIds) {
      await this.ruleEngine.validateRule(ruleId);
    }
  }

  // Execute auto-fix action
  private async executeAutoFix(action: WorkflowAction, filePath: string): Promise<void> {
    const ruleIds = action.parameters.ruleIds as string[];
    const autoApplyFixes = action.parameters.autoApplyFixes as boolean;

    for (const ruleId of ruleIds) {
      const result = await this.ruleEngine.validateRule(ruleId);
      
      if (!result.passed && result.fixes.length > 0 && autoApplyFixes) {
        const autoFixes = result.fixes.filter(fix => fix.autoApply);
        if (autoFixes.length > 0) {
          await this.ruleEngine.applyFixes(autoFixes);
          console.log(`🔧 Auto-applied ${autoFixes.length} fixes for rule ${ruleId}`);
        }
      }
    }
  }

  // Execute generate code action
  private async executeGenerateCode(action: WorkflowAction, filePath: string): Promise<void> {
    // Implementation for code generation based on action parameters
    console.log(`📝 Code generation requested for ${filePath}`);
  }

  // Execute create task action
  private async executeCreateTask(action: WorkflowAction, filePath: string): Promise<void> {
    await this.projectTracker.createTask({
      title: action.parameters.title,
      description: `${action.parameters.description}\n\nTriggered by: ${filePath}`,
      category: action.parameters.category,
      priority: action.parameters.priority,
      files: [filePath],
      tags: ['auto-generated', 'workflow']
    });

    console.log(`📋 Created task: ${action.parameters.title}`);
  }

  // Execute run command action
  private async executeRunCommand(action: WorkflowAction, filePath: string): Promise<void> {
    const command = action.parameters.command as string;
    console.log(`⚡ Running command: ${command}`);
    
    // Implementation for running shell commands
    // const { exec } = require('child_process');
    // exec(command, (error, stdout, stderr) => { ... });
  }

  // Execute notify action
  private async executeNotify(action: WorkflowAction, filePath: string): Promise<void> {
    const message = action.parameters.message as string;
    const type = action.parameters.type as string;
    
    console.log(`🔔 ${type.toUpperCase()}: ${message} (${filePath})`);
  }

  // Manual trigger workflow rule
  async triggerRule(ruleId: string, filePath?: string): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Workflow rule ${ruleId} not found`);
    }

    await this.executeRule(rule, filePath || '');
  }

  // Get all workflow rules
  getAllRules(): WorkflowRule[] {
    return Array.from(this.rules.values());
  }

  // Get enabled workflow rules
  getEnabledRules(): WorkflowRule[] {
    return this.getAllRules().filter(rule => rule.enabled);
  }

  // Enable/disable workflow rule
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      console.log(`${enabled ? '✅' : '❌'} Workflow rule ${rule.name} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
} 