import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Testing production database connection...');
    
    // Test basic database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    
    // Test users table
    const userCount = await prisma.users.count();
    console.log('📊 Total users:', userCount);
    
    // Try to find the admin user
    const adminUser = await prisma.users.findUnique({
      where: { email: 'admin@school.edu' },
      select: {
        id: true,
        email: true,
        name: true,
        is_system_admin: true,
        is_school_admin: true,
        hashed_password: true
      }
    });
    
    console.log('👤 Admin user found:', !!adminUser);
    if (adminUser) {
      console.log('📋 Admin details:', {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        is_system_admin: adminUser.is_system_admin,
        is_school_admin: adminUser.is_school_admin,
        hasPassword: !!adminUser.hashed_password
      });
    }
    
    return NextResponse.json({
      success: true,
      database: 'connected',
      userCount,
      adminExists: !!adminUser,
      adminUser: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        is_system_admin: adminUser.is_system_admin,
        is_school_admin: adminUser.is_school_admin,
        hasPassword: !!adminUser.hashed_password
      } : null
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      database: 'failed'
    }, { status: 500 });
  }
}