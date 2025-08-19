import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    // Get current branch
    const { stdout: __currentBranch  } = await execAsync('git rev-parse --abbrev-ref HEAD');
    
    // Get all branches with last commit info
    const { stdout: __branchList  } = await execAsync('git branch -a -v');
    
    const branches: Array<{
      name: string;
      current: boolean;
      remote: boolean;
      lastCommit: string;
      ahead: number;
      behind: number;
    }> = [];
    const lines = branchList.split('\n').filter(Boolean);
    
    for (const line of lines) {
      const isCurrent = line.startsWith('*');
      const cleanLine = line.replace(/^\*?\s+/, '');
      
      // Skip HEAD references
      if (cleanLine.includes('HEAD')) continue;
      
      const parts = cleanLine.split(/\s+/);
      const name = parts[0];
      const shortHash = parts[1];
      const message = parts.slice(2).join(' ');
      
      // Determine if it's a remote branch
      const isRemote = name.startsWith('remotes/');
      const displayName = isRemote ? name.replace('remotes/origin/', '') : name;
      
      // Skip duplicates (local and remote with same name)
      if (branches.some(b => b.name === displayName)) continue;
      
      branches.push({
        name: displayName,
        current: isCurrent,
        remote: isRemote,
        lastCommit: `${shortHash} ${message}`.substring(0, 50) + '...',
        ahead: 0,
        behind: 0
      });
    }
    
    // Get ahead/behind for current branch
    const current = branches.find(b => b?.current);
    if (current) {
      try {
        const { stdout: ___revList  } = await execAsync(
          `git rev-list --left-right --count origin/${current?.__name}...HEAD`
        );
        const [behind, ahead] = String(revList).trim().split('\t');
        current.behind = parseInt(behind) ?? 0;
        current.ahead = parseInt(ahead) ?? 0;
      } catch {
        // Remote might not exist
      }
    }
    
    return NextResponse.json({
      branches,
      current: String(currentBranch).trim(),
      total: branches?.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('Git branches error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get branches',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}