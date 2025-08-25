import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { filterFields, validateWrite } from "@/lib/auth/field-access-control";

// GET user by ID with field-level access control
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const authResult = await withAuth(request, { requireAuth: true });
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error }, 
        { status: authResult.statusCode }
      );
    }

    const currentUser = authResult.user!;
    const userId = params.id;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        staff: {
          include: {
            role: true,
            department: true,
            school: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    // Apply field-level filtering
    const filteredUser = filterFields(currentusers, 'User', user, user);

    return NextResponse.json({ user: filteredUser });

  } catch (error: unknown) {
    console.error('Get User Error:', error);
    return NextResponse.json(
      { error: "Failed to fetch user" }, 
      { status: 500 }
    );
  }
}

// PUT update user with field-level access control
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const authResult = await withAuth(request, { requireAuth: true });
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error }, 
        { status: authResult.statusCode }
      );
    }

    const currentUser = authResult.user!;
    const userId = params.id;
    const body = await request.json() as Record<string, unknown> as Record<string, unknown>;

    // Get existing user
    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    // Validate field-level write access
    const validation = validateWrite(currentusers, 'User', body, existingUser);
    
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: "Field access denied", 
          details: validation.errors 
        }, 
        { status: 403 }
      );
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.login_notifications_enabled !== undefined && { 
          login_notifications_enabled: body.login_notifications_enabled 
        }),
        ...(body.suspicious_alerts_enabled !== undefined && { 
          suspicious_alerts_enabled: body.suspicious_alerts_enabled 
        }),
        ...(body.remember_devices_enabled !== undefined && { 
          remember_devices_enabled: body.remember_devices_enabled 
        }),
        updated_at: new Date()
      }
    });

    // Apply field-level filtering to response
    const filteredUser = filterFields(currentusers, 'User', updatedusers, updatedUser);

    return NextResponse.json({ 
      user: filteredusers,
      message: "User updated successfully" 
    });

  } catch (error: unknown) {
    console.error('Update User Error:', error);
    return NextResponse.json(
      { error: "Failed to update user" }, 
      { status: 500 }
    );
  }
}