import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit/audit-logger';
import { z } from 'zod';

const themeSchema = z.object({
  theme: z.enum(['modern-purple', 'classic-light', 'dark-mode', 'high-contrast', 'nature-green']),
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

    // Update user's theme preference
    await prisma.user.update({
      where: { id: user.id },
      data: { theme_preference: validatedData.theme },
    });

    // Log the theme change
    await AuditLogger.logFromRequest(request, {
      tableName: 'users',
      recordId: user.id.toString(),
      operation: 'UPDATE',
      userId: user.id,
      staffId: user.staff?.id,
      source: 'theme_settings',
      description: `Theme changed to ${validatedData.theme}`,
    });

    return NextResponse.json({
      success: true,
      theme: validatedData.theme,
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