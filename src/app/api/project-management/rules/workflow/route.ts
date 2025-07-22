import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth/api-auth';
// DISABLED: Workflow engine to prevent corruption
// import { WorkflowEngine } from '@/lib/project-management/auto-workflow-full';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// PUT /api/project-management/rules/workflow - SAFE workflow control (status only)
export async function PUT(request: NextRequest) {
  try {
    // REQUIRED: Auth check - only admins can control workflow
    const authResult = await withAuth(request, { requireAdminRole: true });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const user = authResult.user!;
    const body = await request.json();
    const { action, ruleId, enabled } = body;
    
    // DISABLED: Workflow engine operations to prevent file corruption
    // const workflowEngine = WorkflowEngine.getInstance();
    
    switch (action) {
      case 'start':
        // DISABLED: Starting workflow engine
        return NextResponse.json({ 
          message: 'Workflow engine disabled for safety - templates available in templates/cursor-templates/',
          status: 'disabled',
          reason: 'File corruption prevention',
          templates: [
            'server-page-template.tsx',
            'client-page-template.tsx', 
            'api-route-template.ts'
          ]
        });
        
      case 'stop':
        // DISABLED: Stopping workflow engine  
        return NextResponse.json({ 
          message: 'Workflow engine already disabled',
          status: 'disabled'
        });
        
      case 'status':
        return NextResponse.json({
          isWatching: false,
          status: 'disabled',
          message: 'Workflow engine disabled for safety',
          templates: {
            available: true,
            location: 'templates/cursor-templates/',
            files: [
              'server-page-template.tsx',
              'client-page-template.tsx', 
              'api-route-template.ts',
              'README.md'
            ]
          }
        });
        
      case 'toggle_rule':
        if (!ruleId || enabled === undefined) {
          return NextResponse.json(
            { error: 'Rule ID and enabled status are required' },
            { status: 400 }
          );
        }
        // DISABLED: workflowEngine.setRuleEnabled(ruleId, enabled);
        
        // Auto-commit rule changes
        try {
          // DISABLED: execAsync(`git add . && git commit -m "auto: ${enabled ? 'enabled' : 'disabled'} workflow rule ${ruleId}" || true`);
          console.log(`✅ Auto-committed rule ${enabled ? 'enable' : 'disable'} (disabled)`);
        } catch (error) {
          console.warn('Auto-commit failed:', error);
        }
        
        return NextResponse.json({ 
          message: `Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'} (disabled)`,
          timestamp: new Date().toISOString()
        });
        
      case 'trigger_rule':
        if (!ruleId) {
          return NextResponse.json(
            { error: 'Rule ID is required' },
            { status: 400 }
          );
        }
        // DISABLED: const execution = await workflowEngine.triggerRule(ruleId, undefined, user);
        
        // Auto-commit after rule execution
        try {
          // DISABLED: execAsync(`git add . && git commit -m "auto: executed workflow rule ${ruleId} - applied fixes" || true`);
          console.log('✅ Auto-committed rule execution (disabled)');
        } catch (error) {
          console.warn('Auto-commit failed:', error);
        }
        
        return NextResponse.json({
          message: `Rule ${ruleId} triggered (disabled)`,
          // execution,
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