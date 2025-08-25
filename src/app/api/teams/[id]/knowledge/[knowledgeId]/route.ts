import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/api-auth';
import { z } from 'zod';

// Update knowledge schema
const updateKnowledgeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).nullable().optional(),
  type: z.string().optional(),
  category: z.string().nullable().optional(),
  url: z.string().url().nullable().optional(),
  content: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  is_public: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/teams/[id]/knowledge/[knowledgeId]
 * Get a specific knowledge resource
 */
export async function GET(
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
    const knowledgeId = parseInt(resolvedParams.knowledgeId);

    const knowledge = await prisma.team_knowledge.findUnique({
      where: {
        id: knowledgeId,
        team_id: teamId
      },
      include: {
        created_by: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    });

    if (!knowledge) {
      return NextResponse.json(
        { error: 'Knowledge resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ knowledge });

  } catch (error) {
    console.error('Error fetching knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge resource' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teams/[id]/knowledge/[knowledgeId]
 * Update a knowledge resource
 */
export async function PUT(
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
    const knowledgeId = parseInt(resolvedParams.knowledgeId);
    const body = await request.json() as Record<string, unknown>;

    // Validate input
    const validatedData = updateKnowledgeSchema.parse(body);

    // Check if user is team member
    const { _user } = auth;
    const staff = await prisma.staff.findFirst({
      where: { user_id: user.id }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const teamMember = await prisma.team_members.findFirst({
      where: {
        team_id: teamId,
        staff_id: staff.id
      }
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 }
      );
    }

    // Check if knowledge exists and user has permission to edit
    const existingKnowledge = await prisma.team_knowledge.findUnique({
      where: { 
        id: knowledgeId,
        team_id: teamId
      }
    });

    if (!existingKnowledge) {
      return NextResponse.json(
        { error: 'Knowledge resource not found' },
        { status: 404 }
      );
    }

    // Only creator or team lead can edit
    if (existingKnowledge.created_by_staff_id !== staff.id && teamMember.role !== 'LEAD') {
      return NextResponse.json(
        { error: 'You do not have permission to edit this resource' },
        { status: 403 }
      );
    }

    // Update knowledge
    const updatedKnowledge = await prisma.team_knowledge.update({
      where: { id: knowledgeId },
      data: {
        ...validatedData,
        updated_at: new Date();
      },
      include: {
        created_by: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      knowledge: updatedKnowledge,
      message: 'Knowledge resource updated successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge resource' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/[id]/knowledge/[knowledgeId]
 * Delete a knowledge resource
 */
export async function DELETE(
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
    const knowledgeId = parseInt(resolvedParams.knowledgeId);

    // Check if user is team member
    const { _user } = auth;
    const staff = await prisma.staff.findFirst({
      where: { user_id: user.id }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    const teamMember = await prisma.team_members.findFirst({
      where: {
        team_id: teamId,
        staff_id: staff.id
      }
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 }
      );
    }

    // Check if knowledge exists and user has permission to delete
    const existingKnowledge = await prisma.team_knowledge.findUnique({
      where: { 
        id: knowledgeId,
        team_id: teamId
      }
    });

    if (!existingKnowledge) {
      return NextResponse.json(
        { error: 'Knowledge resource not found' },
        { status: 404 }
      );
    }

    // Only creator or team lead can delete
    if (existingKnowledge.created_by_staff_id !== staff.id && teamMember.role !== 'LEAD') {
      return NextResponse.json(
        { error: 'You do not have permission to delete this resource' },
        { status: 403 }
      );
    }

    // Delete knowledge
    await prisma.team_knowledge.delete({
      where: { id: knowledgeId }
    });

    return NextResponse.json({ 
      message: 'Knowledge resource deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge resource' },
      { status: 500 }
    );
  }
}