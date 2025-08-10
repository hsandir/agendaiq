import { NextRequest, NextResponse } from 'next/server';
import { withLightAuth } from '@/lib/auth/auth-utils-lite';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit/audit-logger';
import { z } from 'zod';

const themeSchema = z.object({
  themeId: z.string().optional(), // Accept themeId from new interface
  theme: z.string().optional(), // Accept theme for backward compatibility
}).refine(data => data.themeId || data.theme, {
  message: "Either themeId or theme must be provided"
});

// GET /api/user/theme - Get user's theme preference
export async function GET(request: NextRequest) {
  try {
    const authResult = await withLightAuth();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }
    const user = authResult.user!;

    // User object already has theme_preference from lightweight auth
    const response = NextResponse.json({
      theme: user.theme_preference || 'standard',
    });
    
    // Add caching headers to reduce API calls
    response.headers.set('Cache-Control', 'private, max-age=3600'); // 1 hour
    
    return response;
  } catch (error) {
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
  const authResult = await withLightAuth();
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  const user = authResult.user!;

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

    // Log the theme change asynchronously (don't wait)
    AuditLogger.logFromRequest(request, {
      tableName: 'users',
      recordId: user.id.toString(),
      operation: 'UPDATE',
      userId: user.id,
      staffId: undefined,
      source: 'WEB_UI',
      description: `Theme changed to ${themeToSave}`,
    }).catch(err => console.error('Audit log failed:', err));

    return NextResponse.json({
      success: true,
      theme: themeToSave,
    });
  } catch (error) {
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