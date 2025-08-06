import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Whitelist of allowed git commands for safety
const ALLOWED_COMMANDS = [
  'status',
  'add',
  'commit',
  'push',
  'pull',
  'fetch',
  'checkout',
  'branch',
  'merge',
  'reset',
  'stash',
  'log',
  'diff',
  'show',
  'remote',
  'tag'
];

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { command, args = [] } = body;

    // Validate command
    if (!ALLOWED_COMMANDS.includes(command)) {
      return NextResponse.json(
        { error: `Command '${command}' is not allowed` },
        { status: 400 }
      );
    }

    // Build git command
    const gitCommand = `git ${command} ${args.map((arg: string) => {
      // Properly escape arguments
      if (arg.includes(' ') || arg.includes('"')) {
        return `"${arg.replace(/"/g, '\\"')}"`;
      }
      return arg;
    }).join(' ')}`.trim();

    console.log('Executing git command:', gitCommand);

    // Execute command
    const { stdout, stderr } = await execAsync(gitCommand, {
      cwd: process.cwd(),
      timeout: 30000, // 30 second timeout
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    const output = stdout || stderr;

    return NextResponse.json({
      success: !stderr || command === 'diff', // diff uses stderr for output
      command: gitCommand,
      output,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Git execute error:', error);
    
    // Extract useful error message
    let errorMessage = 'Git command failed';
    if (error.stderr) {
      errorMessage = error.stderr;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        command: body.command,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}