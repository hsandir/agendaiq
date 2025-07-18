import { NextRequest, NextResponse } from "next/server";
import { APIAuthPatterns } from '@/lib/auth/api-auth';
import { AuthenticatedUser } from '@/lib/auth/auth-utils';
import { RuleEngine } from '@/lib/project-management/rule-engine';
import { WorkflowEngine } from '@/lib/project-management/auto-workflow-simple';

// GET /api/project-management/rules - Get all rules and validation status
export const GET = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const ruleEngine = RuleEngine.getInstance();
    const workflowEngine = WorkflowEngine.getInstance();
    
    // Get all rules
    const rules = ruleEngine.getAllRules();
    const workflowRules = workflowEngine.getAllRules();
    
    // Get validation results
    const validationResults = await ruleEngine.validateAllRules();
    
    // Calculate summary
    const summary = {
      totalRules: rules.length,
      passedRules: validationResults.filter(r => r.passed).length,
      violatedRules: validationResults.filter(r => !r.passed).length,
      autoFixableViolations: validationResults
        .filter(r => !r.passed)
        .reduce((sum, r) => sum + r.fixes.filter(f => f.autoApply).length, 0),
      workflowRules: workflowRules.length,
      enabledWorkflowRules: workflowRules.filter(r => r.enabled).length
    };
    
    return NextResponse.json({
      success: true,
      data: {
        rules,
        workflowRules,
        validationResults,
        summary
      }
    });
  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
        code: "RULES_FETCH_ERROR",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});

// POST /api/project-management/rules - Validate rules or apply auto-fixes
export const POST = APIAuthPatterns.staffOnly(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { action, ruleIds, autoFix } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const ruleEngine = RuleEngine.getInstance();
    const workflowEngine = WorkflowEngine.getInstance();

    let result;

    switch (action) {
      case 'validate':
        if (ruleIds && Array.isArray(ruleIds)) {
          // Validate specific rules
          const results = [];
          for (const ruleId of ruleIds) {
            const ruleResult = await ruleEngine.validateRule(ruleId);
            results.push(ruleResult);
          }
          result = { validationResults: results };
        } else {
          // Validate all rules
          const validationResults = await ruleEngine.validateAllRules();
          result = { validationResults };
        }
        break;

      case 'auto-fix':
        const autoFixResult = await ruleEngine.autoFixAllViolations();
        result = { autoFixResult };
        break;

      case 'trigger-workflow':
        const { ruleId, filePath } = body;
        if (!ruleId) {
          return NextResponse.json({ error: "Rule ID is required for trigger-workflow" }, { status: 400 });
        }
        await workflowEngine.triggerRule(ruleId, filePath);
        result = { message: `Workflow rule ${ruleId} triggered successfully` };
        break;

      case 'toggle-workflow':
        const { workflowRuleId, enabled } = body;
        if (!workflowRuleId) {
          return NextResponse.json({ error: "Workflow rule ID is required" }, { status: 400 });
        }
        workflowEngine.setRuleEnabled(workflowRuleId, enabled);
        result = { message: `Workflow rule ${workflowRuleId} ${enabled ? 'enabled' : 'disabled'}` };
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result
    });

  } catch (error) {
    console.error("Error in rules API:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
        code: "RULES_ACTION_ERROR",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}); 