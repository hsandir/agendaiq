import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/api-auth';

/**
 * POST /api/teams/[id]/knowledge/[knowledgeId]/download
 * Track download for a knowledge resource
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; knowledgeId: string }> }
) {
  try {
    const auth = await withAuth(request, { requireAuth: true });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const resolvedParams = await params;
    const teamId = resolvedParams.id;
    const knowledgeId = resolvedParams.knowledgeId;

    // Update download count
    const knowledge = await prisma.team_knowledge.update({
      where: { 
        id: knowledgeId,
        team_id: teamId
      },
      data: {
        downloads_count: {
          increment: 1
        },
        metadata: {
          update: {
            last_downloaded_at: new Date().toISOString(),
            last_downloaded_by: auth.user?.id ?? 'unknown'
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      downloads_count: knowledge.downloads_count 
    });

  } catch (error) {
    console.error('Error tracking download:', error);
    return NextResponse.json(
      { error: 'Failed to track download' },
      { status: 500 }
    );
  }
}