import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-utils';
import { getFastUser } from '@/lib/auth/auth-utils-fast';
import { getUltraFastUser, preferenceCache } from '@/lib/auth/auth-utils-ultra-fast';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit/audit-logger';
import { z } from 'zod';
import { RateLimiters, getClientIdentifier } from '@/lib/utils/rate-limit';

const themeSchema = z.object({
  themeId: z.string().optional(), // Accept themeId from new interface
  theme: z.string().optional(), // Accept theme for backward compatibility
}).refine(data => data.themeId || data.theme, {
  message: "Either themeId or theme must be provided"
});

// GET /api/user/theme - Get user's theme preference
export async function GET(request: NextRequest) {
  try {
    // Use ultra-fast auth for better performance
    const user = await getUltraFastUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check cache first
    const cached = preferenceCache.get(user.id);
    if (cached?.theme) {
      const response = NextResponse.json({
        theme: cached.theme,
      });
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('Cache-Control', 'private, max-age=3600');
      return response;
    }

    // Get theme preference from database (optimized query)
    const userData = await prisma.$queryRaw<{theme_preference: string | null}[]>`
      SELECT theme_preference FROM "User" WHERE id = ${user.id} LIMIT 1
    `;
    
    const theme = userData?.[0]?.theme_preference || 'standard';
    
    // Cache the result
    preferenceCache.set(user.id, { theme });
    
    const response = NextResponse.json({ theme });
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', 'private, max-age=3600');
    
    return response;
  } catch (error: unknown) {
    console.error('Error fetching theme preference:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme preference' },
      { status: 500 }
    );
  }
}

// POST /api/user/theme - Update user's theme preference (for compatibility)
export async function POST(request: NextRequest) {
  return PUT(request);
}

// PUT /api/user/theme - Update user's theme preference
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
    const body = await request.json();
    const validatedData = themeSchema.parse(body);
    
    // Use themeId if provided, otherwise use theme
    const themeToSave = validatedData.themeId || validatedData.theme || 'standard';

    // Update user's theme preference (optimized query)
    await prisma.user.update({
      where: { id: user.id },
      data: { theme_preference: themeToSave },
      select: { id: true }, // Only select what we need
    });

    // Clear cache for this user
    preferenceCache.clear(user.id);

    // Log the theme change asynchronously (don't wait)
    AuditLogger.logFromRequest(request, {
      tableName: 'users',
      recordId: user.id.toString(),
      operation: 'UPDATE',
      userId: user.id,
      staffId: user.staff?.id || undefined,
      source: 'WEB_UI',
      description: `Theme changed to ${themeToSave}`,
    }).catch(err => console.error('Audit log failed:', err));

    return NextResponse.json({
      success: true,
      theme: themeToSave,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid theme selection', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating theme preference:', error);
    return NextResponse.json(
      { error: 'Failed to update theme preference' },
      { status: 500 }
    );
  }
}