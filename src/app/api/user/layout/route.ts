import { NextRequest, NextResponse } from 'next/server';
import { withLightAuth } from '@/lib/auth/auth-utils-lite';
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
  try {
    const authResult = await withLightAuth();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }
    const user = authResult.user!;

    // User object already has layout_preference from lightweight auth
    const response = NextResponse.json({
      layout: user.layout_preference || 'modern',
    });
    
    // Add caching headers to reduce API calls
    response.headers.set('Cache-Control', 'private, max-age=3600'); // 1 hour
    
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
  const authResult = await withLightAuth();
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  const user = authResult.user!;

  try {
    const body = await request.json();
    const validatedData = layoutSchema.parse(body);
    
    // Use layoutId if provided, otherwise use layout
    const layoutToSave = validatedData.layoutId || validatedData.layout || 'modern';

    // Update user's layout preference (optimized query)
    await prisma.user.update({
      where: { id: user.id },
      data: { layout_preference: layoutToSave },
      select: { id: true }, // Only select what we need
    });

    // Log the layout change asynchronously (don't wait)
    AuditLogger.logFromRequest(request, {
      tableName: 'users',
      recordId: user.id.toString(),
      operation: 'UPDATE',
      userId: user.id,
      staffId: undefined,
      source: 'WEB_UI',
      description: `Layout changed to ${layoutToSave}`,
    }).catch(err => console.error('Audit log failed:', err));

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