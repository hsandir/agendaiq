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