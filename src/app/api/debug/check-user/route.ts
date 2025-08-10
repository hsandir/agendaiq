import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      is_system_admin: user.is_system_admin,
      is_school_admin: user.is_school_admin,
      capabilities: user.capabilities,
      staff: user.staff ? {
        id: user.staff.id,
        role: user.staff.role,
        department: user.staff.department?.name,
        school: user.staff.school?.name,
        district: user.staff.district?.name
      } : null
    });
  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json({ error: 'Failed to check user' }, { status: 500 });
  }
}