import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, props: Props) {
  const params = await props.params;
  
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    const { _searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const teamId = params.id;

    // Fetch comprehensive team data
    const team = await prisma.teams.findUnique({
      where: { id: teamId },
      include: {
        team_members: {
          include: {
            staff: {
              include: {
                users: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                },
                role: {
                  select: {
                    id: true,
                    title: true
                  }
                },
                department: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        team_knowledge: {
          select: {
            id: true,
            title: true,
            content: true,
            type: true,
            tags: true,
            is_pinned: true,
            views_count: true,
            downloads_count: true,
            created_at: true,
            updated_at: true,
            created_by_staff: {
              include: {
                users: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Prepare export data
    const exportData = {
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        type: team.type,
        is_active: team.is_active,
        created_at: team.created_at,
        updated_at: team.updated_at,
        metadata: team.metadata
      },
      members: team.team_members.map(member => ({
        id: member.id,
        role: member.role,
        joined_at: member.joined_at,
        user: {
          id: member.staff.users.id,
          name: member.staff.users.name,
          email: member.staff.users.email
        },
        staff: {
          id: member.staff.id,
          role: member.staff.role?.title,
          department: member.staff.department?.name
        }
      })),
      knowledge_resources: team.team_knowledge.map(resource => ({
        id: resource.id,
        title: resource.title,
        content: resource.content,
        type: resource.type,
        tags: resource.tags,
        is_pinned: resource.is_pinned,
        views_count: resource.views_count,
        downloads_count: resource.downloads_count,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
        created_by: {
          name: resource.created_by_staff?.users.name,
          email: resource.created_by_staff?.users.email
        }
      })),
      export_metadata: {
        exported_at: new Date().toISOString(),
        exported_by: authResult.user!.email,
        format: format,
        total_members: team.team_members.length,
        total_resources: team.team_knowledge.length
      }
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvLines = [
        // Header
        'Type,ID,Name,Email,Role,Department,Joined/Created,Title,Content,Tags,Views,Downloads',
        
        // Members
        ...exportData.members.map(member => 
          `Member,${member.id},"${member.user.name}","${member.user.email}","${member.staff.role || ''}","${member.staff.department || ''}",${member.joined_at},"","","","",""`
        ),
        
        // Resources
        ...exportData.knowledge_resources.map(resource =>
          `Resource,${resource.id},"${resource.created_by.name || ''}","","","",${resource.created_at},"${resource.title}","${(resource.content || '').replace(/"/g, '""')}","${(resource.tags || []).join('; ')}",${resource.views_count},${resource.downloads_count}`
        )
      ];

      const csvContent = csvLines.join('\n');
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${team.name}-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Return JSON format
    return NextResponse.json(exportData);

  } catch (error: unknown) {
    console.error('Error exporting team data:', error);
    return NextResponse.json(
      { error: 'Failed to export team data' },
      { status: 500 }
    );
  }
}