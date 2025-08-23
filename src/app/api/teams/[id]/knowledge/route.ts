import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { z } from 'zod';
import { FEATURES } from '@/lib/features/feature-flags';

// Knowledge creation schema
const createKnowledgeSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  type: z.enum(['DOCUMENT', 'LINK', 'NOTE', 'TEMPLATE', 'GUIDE', 'POLICY']),
  tags: z.array(z.string()).optional(),
  url: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Knowledge update schema
const updateKnowledgeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  url: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
  is_pinned: z.boolean().optional(),
});

/**
 * GET /api/teams/[id]/knowledge
 * Get all knowledge resources for a team
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check feature flag
    if (!FEATURES.TEAMS.enabled) {
      return NextResponse.json(
        { error: 'Teams feature is not enabled' },
        { status: 404 }
      );
    }

    const auth = await withAuth(request, { 
      requireAuth: true,
      requireCapability: Capability.MEETINGS_VIEW 
    });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const { user } = auth;
    const teamId = params.id;

    // Get user's staff record
    const staff = await prisma.staff.findFirst({
      where: { user_id: user.id }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    // Check if team exists and user has access
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        team_members: true
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user is team member or admin
    const isMember = team.team_members.some(member => member.staff_id === staff.id);
    const isAdmin = user.is_system_admin || user.is_school_admin;

    if (!isMember && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to view this team\'s knowledge base' },
        { status: 403 }
      );
    }

    // Get knowledge resources with search and filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const tags = searchParams.get('tags')?.split(',');

    const where: any = {
      team_id: teamId,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    const knowledge = await prisma.teamKnowledge.findMany({
      where,
      include: {
        created_by_user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        _count: {
          select: {
            views: true,
          }
        }
      },
      orderBy: [
        { is_pinned: 'desc' },
        { created_at: 'desc' }
      ]
    });

    // Track view for analytics
    if (knowledge.length > 0 && staff) {
      await prisma.teamKnowledgeView.createMany({
        data: knowledge.slice(0, 5).map(k => ({
          knowledge_id: k.id,
          user_id: user.id,
          viewed_at: new Date(),
        })),
        skipDuplicates: true,
      }).catch(() => {
        // Ignore duplicate view errors
      });
    }

    return NextResponse.json({
      knowledge,
      total: knowledge.length
    });

  } catch (error) {
    console.error('Error fetching team knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge resources' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams/[id]/knowledge
 * Create a new knowledge resource for a team
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check feature flag
    if (!FEATURES.TEAMS.enabled) {
      return NextResponse.json(
        { error: 'Teams feature is not enabled' },
        { status: 404 }
      );
    }

    const auth = await withAuth(request, { 
      requireAuth: true,
      requireCapability: Capability.MEETINGS_CREATE 
    });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const { user } = auth;
    const teamId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createKnowledgeSchema.parse(body);

    // Get user's staff record
    const staff = await prisma.staff.findFirst({
      where: { user_id: user.id }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    // Check if team exists and user is a member
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        team_members: true
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user is team member
    const isMember = team.team_members.some(member => member.staff_id === staff.id);

    if (!isMember && !user.is_system_admin && !user.is_school_admin) {
      return NextResponse.json(
        { error: 'You must be a team member to add knowledge resources' },
        { status: 403 }
      );
    }

    // Create the knowledge resource
    const knowledge = await prisma.teamKnowledge.create({
      data: {
        team_id: teamId,
        title: validatedData.title,
        content: validatedData.content,
        type: validatedData.type,
        tags: validatedData.tags || [],
        url: validatedData.url,
        metadata: validatedData.metadata || {},
        created_by: user.id,
        is_pinned: false,
      },
      include: {
        created_by_user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        _count: {
          select: {
            views: true,
          }
        }
      }
    });

    return NextResponse.json({
      knowledge,
      message: 'Knowledge resource created successfully'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating knowledge resource:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge resource' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teams/[id]/knowledge
 * Update a knowledge resource
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check feature flag
    if (!FEATURES.TEAMS.enabled) {
      return NextResponse.json(
        { error: 'Teams feature is not enabled' },
        { status: 404 }
      );
    }

    const auth = await withAuth(request, { 
      requireAuth: true,
      requireCapability: Capability.MEETINGS_UPDATE 
    });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const { user } = auth;
    const teamId = params.id;

    // Get knowledge ID from query params
    const { searchParams } = new URL(request.url);
    const knowledgeId = searchParams.get('knowledge_id');

    if (!knowledgeId) {
      return NextResponse.json(
        { error: 'Knowledge ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateKnowledgeSchema.parse(body);

    // Get user's staff record
    const staff = await prisma.staff.findFirst({
      where: { user_id: user.id }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    // Check if knowledge exists
    const knowledge = await prisma.teamKnowledge.findUnique({
      where: { id: knowledgeId },
      include: {
        team: {
          include: {
            team_members: true
          }
        }
      }
    });

    if (!knowledge || knowledge.team_id !== teamId) {
      return NextResponse.json(
        { error: 'Knowledge resource not found' },
        { status: 404 }
      );
    }

    // Check permissions: creator, team lead, or admin can edit
    const isCreator = knowledge.created_by === user.id;
    const isTeamLead = knowledge.team.team_members.some(
      member => member.staff_id === staff.id && member.role === 'LEAD'
    );
    const isAdmin = user.is_system_admin || user.is_school_admin;

    if (!isCreator && !isTeamLead && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this resource' },
        { status: 403 }
      );
    }

    // Update the knowledge resource
    const updatedKnowledge = await prisma.teamKnowledge.update({
      where: { id: knowledgeId },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.content && { content: validatedData.content }),
        ...(validatedData.tags && { tags: validatedData.tags }),
        ...(validatedData.url !== undefined && { url: validatedData.url }),
        ...(validatedData.metadata && { metadata: validatedData.metadata }),
        ...(validatedData.is_pinned !== undefined && { is_pinned: validatedData.is_pinned }),
        updated_at: new Date(),
      },
      include: {
        created_by_user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        _count: {
          select: {
            views: true,
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

    console.error('Error updating knowledge resource:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge resource' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/[id]/knowledge
 * Delete a knowledge resource
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check feature flag
    if (!FEATURES.TEAMS.enabled) {
      return NextResponse.json(
        { error: 'Teams feature is not enabled' },
        { status: 404 }
      );
    }

    const auth = await withAuth(request, { 
      requireAuth: true,
      requireCapability: Capability.MEETINGS_DELETE 
    });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const { user } = auth;
    const teamId = params.id;

    // Get knowledge ID from query params
    const { searchParams } = new URL(request.url);
    const knowledgeId = searchParams.get('knowledge_id');

    if (!knowledgeId) {
      return NextResponse.json(
        { error: 'Knowledge ID is required' },
        { status: 400 }
      );
    }

    // Get user's staff record
    const staff = await prisma.staff.findFirst({
      where: { user_id: user.id }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    // Check if knowledge exists
    const knowledge = await prisma.teamKnowledge.findUnique({
      where: { id: knowledgeId },
      include: {
        team: {
          include: {
            team_members: true
          }
        }
      }
    });

    if (!knowledge || knowledge.team_id !== teamId) {
      return NextResponse.json(
        { error: 'Knowledge resource not found' },
        { status: 404 }
      );
    }

    // Check permissions: creator, team lead, or admin can delete
    const isCreator = knowledge.created_by === user.id;
    const isTeamLead = knowledge.team.team_members.some(
      member => member.staff_id === staff.id && member.role === 'LEAD'
    );
    const isAdmin = user.is_system_admin || user.is_school_admin;

    if (!isCreator && !isTeamLead && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this resource' },
        { status: 403 }
      );
    }

    // Delete associated views first
    await prisma.teamKnowledgeView.deleteMany({
      where: { knowledge_id: knowledgeId }
    });

    // Delete the knowledge resource
    await prisma.teamKnowledge.delete({
      where: { id: knowledgeId }
    });

    return NextResponse.json({
      message: 'Knowledge resource deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting knowledge resource:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge resource' },
      { status: 500 }
    );
  }
}