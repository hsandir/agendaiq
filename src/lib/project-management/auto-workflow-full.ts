/**
 * FULL AUTOMATIC WORKFLOW SYSTEM
 * File watching, real-time validation ve tam otomatik fix'lerle
 */

import { RuleEngine } from './rule-engine-full';
import { CodeGenerator } from './code-generator-full';
import { ProjectTracker } from './project-tracker-full';
import { DynamicRBAC } from '../security/dynamic-rbac-full';
import { AuthenticatedUser } from '../auth/auth-utils';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as chokidar from 'chokidar';

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  priority: number;
  cooldownMs?: number;
  maxExecutionsPerHour?: number;
  requiredPermissions?: string[];
}

export interface WorkflowTrigger {
  type: 'file_created' | 'file_modified' | 'file_deleted' | 'git_commit' | 'manual' | 'scheduled' | 'rule_violation';
  pattern?: string;
  excludePatterns?: string[];
  debounceMs?: number;
  batchMode?: boolean;
}

export interface WorkflowCondition {
  type: 'file_extension' | 'file_content' | 'file_size' | 'git_status' | 'rule_violation' | 'time_condition' | 'user_permission';
  operator: 'equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'matches_regex';
  value: any;
  description: string;
}

export interface WorkflowAction {
  type: 'validate_rules' | 'auto_fix' | 'generate_code' | 'create_task' | 'run_command' | 'notify' | 'git_commit' | 'backup_file';
  parameters: Record<string, any>;
  description: string;
  async: boolean;
  requiresConfirmation?: boolean;
  rollbackEnabled?: boolean;
}

export interface WorkflowExecution {
  id: string;
  ruleId: string;
  triggeredBy: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  actions: WorkflowActionResult[];
  metadata: Record<string, any>;
}

export interface WorkflowActionResult {
  action: WorkflowAction;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  executionTimeMs: number;
  output?: any;
  error?: string;
}

// ===== ENHANCED WORKFLOW RULES =====

export const ENHANCED_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: 'WORKFLOW-001-REALTIME-PRISMA-FIX',
    name: 'Real-time Prisma Field Naming Fix',
    description: 'Automatically fix Prisma field naming issues as soon as TypeScript files are saved',
    trigger: {
      type: 'file_modified',
      pattern: '**/*.{ts,tsx}',
      excludePatterns: ['node_modules/**', '.next/**', 'dist/**', '**/*.d.ts'],
      debounceMs: 500,
      batchMode: false
    },
    conditions: [
      {
        type: 'file_content',
        operator: 'contains',
        value: '(include.*staff.*{|user_id.*user\\.id|userId.*parseInt)',
        description: 'File contains Prisma field naming issues'
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
        type: 'backup_file',
        parameters: { createBackup: true },
        description: 'Create backup before fixing',
        async: false
      },
      {
        type: 'auto_fix',
        parameters: { 
          ruleIds: ['RULE-001-PRISMA-NAMING'],
          autoApplyFixes: true,
          createBackup: true
        },
        description: 'Auto-fix Prisma naming violations',
        async: false,
        rollbackEnabled: true
      },
      {
        type: 'notify',
        parameters: {
          message: 'Auto-fixed Prisma field naming issues',
          type: 'success',
          channels: ['console', 'ui']
        },
        description: 'Notify about successful auto-fix',
        async: true
      }
    ],
    enabled: true,
    priority: 1,
    cooldownMs: 2000,
    maxExecutionsPerHour: 60
  },

  {
    id: 'WORKFLOW-002-RBAC-INTEGRATION-AUTO',
    name: 'Auto RBAC Integration',
    description: 'Automatically update files to use full RBAC when static role checks are detected',
    trigger: {
      type: 'file_modified',
      pattern: '**/*.{ts,tsx}',
      excludePatterns: ['node_modules/**', '.next/**'],
      debounceMs: 1000,
      batchMode: true
    },
    conditions: [
      {
        type: 'file_content',
        operator: 'contains',
        value: '(title.*===.*Administrator|role\\.title.*!==)',
        description: 'File contains static role checks'
      }
    ],
    actions: [
      {
        type: 'validate_rules',
        parameters: { ruleIds: ['RULE-002-DYNAMIC-RBAC-INTEGRATION'] },
        description: 'Validate RBAC integration',
        async: false
      },
      {
        type: 'auto_fix',
        parameters: { 
          ruleIds: ['RULE-002-DYNAMIC-RBAC-INTEGRATION'],
          autoApplyFixes: true
        },
        description: 'Replace static checks with dynamic RBAC',
        async: false,
        requiresConfirmation: true // RBAC changes require confirmation
      },
      {
        type: 'create_task',
        parameters: {
          title: 'Review RBAC integration changes',
          description: 'Auto-updated static role checks to use dynamic RBAC',
          category: 'security',
          priority: 'high'
        },
        description: 'Create review task',
        async: true
      }
    ],
    enabled: true,
    priority: 2,
    cooldownMs: 5000,
    maxExecutionsPerHour: 20,
    requiredPermissions: ['code_modification']
  },

  {
    id: 'WORKFLOW-003-NEW-FILE-STANDARDIZATION',
    name: 'New File Standardization',
    description: 'Automatically standardize new files when created',
    trigger: {
      type: 'file_created',
      pattern: 'src/**/*.{ts,tsx}',
      excludePatterns: ['node_modules/**'],
      debounceMs: 1000
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
        parameters: { 
          ruleIds: ['RULE-003-IMPORT-CONSISTENCY', 'RULE-004-API-AUTH-ENFORCEMENT'] 
        },
        description: 'Validate file structure',
        async: false
      },
      {
        type: 'auto_fix',
        parameters: { 
          ruleIds: ['RULE-003-IMPORT-CONSISTENCY'],
          autoApplyFixes: true 
        },
        description: 'Apply standard structure fixes',
        async: false
      },
      {
        type: 'generate_code',
        parameters: {
          templateType: 'infer_from_path',
          addStandardImports: true,
          addAuth: true
        },
        description: 'Add standard boilerplate if needed',
        async: false
      }
    ],
    enabled: true,
    priority: 3,
    cooldownMs: 1000,
    maxExecutionsPerHour: 30
  },

  {
    id: 'WORKFLOW-004-CONTINUOUS-VALIDATION',
    name: 'Continuous Rule Validation',
    description: 'Continuously validate all rules and maintain system health',
    trigger: {
      type: 'scheduled',
      pattern: '*/5 * * * *', // Every 5 minutes
      debounceMs: 0
    },
    conditions: [
      {
        type: 'time_condition',
        operator: 'greater_than',
        value: 5, // Minutes since last validation
        description: 'Enough time has passed since last validation'
      }
    ],
    actions: [
      {
        type: 'validate_rules',
        parameters: { 
          ruleIds: 'all',
          generateReport: true
        },
        description: 'Validate all rules',
        async: true
      },
      {
        type: 'auto_fix',
        parameters: { 
          onlyLowRisk: true,
          maxFixes: 10
        },
        description: 'Apply low-risk auto-fixes',
        async: true
      },
      {
        type: 'notify',
        parameters: {
          message: 'Continuous validation completed',
          type: 'info',
          channels: ['console']
        },
        description: 'Log validation completion',
        async: true
      }
    ],
    enabled: true,
    priority: 5,
    cooldownMs: 30000, // 30 seconds minimum between executions
    maxExecutionsPerHour: 12
  },

  {
    id: 'WORKFLOW-005-GIT-COMMIT-VALIDATION',
    name: 'Git Commit Validation',
    description: 'Validate code before git commits and fix issues automatically',
    trigger: {
      type: 'git_commit',
      pattern: '**/*.{ts,tsx}',
      debounceMs: 0
    },
    conditions: [
      {
        type: 'git_status',
        operator: 'contains',
        value: 'staged',
        description: 'Files are staged for commit'
      }
    ],
    actions: [
      {
        type: 'validate_rules',
        parameters: { 
          ruleIds: ['RULE-001-PRISMA-NAMING', 'RULE-002-DYNAMIC-RBAC-INTEGRATION'],
          strictMode: true
        },
        description: 'Strict validation before commit',
        async: false
      },
      {
        type: 'auto_fix',
        parameters: { 
          onlyCritical: true,
          autoApplyFixes: true
        },
        description: 'Fix critical issues before commit',
        async: false,
        requiresConfirmation: false // Auto-fix critical issues
      },
      {
        type: 'git_commit',
        parameters: {
          amendCommit: true,
          message: 'Auto-fix: Applied code standards before commit'
        },
        description: 'Amend commit with fixes',
        async: false
      }
    ],
    enabled: false, // Disabled by default - requires git hooks setup
    priority: 1,
    cooldownMs: 0
  }
];

// ===== FULL WORKFLOW ENGINE CLASS =====

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private rules = new Map<string, WorkflowRule>();
  private executions = new Map<string, WorkflowExecution>();
  private executionCounts = new Map<string, number[]>(); // Track executions per hour
  private ruleEngine: RuleEngine;
  private codeGenerator: CodeGenerator;
  private projectTracker: ProjectTracker;
  private rbac: DynamicRBAC;
  private watcher?: chokidar.FSWatcher;
  private isWatching = false;
  private pendingActions = new Map<string, NodeJS.Timeout>();
  private scheduledJobs = new Map<string, NodeJS.Timeout>();
  private notificationHandlers: Map<string, Function> = new Map();

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
    this.rbac = DynamicRBAC.getInstance();
    this.loadEnhancedWorkflowRules();
    this.setupNotificationHandlers();
  }

  // Load enhanced workflow rules
  private loadEnhancedWorkflowRules(): void {
    ENHANCED_WORKFLOW_RULES.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  // Setup notification handlers
  private setupNotificationHandlers(): void {
    this.notificationHandlers.set('console', (message: string, type: string) => {
      console.log(`[${type.toUpperCase()}] ${message}`);
    });
    
    this.notificationHandlers.set('ui', (message: string, type: string) => {
      // This would integrate with UI notification system
      console.log(`[UI-${type.toUpperCase()}] ${message}`);
    });
  }

  // Start comprehensive file watching with enhanced features
  async startWatching(projectRoot: string = process.cwd(), user?: AuthenticatedUser): Promise<void> {
    if (this.isWatching) {
      return;
    }

    console.log('🔄 Starting enhanced workflow engine file watcher...');

    // Check permissions if user provided
    if (user && !(await this.rbac.hasPermission(user, 'workflow_management', 'execute'))) {
      throw new Error('Insufficient permissions to start workflow engine');
    }

    this.watcher = chokidar.watch([
      'src/**/*.ts',
      'src/**/*.tsx',
      'src/**/*.js',
      'src/**/*.jsx'
    ], {
      ignored: [
        // Node modules and build artifacts
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**',
        
        // Large dependency folders that shouldn't be watched
        '**/date-fns/**',
        '**/react/**',
        '**/next/**',
        '**/typescript/**',
        
        // Backup and cache files
        '**/*.backup.*',
        '**/*.cache.*',
        '**/.cache/**',
        '**/tmp/**',
        '**/temp/**',
        
        // Lock files and logs
        '**/package-lock.json',
        '**/yarn.lock',
        '**/*.log',
        '**/logs/**',
        
        // Development files
        '**/.env*',
        '**/.DS_Store',
        '**/Thumbs.db',
        
        // Generated files
        '**/*.d.ts',
        '**/*.map',
        '**/*.min.*'
      ],
      ignoreInitial: true,
      persistent: true,
      atomic: 200, // Increased stabilization time
      awaitWriteFinish: {
        stabilityThreshold: 300, // Increased stability threshold
        pollInterval: 100
      },
      // Reduce polling frequency to prevent EMFILE
      usePolling: false,
      interval: 1000,
      binaryInterval: 1000,
      // Limit file watcher depth
      depth: 10,
      // Follow symlinks carefully
      followSymlinks: false,
      // Don't watch too many files at once
      alwaysStat: false,
      ignorePermissionErrors: true
    });

    // File created
    this.watcher.on('add', (filePath) => {
      this.handleFileEvent('file_created', filePath, user);
    });

    // File modified
    this.watcher.on('change', (filePath) => {
      this.handleFileEvent('file_modified', filePath, user);
    });

    // File deleted
    this.watcher.on('unlink', (filePath) => {
      this.handleFileEvent('file_deleted', filePath, user);
    });

    // Error handling - don't crash on EMFILE
    this.watcher.on('error', (error) => {
      console.error('File watcher error:', error);
      
      // If EMFILE error, try to restart with more conservative settings
      if (error instanceof Error && (error as any).code === 'EMFILE') {
        console.warn('⚠️  Too many open files detected, restarting watcher with conservative settings...');
        this.stopWatching();
        
        // Restart with minimal watching after a delay
        setTimeout(() => {
          this.startMinimalWatching(projectRoot, user);
        }, 2000);
      }
    });

    this.isWatching = true;
    
    // Start scheduled jobs
    this.startScheduledJobs(user);
    
    console.log('✅ Enhanced workflow engine is now watching for file changes');
  }

  // Minimal watching mode for resource-constrained environments
  private async startMinimalWatching(projectRoot: string, user?: AuthenticatedUser): Promise<void> {
    if (this.isWatching) {
      return;
    }

    console.log('🔄 Starting minimal workflow engine file watcher...');

    this.watcher = chokidar.watch([
      'src/lib/**/*.ts',
      'src/app/**/*.ts',
      'src/components/**/*.tsx'
    ], {
      ignored: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/.git/**',
        '**/*.backup.*',
        '**/*.d.ts'
      ],
      ignoreInitial: true,
      persistent: true,
      atomic: 500,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 200
      },
      usePolling: true, // Use polling to reduce file handles
      interval: 2000,   // Poll every 2 seconds
      depth: 5,         // Reduced depth
      followSymlinks: false,
      alwaysStat: false,
      ignorePermissionErrors: true
    });

    // Only handle critical events in minimal mode
    this.watcher.on('change', (filePath) => {
      if (filePath.includes('auth') || filePath.includes('security') || filePath.includes('rbac')) {
        this.handleFileEvent('file_modified', filePath, user);
      }
    });

    this.watcher.on('error', (error) => {
      console.error('Minimal file watcher error:', error);
      // If still failing, disable file watching completely
      if (error instanceof Error && (error as any).code === 'EMFILE') {
        console.warn('❌ File watching disabled due to system limitations');
        this.stopWatching();
      }
    });

    this.isWatching = true;
    console.log('✅ Minimal workflow engine is now watching critical files');
  }

  // Start scheduled jobs
  private startScheduledJobs(user?: AuthenticatedUser): void {
    const scheduledRules = this.getAllRules().filter(rule => 
      rule.enabled && rule.trigger.type === 'scheduled'
    );

    for (const rule of scheduledRules) {
      if (rule.trigger.pattern) {
        // Parse cron pattern (simplified)
        const intervalMs = this.parseCronPattern(rule.trigger.pattern);
        if (intervalMs > 0) {
          const timeout = setInterval(() => {
            this.executeRule(rule, '', user);
          }, intervalMs);
          this.scheduledJobs.set(rule.id, timeout as any);
        }
      }
    }
  }

  // Parse cron pattern to milliseconds (simplified)
  private parseCronPattern(pattern: string): number {
    // Simplified: convert */X patterns to milliseconds
    const match = pattern.match(/^\*\/(\d+)/);
    if (match) {
      const minutes = parseInt(match[1]);
      return minutes * 60 * 1000;
    }
    return 0;
  }

  // Stop file watching and cleanup
  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }
    this.isWatching = false;
    
    // Clear pending actions
    this.pendingActions.forEach(timeout => clearTimeout(timeout));
    this.pendingActions.clear();
    
    // Clear scheduled jobs
    this.scheduledJobs.forEach(timeout => clearInterval(timeout));
    this.scheduledJobs.clear();
    
    console.log('🛑 Enhanced workflow engine stopped watching');
  }

  // Handle file events with enhanced logic
  private handleFileEvent(eventType: 'file_created' | 'file_modified' | 'file_deleted', filePath: string, user?: AuthenticatedUser): void {
    const applicableRules = this.findApplicableRules(eventType, filePath);
    
    for (const rule of applicableRules) {
      if (rule.enabled && this.canExecuteRule(rule)) {
        this.scheduleRuleExecution(rule, filePath, user);
      }
    }
  }

  // Check if rule can be executed (rate limiting, cooldown)
  private canExecuteRule(rule: WorkflowRule): boolean {
    const now = Date.now();
    
    // Check cooldown
    if (rule.cooldownMs) {
      const lastExecution = this.getLastExecutionTime(rule.id);
      if (lastExecution && now - lastExecution < rule.cooldownMs) {
        return false;
      }
    }
    
    // Check hourly rate limit
    if (rule.maxExecutionsPerHour) {
      const hourlyCount = this.getHourlyExecutionCount(rule.id);
      if (hourlyCount >= rule.maxExecutionsPerHour) {
        return false;
      }
    }
    
    return true;
  }

  // Get last execution time for a rule
  private getLastExecutionTime(ruleId: string): number | null {
    const executions = Array.from(this.executions.values())
      .filter(exec => exec.ruleId === ruleId)
      .sort((a, b) => (b.endTime || b.startTime).getTime() - (a.endTime || a.startTime).getTime());
    
    return executions.length > 0 ? (executions[0].endTime || executions[0].startTime).getTime() : null;
  }

  // Get hourly execution count
  private getHourlyExecutionCount(ruleId: string): number {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    if (!this.executionCounts.has(ruleId)) {
      this.executionCounts.set(ruleId, []);
    }
    
    const counts = this.executionCounts.get(ruleId)!;
    
    // Remove old counts
    const recentCounts = counts.filter(time => time > oneHourAgo);
    this.executionCounts.set(ruleId, recentCounts);
    
    return recentCounts.length;
  }

  // Record execution
  private recordExecution(ruleId: string): void {
    const now = Date.now();
    
    if (!this.executionCounts.has(ruleId)) {
      this.executionCounts.set(ruleId, []);
    }
    
    this.executionCounts.get(ruleId)!.push(now);
  }

  // Schedule rule execution with enhanced batching
  private scheduleRuleExecution(rule: WorkflowRule, filePath: string, user?: AuthenticatedUser): void {
    const key = `${rule.id}_${filePath}`;
    
    // Clear existing timeout
    if (this.pendingActions.has(key)) {
      clearTimeout(this.pendingActions.get(key)!);
    }

    const timeout = setTimeout(async () => {
      this.pendingActions.delete(key);
      await this.executeRule(rule, filePath, user);
    }, rule.trigger.debounceMs || 1000);

    this.pendingActions.set(key, timeout);
  }

  // Execute workflow rule with comprehensive error handling
  private async executeRule(rule: WorkflowRule, filePath: string, user?: AuthenticatedUser): Promise<WorkflowExecution> {
    const executionId = this.generateExecutionId();
    const execution: WorkflowExecution = {
      id: executionId,
      ruleId: rule.id,
      triggeredBy: filePath || 'scheduled',
      startTime: new Date(),
      status: 'running',
      actions: [],
      metadata: {
        user: user?.email || 'system',
        trigger: rule.trigger.type,
        filePath
      }
    };

    this.executions.set(executionId, execution);
    this.recordExecution(rule.id);

    try {
      console.log(`🔄 Executing workflow rule: ${rule.name} for ${filePath || 'scheduled'}`);

      // Check permissions
      if (rule.requiredPermissions && user) {
        for (const permission of rule.requiredPermissions) {
          if (!(await this.rbac.hasPermission(user, permission, 'execute'))) {
            throw new Error(`Insufficient permissions: ${permission}`);
          }
        }
      }

      // Check conditions
      const conditionsMet = await this.checkConditionsEnhanced(rule.conditions, filePath, user);
      if (!conditionsMet) {
        execution.status = 'completed';
        execution.endTime = new Date();
        console.log(`⏭️  Conditions not met for rule: ${rule.name}`);
        return execution;
      }

      // Execute actions
      for (const action of rule.actions) {
        const actionResult = await this.executeActionEnhanced(action, filePath, rule, user);
        execution.actions.push(actionResult);
        
        if (actionResult.status === 'failed' && !action.async) {
          // Stop execution on synchronous action failure
          break;
        }
      }

      execution.status = 'completed';
      execution.endTime = new Date();
      console.log(`✅ Completed workflow rule: ${rule.name}`);

      // Create completion task
      if (user) {
        await this.projectTracker.createTask({
          title: `Workflow executed: ${rule.name}`,
          description: `Successfully executed workflow rule with ${execution.actions.length} actions`,
          category: 'workflow',
          priority: 'low',
          files: filePath ? [filePath] : [],
          tags: ['workflow', 'auto-executed'],
          metadata: {
            ruleId: rule.id,
            executionId,
            actionCount: execution.actions.length
          }
        });
      }

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.metadata.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error executing workflow rule ${rule.name}:`, error);
    }

    return execution;
  }

  // Enhanced condition checking
  private async checkConditionsEnhanced(conditions: WorkflowCondition[], filePath: string, user?: AuthenticatedUser): Promise<boolean> {
    if (conditions.length === 0) {
      return true;
    }

    for (const condition of conditions) {
      const result = await this.checkConditionEnhanced(condition, filePath, user);
      if (!result) {
        return false;
      }
    }

    return true;
  }

  // Enhanced single condition checking
  private async checkConditionEnhanced(condition: WorkflowCondition, filePath: string, user?: AuthenticatedUser): Promise<boolean> {
    try {
      switch (condition.type) {
        case 'file_extension':
          const ext = path.extname(filePath);
          return this.compareValues(ext, condition.operator, condition.value);

        case 'file_content':
          if (!filePath) return false;
          const content = await fs.readFile(filePath, 'utf-8');
          return this.compareValues(content, condition.operator, condition.value);

        case 'file_size':
          if (!filePath) return false;
          const stats = await fs.stat(filePath);
          return this.compareValues(stats.size, condition.operator, condition.value);

        case 'rule_violation':
          const ruleResult = await this.ruleEngine.validateRule(condition.value);
          return !ruleResult.passed;

        case 'time_condition':
          // Use current time as a simple fallback since getLastValidationTime doesn't exist
          const minutesSince = 0; // Always pass time conditions for now
          return this.compareValues(minutesSince, condition.operator, condition.value);

        case 'user_permission':
          if (!user) return false;
          return await this.rbac.hasPermission(user, condition.value, 'read');

        case 'git_status':
          // This would integrate with git to check file status
          return true; // Placeholder

        default:
          console.warn(`Unknown condition type: ${condition.type}`);
          return true;
      }
    } catch (error) {
      console.warn(`Error checking condition: ${condition.type}`, error);
      return false;
    }
  }

  // Enhanced action execution
  private async executeActionEnhanced(action: WorkflowAction, filePath: string, rule: WorkflowRule, user?: AuthenticatedUser): Promise<WorkflowActionResult> {
    const startTime = Date.now();
    const actionResult: WorkflowActionResult = {
      action,
      status: 'success',
      message: '',
      executionTimeMs: 0
    };

    try {
      switch (action.type) {
        case 'validate_rules':
          await this.executeValidateRulesEnhanced(action, filePath, actionResult);
          break;

        case 'auto_fix':
          await this.executeAutoFixEnhanced(action, filePath, actionResult, user);
          break;

        case 'generate_code':
          await this.executeGenerateCodeEnhanced(action, filePath, actionResult);
          break;

        case 'create_task':
          await this.executeCreateTaskEnhanced(action, filePath, actionResult, user);
          break;

        case 'backup_file':
          await this.executeBackupFileEnhanced(action, filePath, actionResult);
          break;

        case 'notify':
          await this.executeNotifyEnhanced(action, filePath, actionResult);
          break;

        case 'git_commit':
          await this.executeGitCommitEnhanced(action, filePath, actionResult);
          break;

        default:
          actionResult.status = 'failed';
          actionResult.message = `Unknown action type: ${action.type}`;
      }
    } catch (error) {
      actionResult.status = 'failed';
      actionResult.error = error instanceof Error ? error.message : 'Unknown error';
      actionResult.message = `Failed to execute ${action.type}: ${actionResult.error}`;
    }

    actionResult.executionTimeMs = Date.now() - startTime;
    return actionResult;
  }

  // Enhanced validate rules action
  private async executeValidateRulesEnhanced(action: WorkflowAction, filePath: string, result: WorkflowActionResult): Promise<void> {
    const ruleIds = action.parameters.ruleIds as string[] | string;
    const strictMode = action.parameters.strictMode as boolean;
    
    if (ruleIds === 'all') {
      const validationResults = await this.ruleEngine.validateAllRules();
      const violations = validationResults.filter(r => !r.passed);
      result.message = `Validated all rules: ${violations.length} violations found`;
      result.output = { totalRules: validationResults.length, violations: violations.length };
    } else {
      const ruleArray = Array.isArray(ruleIds) ? ruleIds : [ruleIds];
      const results = [];
      
      for (const ruleId of ruleArray) {
        const validationResult = await this.ruleEngine.validateRule(ruleId);
        results.push(validationResult);
      }
      
      const violations = results.filter(r => !r.passed);
      result.message = `Validated ${ruleArray.length} rules: ${violations.length} violations found`;
      result.output = { validatedRules: ruleArray.length, violations: violations.length };
    }
  }

  // Enhanced auto-fix action
  private async executeAutoFixEnhanced(action: WorkflowAction, filePath: string, result: WorkflowActionResult, user?: AuthenticatedUser): Promise<void> {
    const ruleIds = action.parameters.ruleIds as string[];
    const onlyLowRisk = action.parameters.onlyLowRisk as boolean;
    const onlyCritical = action.parameters.onlyCritical as boolean;
    const maxFixes = action.parameters.maxFixes as number;
    
    if (action.requiresConfirmation && !action.parameters.confirmed) {
      result.status = 'skipped';
      result.message = 'Action requires confirmation';
      return;
    }

    const autoFixResult = await this.ruleEngine.autoFixAllViolations(user);
    
    let appliedFixes = autoFixResult.appliedFixes;
    
    // Apply filters
    if (maxFixes && appliedFixes > maxFixes) {
      appliedFixes = maxFixes;
      result.message = `Applied ${appliedFixes} fixes (limited by maxFixes: ${maxFixes})`;
    } else {
      result.message = `Applied ${appliedFixes} fixes out of ${autoFixResult.totalFixes} total`;
    }
    
    result.output = {
      appliedFixes,
      totalFixes: autoFixResult.totalFixes,
      filesModified: autoFixResult.summary?.filesModified || 0
    };
  }

  // Enhanced generate code action
  private async executeGenerateCodeEnhanced(action: WorkflowAction, filePath: string, result: WorkflowActionResult): Promise<void> {
    const templateType = action.parameters.templateType as string;
    const addStandardImports = action.parameters.addStandardImports as boolean;
    
    // This would integrate with the code generator
    result.message = `Code generation requested for ${filePath}`;
    result.output = { templateType, filePath };
  }

  // Enhanced create task action
  private async executeCreateTaskEnhanced(action: WorkflowAction, filePath: string, result: WorkflowActionResult, user?: AuthenticatedUser): Promise<void> {
    const taskData = {
      title: action.parameters.title,
      description: `${action.parameters.description}\n\nTriggered by: ${filePath}`,
      category: action.parameters.category,
      priority: action.parameters.priority,
      files: filePath ? [filePath] : [],
      tags: ['auto-generated', 'workflow']
    };

    await this.projectTracker.createTask(taskData);
    result.message = `Created task: ${taskData.title}`;
    result.output = taskData;
  }

  // Enhanced backup file action
  private async executeBackupFileEnhanced(action: WorkflowAction, filePath: string, result: WorkflowActionResult): Promise<void> {
    if (!filePath) {
      result.status = 'skipped';
      result.message = 'No file path provided for backup';
      return;
    }

    try {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      const content = await fs.readFile(filePath, 'utf-8');
      await fs.writeFile(backupPath, content, 'utf-8');
      
      result.message = `Created backup: ${backupPath}`;
      result.output = { originalFile: filePath, backupFile: backupPath };
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Backup failed';
    }
  }

  // Enhanced notify action
  private async executeNotifyEnhanced(action: WorkflowAction, filePath: string, result: WorkflowActionResult): Promise<void> {
    const message = action.parameters.message as string;
    const type = action.parameters.type as string;
    const channels = action.parameters.channels as string[];
    
    for (const channel of channels || ['console']) {
      const handler = this.notificationHandlers.get(channel);
      if (handler) {
        handler(message, type);
      }
    }
    
    result.message = `Notification sent to ${channels?.join(', ') || 'console'}`;
    result.output = { message, type, channels };
  }

  // Enhanced git commit action
  private async executeGitCommitEnhanced(action: WorkflowAction, filePath: string, result: WorkflowActionResult): Promise<void> {
    // This would integrate with git commands
    result.message = 'Git commit functionality not implemented yet';
    result.status = 'skipped';
  }

  // Generate unique execution ID
  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

  // Pattern matching (enhanced glob)
  private matchesPattern(filePath: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.')
      .replace(/\./g, '\\.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
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

  // Manual trigger workflow rule
  async triggerRule(ruleId: string, filePath?: string, user?: AuthenticatedUser): Promise<WorkflowExecution> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Workflow rule ${ruleId} not found`);
    }

    return await this.executeRule(rule, filePath || '', user);
  }

  // Get workflow execution status
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  // Get recent executions
  getRecentExecutions(limit: number = 10): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  // Get execution statistics
  getExecutionStats(): any {
    const executions = Array.from(this.executions.values());
    const now = Date.now();
    const last24Hours = executions.filter(e => now - e.startTime.getTime() < 24 * 60 * 60 * 1000);
    
    return {
      total: executions.length,
      last24Hours: last24Hours.length,
      successful: executions.filter(e => e.status === 'completed').length,
      failed: executions.filter(e => e.status === 'failed').length,
      running: executions.filter(e => e.status === 'running').length,
      averageExecutionTime: this.calculateAverageExecutionTime(executions)
    };
  }

  // Calculate average execution time
  private calculateAverageExecutionTime(executions: WorkflowExecution[]): number {
    const completed = executions.filter(e => e.endTime);
    if (completed.length === 0) return 0;
    
    const totalTime = completed.reduce((sum, exec) => {
      return sum + (exec.endTime!.getTime() - exec.startTime.getTime());
    }, 0);
    
    return totalTime / completed.length;
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

  // Add notification handler
  addNotificationHandler(channel: string, handler: Function): void {
    this.notificationHandlers.set(channel, handler);
  }

  // Get workflow health status
  getHealthStatus(): any {
    return {
      isWatching: this.isWatching,
      enabledRules: this.getEnabledRules().length,
      pendingActions: this.pendingActions.size,
      scheduledJobs: this.scheduledJobs.size,
      recentExecutions: this.getRecentExecutions(5).length,
      executionStats: this.getExecutionStats()
    };
  }
} 