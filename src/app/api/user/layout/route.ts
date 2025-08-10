import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit/audit-logger';
import { z } from 'zod';

const layoutSchema = z.object({
  layoutId: z.string().optional(),
  layout: z.string().optional(),
}).refine(data => data.layoutId || data.layout, {
  message: "Either layoutId or layout must be provided"
});

// GET /api/user/layout - Get user's layout preference
export async function GET(request: NextRequest) {
  const authResult = await withAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  const user = authResult.user!;

  try {
    // Optimized query with minimal data selection
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { layout_preference: true },
    });

    const response = NextResponse.json({
      layout: userData?.layout_preference || 'modern',
    });

    // Add caching headers to reduce API calls
    response.headers.set('Cache-Control', 'private, max-age=300'); // 5 minutes
    
    return response;
  } catch (error) {
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
  const authResult = await withAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  const user = authResult.user!;

  try {
    const body = await request.json();
    const validatedData = layoutSchema.parse(body);
    
    // Use layoutId if provided, otherwise use layout
    const layoutToSave = validatedData.layoutId || validatedData.layout || 'modern';

    // Update user's layout preference (use upsert to handle missing records)
    await prisma.user.upsert({
      where: { id: user.id },
      update: { layout_preference: layoutToSave },
      create: {
        id: user.id,
        email: user.email || '',
        name: user.name,
        layout_preference: layoutToSave,
      },
    });

    // Log the layout change
    await AuditLogger.logFromRequest(request, {
      tableName: 'users',
      recordId: user.id.toString(),
      operation: 'UPDATE',
      userId: user.id,
      staffId: user.staff?.id,
      source: 'WEB_UI',
      description: `Layout changed to ${layoutToSave}`,
    });

    return NextResponse.json({
      success: true,
      layout: layoutToSave,
    });
  } catch (error) {
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