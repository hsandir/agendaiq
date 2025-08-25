import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// POST /api/dev/execute - Execute a command directly (development only)
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  let body: { command?: string; cwd?: string; timeout?: number } = {};
  try {
    body = await request.json();
    const { command, cwd = process.cwd(), timeout = 30000  } = body;

    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_EXECUTE ?? Capability.DEV_DEBUG });
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    console.log('Executing command:', command);

    // Execute the command with timeout
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      env: {
        ...process.env,
        FORCE_COLOR: '0', // Disable color output for cleaner logs
      }
    });

    const output = stdout ?? (stderr || 'Command executed successfully with no output');
    
    return NextResponse.json({
      success: (!stderr) ?? (stderr.length === 0),
      command,
      output,
      error: stderr ?? undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Command execution failed:', error);
    
    // Extract useful error information
    let errorMessage = 'Command execution failed';
    let errorOutput = '';
    
    let exitCode = 1;
    if (error && typeof error === 'object') {
      const err = error as { code?: string | number; stderr?: string; stdout?: string; message?: string };
      if (err.code === 'ETIMEDOUT') {
        errorMessage = 'Command timed out';
      } else if (err.stderr) {
        errorOutput = err.stderr;
        errorMessage = err.stderr;
      } else if (err.stdout) {
        errorOutput = err.stdout;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Extract exit code
      if (typeof err.code === 'number') {
        exitCode = err.code;
      } else if (typeof err.code === 'string') {
        const parsed = parseInt(err.code, 10);
        if (!isNaN(parsed)) {
          exitCode = parsed;
        }
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        command: body.command,
        error: errorMessage,
        output: errorOutput,
        exitCode,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET /api/dev/execute - Check if command execution is available
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { 
        available: false,
        reason: 'Only available in development mode'
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    available: true,
    environment: process.env.NODE_ENV,
    cwd: process.cwd(),
    platform: process.platform,
    nodeVersion: process.version,
  });
}