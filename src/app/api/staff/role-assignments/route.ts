import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for bulk staff role assignment updates
const assignmentSchema = z.object({
  assignments: z.array(z.object({
    staffId: z.number(),
    newRoleId: z.number()
  }))
});

/**
 * PUT /api/staff/role-assignments
 * Bulk update staff role assignments
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    const { user } = authResult;

    // Only system admins and school admins can modify role assignments
    if (!user.is_system_admin && !(user as any).is_school_admin) {
      return NextResponse.json(
        { error: 'Insufficient permissions to modify role assignments' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json() as Record<string, unknown> as Record<string, unknown>;
    const validatedData = assignmentSchema.parse(body);

    // Get current user's context for security
    const userStaff = await prisma.staff.findFirst({
      where: { user_id: user.id },
      include: { school: true, district: true }
    });

    if (!userStaff) {
      return NextResponse.json(
        { error: 'User staff record not found' },
        { status: 404 }
      );
    }

    // Verify all staff members exist and are within user's organization
    const staffIds = validatedData.assignments.map(a => a.staffId);
    const roleIds = validatedData.assignments.map(a => a.newRoleId);

    const [staffMembers, roles] = await Promise.all([
      prisma.staff.findMany({
        where: {
          id: { in: staffIds },
          OR: [
            { school_id: userStaff.school_id },
            { district_id: userStaff.district_id }
          ]
        },
        include: {
          users: {
            select: { id: true, name: true, email: true }
          },
          role: {
            select: { id: true, title: true }
          }
        }
      }),
      prisma.role.findMany({
        where: {
          id: { in: roleIds },
          OR: [
            { department: { school_id: userStaff.school_id } },
            { department: { district_id: userStaff.district_id } },
            { department_id: null } // Global roles
          ]
        }
      })
    ]);

    // Validate that all staff and roles exist within the user's scope
    if (staffMembers.length !== staffIds.length) {
      return NextResponse.json(
        { error: 'Some staff members not found or not accessible' },
        { status: 404 }
      );
    }

    if (roles.length !== roleIds.length) {
      return NextResponse.json(
        { error: 'Some roles not found or not accessible' },
        { status: 404 }
      );
    }

    // Perform bulk update using transaction
    const updatedStaff = await prisma.$transaction(async (tx) => {
      const updates = [];
      
      for (const assignment of validatedData.assignments) {
        const updated = await tx.staff.update({
          where: { id: assignment.staffId },
          data: { 
            role_id: assignment.newRoleId,
            updated_at: new Date()
          },
          include: {
            users: {
              select: { id: true, name: true, email: true }
            },
            role: {
              select: { id: true, title: true, is_leadership: true }
            },
            department: {
              select: { id: true, name: true }
            }
          }
        });
        
        updates.push(updated);
      }
      
      return updates;
    });

    // Log the changes for audit
    console.log(`User ${user.email} updated ${validatedData.assignments.length} staff role assignments`);

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${validatedData.assignments.length} staff role assignment${validatedData.assignments.length !== 1 ? 's' : ''}`,
      updatedStaff: updatedStaff.map(staff => ({
        id: staff.id,
        name: staff.users.name,
        email: staff.users.email,
        oldRole: staffMembers.find(s => s.id === staff.id)?.role.title,
        newRole: staff.role.title,
        department: staff.department?.name
      }))
    });

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating staff role assignments:', error);
    return NextResponse.json(
      { error: 'Failed to update staff role assignments' },
      { status: 500 }
    );
  }
}