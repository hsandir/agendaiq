import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';

/**
 * Disabled Sentry test endpoint
 * Sentry subscription expired - returns no-op responses
 */
export async function GET(request: NextRequest) {
  const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_DEBUG });
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }
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
  const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_DEBUG });
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }
  console.log('Sentry test endpoint POST called (disabled)');
  
  return NextResponse.json({ 
    message: 'Sentry test endpoint disabled - subscription expired',
    status: 'disabled'
  });
}