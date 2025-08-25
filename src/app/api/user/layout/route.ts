import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { preferenceCache } from '@/lib/auth/auth-utils-ultra-fast';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit/audit-logger';
import { z } from 'zod';
import { RateLimiters, getClientIdentifier } from '@/lib/utils/rate-limit';

const layoutSchema = z.object({
  layoutId: z.string().optional(),
  layout: z.string().optional(),
}).refine(data => data.layoutId ?? data.layout, {
  message: "Either layoutId or layout must be provided"
});

// GET /api/user/layout - Get user's layout preference
export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Authentication required' }, { status: auth.statusCode || 401 });
    }
    const user = auth.user;

    // Check cache first
    const cached = preferenceCache.get(user.id);
    if (cached?.layout) {
      const response = NextResponse.json({
        layout: cached.layout,
      });
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('Cache-Control', 'private, max-age=3600');
      return response;
    }

    // Get layout preference using Prisma client (avoids case/permission issues)
    const userData = await prisma.users.findUnique({
      where: { id: user.id },
      select: { layout_preference: true },
    });
    const layout = userData?.layout_preference ?? 'modern';
    
    // Cache the result
    preferenceCache.set(user.id, { layout });
    
    const response = NextResponse.json({ layout });
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', 'private, max-age=3600');
    
    return response;
  } catch (error: unknown) {
    console.error('Error fetching layout preference:', error);
    return NextResponse.json(
      { error: 'Failed to fetch layout preference' },
      { status: 500 }
    );
  }
}

// POST /api/user/layout - Update user's layout preference (for compatibility)
export async function POST(request: NextRequest) {
  return PUT(request);
}

// PUT /api/user/layout - Update user's layout preference
export async function PUT(request: NextRequest) {
  // Skip rate limiting in development for performance testing
  if (process.env.NODE_ENV !== 'development') {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await RateLimiters.userPreferences.check(request, 10, clientId);
    if (!rateLimitResult.success) {
      return RateLimiters.userPreferences.createErrorResponse(rateLimitResult);
    }
  }

  const auth = await withAuth(request, { requireAuth: true });
  if (!auth.success || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Authentication required' }, { status: auth.statusCode || 401 });
  }
  const user = auth.user;

  try {
    const body = await request.json() as Record<string, unknown>;
    const validatedData = layoutSchema.parse(body);
    
    // Use layoutId if provided, otherwise use layout
    const layoutToSave = validatedData.layoutId ?? validatedData.layout ?? 'modern';

    // Update user's layout preference (optimized query)
    await prisma.users.update({
      where: { id: user.id },
      data: { layout_preference: layoutToSave },
      select: { id: true }, // Only select what we need
    });

    // Clear cache for this user
    preferenceCache.clear(user.id);

    // Log the layout change asynchronously (don't wait)
    AuditLogger.logFromRequest(request, {
      tableName: 'users',
      recordId: user.id.toString(),
      operation: 'UPDATE',
      userId: user.id,
      staffId: (user.staff as Record<string, unknown> | null)?.id ?? undefined,
      source: 'WEB_UI',
      description: `Layout changed to ${layoutToSave}`,
    }).catch(err => console.error('Audit log failed:', err));

    return NextResponse.json({
      success: true,
      layout: layoutToSave,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid layout selection', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating layout preference:', error);
    return NextResponse.json(
      { error: 'Failed to update layout preference' },
      { status: 500 }
    );
  }
}