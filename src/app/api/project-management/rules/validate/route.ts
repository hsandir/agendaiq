import { NextRequest, NextResponse } from "next/server";
import { APIAuthPatterns } from '@/lib/auth/api-auth';
import { AuthenticatedUser } from '@/lib/auth/auth-utils';
import { RuleEngine } from '@/lib/project-management/rule-engine-full';

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