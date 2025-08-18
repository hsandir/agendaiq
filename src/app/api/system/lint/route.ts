import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { Capability } from '@/lib/auth/policy';

// GET Method - Lint status
export async function GET(request: NextRequest) {
  try {
    // REQUIRED: Auth check - Developer admin for system lint
    const authResult = await withAuth(request, { 
      requireAuth: true, 
      requireCapability: Capability.DEV_DEBUG
    });
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error }, 
        { status: authResult.statusCode }
      );
    }

    // Simulated lint results (in real app, would run actual linter)
    const lintResults = {
      status: 'warning',
      totalFiles: 156,
      checkedFiles: 156,
      errors: 3,
      warnings: 28,
      fixableIssues: 15,
      lastRun: new Date().toISOString(),
      categories: {
        'TypeScript': { errors: 1, warnings: 12 },
        'React': { errors: 0, warnings: 8 },
        'ESLint': { errors: 2, warnings: 8 }
      }
    };

    return NextResponse.json({ 
      data: lintResults,
      message: "Lint status retrieved successfully" 
    });

  } catch (error: unknown) {
    console.error('Lint API Error:', error);
    return NextResponse.json(
      { 
        error: "Failed to retrieve lint status",
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

// POST Method - Run lint fix
export async function POST(request: NextRequest) {
  try {
    // REQUIRED: Auth check
    const authResult = await withAuth(request, { 
      requireAuth: true,
      requireCapability: Capability.DEV_DEBUG
    });
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error }, 
        { status: authResult.statusCode }
      );
    }

    // Simulate lint fix process
    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json({ 
      data: {
        fixed: 12,
        remaining: 3,
        duration: 2.5
      },
      message: "Auto-fix completed successfully" 
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Lint Fix API Error:', error);
    return NextResponse.json(
      { 
        error: "Failed to run auto-fix",
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}