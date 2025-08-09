import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
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
  const authResult = await withAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  const user = authResult.user!;

  try {
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { theme_preference: true },
    });

    return NextResponse.json({
      theme: userData?.theme_preference || 'classic-light',
    });
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
  const authResult = await withAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  const user = authResult.user!;

  try {
    const body = await request.json();
    const validatedData = themeSchema.parse(body);
    
    // Use themeId if provided, otherwise use theme
    const themeToSave = validatedData.themeId || validatedData.theme || 'standard';

    // Update user's theme preference (use upsert to handle missing records)
    await prisma.user.upsert({
      where: { id: user.id },
      update: { theme_preference: themeToSave },
      create: {
        id: user.id,
        email: user.email || '',
        name: user.name,
        theme_preference: themeToSave,
      },
    });

    // Log the theme change
    await AuditLogger.logFromRequest(request, {
      tableName: 'users',
      recordId: user.id.toString(),
      operation: 'UPDATE',
      userId: user.id,
      staffId: user.staff?.id,
      source: 'WEB_UI',
      description: `Theme changed to ${themeToSave}`,
    });

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