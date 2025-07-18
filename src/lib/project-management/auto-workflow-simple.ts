/**
 * SIMPLE WORKFLOW SYSTEM
 * File watching olmadan basit bir workflow sistemi
 */

import { RuleEngine } from './rule-engine';
import { CodeGenerator } from './code-generator';
import { ProjectTracker } from './project-tracker';

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
}

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private rules = new Map<string, WorkflowRule>();
  private ruleEngine: RuleEngine;
  private codeGenerator: CodeGenerator;
  private projectTracker: ProjectTracker;

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
    const basicRules: WorkflowRule[] = [
      {
        id: 'WORKFLOW-001-BASIC',
        name: 'Basic Workflow',
        description: 'Basic workflow rule',
        enabled: true,
        priority: 1
      }
    ];

    basicRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
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

  // Manual trigger workflow rule
  async triggerRule(ruleId: string, filePath?: string): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Workflow rule ${ruleId} not found`);
    }

    console.log(`🔄 Manually triggered workflow rule: ${rule.name}`);
  }

  // Start watching (no-op in simple version)
  async startWatching(projectRoot: string = process.cwd()): Promise<void> {
    console.log('📝 Simple workflow engine initialized (no file watching)');
  }

  // Stop watching (no-op in simple version)
  async stopWatching(): Promise<void> {
    console.log('📝 Simple workflow engine stopped');
  }
} 