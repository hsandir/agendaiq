import { NextRequest, NextResponse } from 'next/server';

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
    const errorData = await request.json();
    
    const capturedError: ErrorData = {
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      url: errorData.url || request.url,
      userAgent: request.headers.get('user-agent') || 'Unknown',
      timestamp: new Date().toISOString(),
      userId: errorData.userId
    };
    
    errors.push(capturedError);
    
    // Keep only last 100 errors to prevent memory issues
    if (errors.length > 100) {
      errors.splice(0, errors.length - 100);
    }
    
    console.error('Client-side error captured:', capturedError);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error capturing client error:', error);
    return NextResponse.json({ error: 'Failed to capture error' }, { status: 500 });
  }
}

export async function GET() {
  // Only show errors in development or for debugging purposes
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.json({ 
      success: true,
      totalErrors: errors.length,
      errors 
    });
  } else {
    return NextResponse.json({ 
      success: true,
      totalErrors: errors.length, 
      recentErrors: errors.slice(-5).map(e => ({
        message: (e instanceof Error ? e.message : String(e)),
        timestamp: e.timestamp,
        url: e.url
      }))
    });
  }
}