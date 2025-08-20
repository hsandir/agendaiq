import { NextRequest, NextResponse } from 'next/server';

/**
 * Disabled Sentry test endpoint
 * Sentry subscription expired - returns no-op responses
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') ?? 'simple';
  
  console.log('Sentry test endpoint called (disabled):', type);
  
  return NextResponse.json({ 
    message: 'Sentry test endpoint disabled - subscription expired',
    type,
    status: 'disabled'
  });
}

export async function POST(request: NextRequest) {
  console.log('Sentry test endpoint POST called (disabled)');
  
  return NextResponse.json({ 
    message: 'Sentry test endpoint disabled - subscription expired',
    status: 'disabled'
  });
}