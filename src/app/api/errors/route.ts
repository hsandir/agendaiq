import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';

// GET /api/errors - Get all errors
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_MONITORING });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // Return empty array since SystemError model doesn't exist
    return NextResponse.json([]);
  } catch (error: unknown) {
    console.error('Error fetching errors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/errors - Create a new error
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_MONITORING });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const body = await request.json() as Record<string, unknown> as Record<string, unknown>;
    
    // Log error to console since SystemError model doesn't exist
    console.error('System error reported:', body);

    return NextResponse.json({ message: 'Error logged' });
  } catch (error: unknown) {
    console.error('Error logging system error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 