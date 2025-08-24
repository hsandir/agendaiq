import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/api-auth';

/**
 * POST /api/teams/[id]/knowledge/[knowledgeId]/view
 * Track view for a knowledge resource
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; knowledgeId: string } }
) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const teamId = params.id;
    const knowledgeId = parseInt(params.knowledgeId);

    // Update view count
    const knowledge = await prisma.team_knowledge.update({
      where: { 
        id: knowledgeId,
        team_id: teamId
      },
      data: {
        views_count: {
          increment: 1
        },
        metadata: {
          update: {
            last_viewed_at: new Date().toISOString(),
            last_viewed_by: auth.user.id
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      views_count: knowledge.views_count 
    });

  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}