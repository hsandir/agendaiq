import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG USER CHECK START ===');
    
    const email = request.nextUrl.searchParams.get('email');
    console.log('Requested email:', email);
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    // Test basic database connection first
    console.log('Testing database connection...');
    const { prisma } = await import('@/lib/prisma');
    
    // Simple query to test connection
    console.log('Testing basic query...');
    const userCount = await prisma.users.count();
    console.log('User count:', userCount);

    // Look up the specific user
    console.log('Looking up user:', email);
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        hashed_password: true,
        two_factor_enabled: true,
        is_system_admin: true,
        is_school_admin: true
      }
    });

    console.log('User found:', !!user);
    
    if (!user) {
      console.log('User not found in database');
      return NextResponse.json({
        success: true,
        exists: false,
        userCount,
        message: `User ${email} not found in database`
      });
    }

    // Test password hash if it's the admin user
    let passwordTest = null;
    if (email === 'admin@school.edu' && user.hashed_password) {
      try {
        console.log('Testing password hash...');
        const bcrypt = await import('bcrypt');
        const testPassword = '1234';
        passwordTest = await bcrypt.default.compare(testPassword, user.hashed_password);
        console.log('Password test result:', passwordTest);
      } catch (error) {
        console.error('Password test error:', error);
        passwordTest = `Error testing password: ${error}`;
      }
    }

    console.log('=== DEBUG USER CHECK END ===');
    
    return NextResponse.json({
      success: true,
      exists: true,
      userCount,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPassword: !!user.hashed_password,
        passwordLength: user.hashed_password?.length || 0,
        twoFactorEnabled: user.two_factor_enabled,
        isSystemAdmin: user.is_system_admin,
        isSchoolAdmin: user.is_school_admin,
        passwordTest: passwordTest
      }
    });
  } catch (error) {
    console.error('=== DEBUG USER CHECK ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json({
      success: false,
      error: 'Database error',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}