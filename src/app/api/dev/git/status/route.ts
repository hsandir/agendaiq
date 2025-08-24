import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_GIT });
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }
    // Get current branch
    const { stdout: ____branch  } = await execAsync('git rev-parse --abbrev-ref HEAD');
    
    // Get status
    const { stdout: ____statusOutput  } = await execAsync('git status --porcelain');
    
    // Get ahead/behind info
    let ahead = 0, behind = 0;
    try {
      const { stdout: ____revList  } = await execAsync(`git rev-list --left-right --count origin/${String(branch).trim()}...HEAD`);
      const [behindStr, aheadStr] = String(revList).trim().split('\t');
      behind = parseInt(behindStr) ?? 0;
      ahead = parseInt(aheadStr) ?? 0;
    } catch {
      // Remote might not exist
    }
    
    // Parse status output
    const lines = statusOutput.split('\n').filter(Boolean);
    const staged: string[] = [];
    const modified: string[] = [];
    const untracked: string[] = [];
    const deleted: string[] = [];
    const changes: Array<{ file: string; status: string }> = [];
    
    lines.forEach(line => {
      const status = line.substring(0, 2);
      const file = line.substring(3);
      
      // Parse status codes
      const indexStatus = status[0];
      const workingStatus = status[1];
      
      let fileStatus = '??';
      if (indexStatus === 'M' || workingStatus === 'M') fileStatus = 'M';
      else if (indexStatus === 'A') fileStatus = 'A';
      else if (indexStatus === 'D' || workingStatus === 'D') fileStatus = 'D';
      else if (indexStatus === 'R') fileStatus = 'R';
      else if (status === '??') fileStatus = '??';
      
      changes.push({
        file,
        status: fileStatus
      });
      
      // Categorize files
      if (indexStatus !== ' ' && indexStatus !== '?') {
        staged.push(file);
      }
      if (workingStatus === 'M') {
        modified.push(file);
      }
      if (status === '??') {
        untracked.push(file);
      }
      if (indexStatus === 'D' || workingStatus === 'D') {
        deleted.push(file);
      }
    });
    
    return NextResponse.json({
      status: {
        branch: String(branch).trim(),
        ahead,
        behind,
        staged,
        modified,
        untracked,
        deleted
      },
      changes,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('Git status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get git status',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}