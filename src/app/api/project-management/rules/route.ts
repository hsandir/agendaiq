import { NextRequest, NextResponse } from "next/server";
import { APIAuthPatterns } from '@/lib/auth/api-auth';
import { AuthenticatedUser } from '@/lib/auth/auth-utils';
import { RuleEngine } from '@/lib/project-management/rule-engine-full';
import { WorkflowEngine } from '@/lib/project-management/auto-workflow-full';

// GET /api/project-management/rules - Get all rules and validation status
export const GET = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const ruleEngine = RuleEngine.getInstance();
    const workflowEngine = WorkflowEngine.getInstance();
    
    // Get validation status
    const validationStatus = await ruleEngine.getValidationStatus(user);
    
    // Get workflow health
    const workflowHealth = workflowEngine.getHealthStatus();
    
    // Get recent executions
    const recentExecutions = workflowEngine.getRecentExecutions(10);
    
    return NextResponse.json({
      validationStatus,
      workflowHealth,
      recentExecutions,
      rules: ruleEngine.getAllRules().map(rule => ({
        id: rule.id,
        name: rule.name,
        category: rule.category,
        priority: rule.priority,
        enforced: rule.enforced,
        autoFix: rule.autoFix
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting project management rules:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get rules status',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});

// POST /api/project-management/rules/validate - Validate specific rule
export const POST = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { ruleId, autoFix } = body;
    
    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }
    
    const ruleEngine = RuleEngine.getInstance();
    
    // Validate the rule
    const validationResult = await ruleEngine.validateRule(ruleId, user);
    
    // Apply auto-fix if requested and available
    let autoFixResult = null;
    if (autoFix && validationResult.fixes.length > 0) {
      const applicableFixes = validationResult.fixes.filter(fix => fix.autoApply);
      if (applicableFixes.length > 0) {
        autoFixResult = await ruleEngine.applyFixes(applicableFixes, user);
      }
    }
    
    return NextResponse.json({
      validationResult,
      autoFixResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error validating rule:', error);
    return NextResponse.json(
      { 
        error: 'Failed to validate rule',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});

// PUT /api/project-management/rules/workflow - Control workflow engine
export const PUT = APIAuthPatterns.adminOnly(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { action, ruleId, enabled } = body;
    
    const workflowEngine = WorkflowEngine.getInstance();
    
    switch (action) {
      case 'start':
        await workflowEngine.startWatching(process.cwd(), user);
        return NextResponse.json({ 
          message: 'Workflow engine started',
          timestamp: new Date().toISOString()
        });
        
      case 'stop':
        await workflowEngine.stopWatching();
        return NextResponse.json({ 
          message: 'Workflow engine stopped',
          timestamp: new Date().toISOString()
        });
        
      case 'toggle_rule':
        if (!ruleId || enabled === undefined) {
          return NextResponse.json(
            { error: 'Rule ID and enabled status are required' },
            { status: 400 }
          );
        }
        workflowEngine.setRuleEnabled(ruleId, enabled);
        return NextResponse.json({ 
          message: `Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`,
          timestamp: new Date().toISOString()
        });
        
      case 'trigger_rule':
        if (!ruleId) {
          return NextResponse.json(
            { error: 'Rule ID is required' },
            { status: 400 }
          );
        }
        const execution = await workflowEngine.triggerRule(ruleId, undefined, user);
        return NextResponse.json({
          message: `Rule ${ruleId} triggered`,
          execution,
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Error controlling workflow engine:', error);
    return NextResponse.json(
      { 
        error: 'Failed to control workflow engine',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}); 