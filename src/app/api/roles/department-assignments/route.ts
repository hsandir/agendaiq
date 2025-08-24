import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { AuditLogger } from '@/lib/audit/audit-logger';

const assignmentSchema = z.object({
  assignments: z.array(z.object({
    roleId: z.number(),
    departmentId: z.number().nullable()
  }))
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user and check operations admin permissions
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.ROLE_MANAGE });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }
    const user = authResult.user!;

    // Parse and validate request body
    const body = await request.json() as Record<string, unknown> as Record<string, unknown>;
    const result = assignmentSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: result.error.issues },
        { status: 400 }
      );
    }

    const { _assignments } = result.data;

    // Update role department assignments in database
    const updatePromises = assignments.map(async ({ roleId, departmentId }) => {
      const role = await prisma.role.update({
        where: { id: roleId },
        data: { department_id: parseInt(departmentId) },
        include: {
          department: true
        }
      });

      // Log the assignment change
      await AuditLogger.logFromRequest(request, {
        tableName: 'role',
        recordId: roleId.toString(),
        operation: 'UPDATE',
        userId: user.id,
        staffId: (user.staff as Record<string, unknown> | null)?.id,
        source: 'SYSTEM', 
        description: `Role "${role.key ?? 'UNKNOWN_ROLE'}" assigned to department: ${role.department?.name ?? 'Unassigned'}`
      });

      return role;
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Role department assignments updated successfully',
      updatedCount: assignments.length
    });

  } catch (error: unknown) {
    console.error('Error updating role department assignments:', error);
    return NextResponse.json(
      { error: 'Failed to update role assignments' },
      { status: 500 }
    );
  }
}