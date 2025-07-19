import { NextRequest, NextResponse } from "next/server";
import { APIAuthPatterns } from '@/lib/auth/api-auth';
import { AuthenticatedUser } from '@/lib/auth/auth-utils';
import { WorkflowEngine } from '@/lib/project-management/auto-workflow-full';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// PUT /api/project-management/rules/workflow - Control workflow engine
export const PUT = APIAuthPatterns.adminOnly(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { action, ruleId, enabled } = body;
    
    const workflowEngine = WorkflowEngine.getInstance();
    
    switch (action) {
      case 'start':
        await workflowEngine.startWatching(process.cwd(), user);
        
        // Auto-commit after workflow start
        try {
          await execAsync('git add . && git commit -m "auto: workflow engine started - monitoring file changes" || true');
          console.log('✅ Auto-committed workflow start');
        } catch (error) {
          console.warn('Auto-commit failed:', error);
        }
        
        return NextResponse.json({ 
          message: 'Workflow engine started',
          timestamp: new Date().toISOString()
        });
        
      case 'stop':
        await workflowEngine.stopWatching();
        
        // Auto-commit after workflow stop
        try {
          await execAsync('git add . && git commit -m "auto: workflow engine stopped - file monitoring disabled" || true');
          console.log('✅ Auto-committed workflow stop');
        } catch (error) {
          console.warn('Auto-commit failed:', error);
        }
        
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
        
        // Auto-commit rule changes
        try {
          await execAsync(`git add . && git commit -m "auto: ${enabled ? 'enabled' : 'disabled'} workflow rule ${ruleId}" || true`);
          console.log(`✅ Auto-committed rule ${enabled ? 'enable' : 'disable'}`);
        } catch (error) {
          console.warn('Auto-commit failed:', error);
        }
        
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
        
        // Auto-commit after rule execution
        try {
          await execAsync(`git add . && git commit -m "auto: executed workflow rule ${ruleId} - applied fixes" || true`);
          console.log('✅ Auto-committed rule execution');
        } catch (error) {
          console.warn('Auto-commit failed:', error);
        }
        
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