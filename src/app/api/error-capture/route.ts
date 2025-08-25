import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';

interface ErrorData {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
}

// Store errors in memory (for production, use proper logging service)
const errors: ErrorData[] = [];

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_MONITORING });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }
    const errorData = await request.json() as Record<string, unknown>;
    
    const capturedError: ErrorData = {
      message: String(errorData?.message ?? 'Unknown error'),
      stack: errorData?.stack ? String(errorData.stack) : undefined,
      url: String(errorData?.url ?? request?.url ?? 'Unknown'),
      userAgent: request.headers.get('user-agent') ?? 'Unknown',
      timestamp: new Date().toISOString(),
      userId: errorData?.userId ? String(errorData.userId) : undefined
    };
    
    errors.push(capturedError);
    
    // Keep only last 100 errors to prevent memory issues
    if (errors.length > 100) {
      errors.splice(0, errors.length - 100);
    }
    
    console.error('Client-side error captured:', capturedError);
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error capturing client error:', error);
    return NextResponse.json({ error: 'Failed to capture error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_MONITORING });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  return NextResponse.json({ 
    success: true,
    totalErrors: errors?.length, 
    recentErrors: errors.slice(-5).map(e => ({
      message: (e instanceof Error ? e.message : String(e)),
      timestamp: e?.timestamp,
      url: e?.url
    }))
  });
}