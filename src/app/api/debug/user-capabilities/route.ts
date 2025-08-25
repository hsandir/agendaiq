import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability, getUserCapabilities } from '@/lib/auth/policy';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_DEBUG });
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Authentication required' }, { status: auth.statusCode || 401 });
    }
    const user = auth.user;

    // Get capabilities from database
    const capabilities = await getUserCapabilities(user.id);
    
    // Get user's role permissions
    const userWithRole = await prisma.users.findUnique({
      where: { id: user?.id },
      include: {
        staff: {
          include: {
            role: true
          }
        }
      }
    });

    return NextResponse.json({
      userId: user?.id,
      email: user?.email,
      is_system_admin: user?.is_system_admin,
      is_school_admin: user?.is_school_admin,
      
      // From getUserCapabilities
      capabilities: capabilities,
      capabilityCount: capabilities?.length,
      
      // Direct from database
      role: userWithRole?.staff?.[0]?.role?.key ?? null,
      roleKey: userWithRole?.staff?.[0]?.role?.key,
      permissions: [],
      
      // Check specific capabilities
      hasOpsBackup: capabilities.includes('ops:backup'),
      hasOpsLogs: capabilities.includes('ops:logs'),
      hasOpsHealth: capabilities.includes('ops:health'),
      hasOpsAlerts: capabilities.includes('ops:alerts'),
      
      // Debug info
      debugInfo: {
        sessionCapabilities: user.capabilities ?? [],
        computedCapabilities: capabilities,
        match: JSON.stringify(user?.capabilities) === JSON.stringify(capabilities)
      }
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error checking capabilities:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}