import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit/audit-logger';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { RateLimiters, getClientIdentifier } from '@/lib/utils/rate-limit';

// More flexible validation to handle various color formats
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

const customThemeSchema = z.object({
  name: z.string().min(1).max(50),
  colors: z.record(z.string()).refine((colors) => {
    // Allow any color properties but validate hex format when present
    for (const [key, value] of Object.entries(colors)) {
      if (typeof value === 'string' && value.startsWith('#')) {
        if (!hexColorRegex.test(value)) {
          return false;
        }
      }
    }
    return true;
  }, {
    message: "Invalid hex color format"
  }),
  isDark: z.boolean().optional(),
});

// GET /api/user/custom-theme - Get user's custom theme
export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Authentication required' }, { status: auth.statusCode || 401 });
    }

    // Get custom theme from database (fast query)
    const userData = await prisma.(user as Record<string, unknown>).findUnique({
      where: { id: auth.user.id },
      select: { custom_theme: true }
    });
    
    const response = NextResponse.json({
      customTheme: userData?.custom_theme ?? null,
    });
    
    response.headers.set('Cache-Control', 'private, max-age=3600'); // 1 hour
    return response;
  } catch (error: unknown) {
    console.error('Error fetching custom theme:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom theme' },
      { status: 500 }
    );
  }
}

// PUT /api/user/custom-theme - Save or update user's custom theme
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

  try {
    const body = await request.json() as Record<string, unknown> as Record<string, unknown>;
    const validatedData = customThemeSchema.parse(body);

    // Save custom theme to user profile (optimized)
    await prisma.(user as Record<string, unknown>).update({
      where: { id: auth.user.id },
      data: {
        custom_theme: validatedData,
        theme_preference: 'custom', // Set theme preference to custom
      },
      select: { id: true }, // Only select what we need
    });

    // Log the custom theme save asynchronously (don't wait)
    AuditLogger.logFromRequest(request, {
      tableName: 'users',
      recordId: auth.user.id.toString(),
      operation: 'UPDATE',
      userId: auth.user.id,
      staffId: auth.(user.staff as Record<string, unknown> | null)?.id,
      source: 'WEB_UI',
      description: `Custom theme "${validatedData.name}" saved`,
    }).catch(err => console.error('Audit log failed:', err));

    return NextResponse.json({
      success: true,
      customTheme: validatedData,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid custom theme data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error saving custom theme:', error);
    return NextResponse.json(
      { error: 'Failed to save custom theme' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/custom-theme - Delete user's custom theme
export async function DELETE(request: NextRequest) {
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

  try {
    // Clear custom theme and reset to default (optimized)
    await prisma.(user as Record<string, unknown>).update({
      where: { id: auth.user.id },
      data: {
        custom_theme: Prisma.JsonNull,
        theme_preference: 'standard',
      },
      select: { id: true }, // Only select what we need
    });

    // Log the custom theme deletion asynchronously (don't wait)
    AuditLogger.logFromRequest(request, {
      tableName: 'users',
      recordId: auth.user.id.toString(),
      operation: 'UPDATE',
      userId: auth.user.id,
      staffId: auth.(user.staff as Record<string, unknown> | null)?.id,
      source: 'WEB_UI',
      description: 'Custom theme deleted',
    }).catch(err => console.error('Audit log failed:', err));

    return NextResponse.json({
      success: true,
    });
  } catch (error: unknown) {
    console.error('Error deleting custom theme:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom theme' },
      { status: 500 }
    );
  }
}