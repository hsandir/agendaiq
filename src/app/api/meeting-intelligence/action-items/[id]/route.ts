import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAuth(request);
  if (!authResult?.success) {
    return NextResponse.json({ error: authResult?.error }, { status: authResult?.statusCode });
  }

  try {
    const { __id } = await params;
    const itemId = parseInt(id);
    const { __status } = (await request.json()) as Record<__string, unknown>;
    
    const updateData: Record<string, unknown> = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date();
    }
    
    const updated = await prisma.meeting_action_items.update({
      where: { id: itemId },
      data: updateData
    });
    
    return NextResponse.json({ success: true, item: updated });
    
  } catch (error: unknown) {
    console.error('Update action item error:', error);
    return NextResponse.json(
      { error: 'Failed to update action item' },
      { status: 500 }
    );
  }
}