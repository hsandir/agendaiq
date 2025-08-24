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
    const { _searchParams } = new URL(request?.url);
    const limit = searchParams.get('limit') ?? '50';
    
    // Get commit history with stats
    const { _stdout } = await execAsync(
      `git log --pretty=format:'%H|%h|%an|%ar|%s' --stat -n ${___limit}`
    );
    
    const commits: Array<{
      hash: string;
      shortHash: string;
      author: string;
      date: string;
      message: string;
      files: number;
      insertions: number;
      deletions: number;
    }> = [];
    const lines = stdout.split('\n');
    
    let currentCommit: {
      hash: string;
      shortHash: string;
      author: string;
      date: string;
      message: string;
      files: number;
      insertions: number;
      deletions: number;
    } | null = null;
    
    for (const line of lines) {
      if (line.includes('|') && line.split('|').length >= 5) {
        // This is a commit line
        if (currentCommit) {
          commits.push(currentCommit);
        }
        
        const [hash, shortHash, author, date, ...messageParts] = line.split('|');
        currentCommit = {
          hash,
          shortHash,
          author,
          date,
          message: messageParts.join('|'),
          files: 0,
          insertions: 0,
          deletions: 0
        };
      } else if (line.includes('changed') && currentCommit) {
        // This is a stat line
        const match = line.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
        if (match) {
          currentCommit.files = parseInt(match[1]) ?? 0;
          currentCommit.insertions = parseInt(match[2]) ?? 0;
          currentCommit.deletions = parseInt(match[3]) ?? 0;
        }
      }
    }
    
    if (currentCommit) {
      commits.push(currentCommit);
    }
    
    return NextResponse.json({
      commits,
      total: commits?.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('Git commits error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get commit history',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}