import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-utils';
import { getFastUser } from '@/lib/auth/auth-utils-fast';
import { getUltraFastUser, preferenceCache } from '@/lib/auth/auth-utils-ultra-fast';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit/audit-logger';
import { z } from 'zod';
import { RateLimiters, getClientIdentifier } from '@/lib/utils/rate-limit';

const layoutSchema = z.object({
  layoutId: z.string().optional(),
  layout: z.string().optional(),
}).refine(data => data.layoutId || data.layout, {
  message: "Either layoutId or layout must be provided"
});

// GET /api/user/layout - Get user's layout preference
export async function GET(request: NextRequest) {
  try {
    // Use ultra-fast auth for better performance
    const user = await getUltraFastUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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

    // Get layout preference from database (optimized query)
    const userData = await prisma.$queryRaw<{layout_preference: string | null}[]>`
      SELECT layout_preference FROM "User" WHERE id = ${user.id} LIMIT 1
    `;
    
    const layout = userData?.[0]?.layout_preference || 'modern';
    
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

  const user = await getUltraFastUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validatedData = layoutSchema.parse(body);
    
    // Use layoutId if provided, otherwise use layout
    const layoutToSave = validatedData.layoutId || validatedData.layout || 'modern';

    // Update user's layout preference (optimized query)
    await prisma.user.update({
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
      staffId: (user as any).staff?.id || undefined,
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