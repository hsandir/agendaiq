import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    schema_analysis: {} as any,
    tests: [] as any[]
  };

  try {
    // Check users table structure
    console.log('=== USERS TABLE SCHEMA CHECK ===');
    
    // Test 1: Check if users table exists and get first user
    try {
      const users = await prisma.users.findMany({
        take: 1,
        select: {
          id: true,
          email: true,
          name: true,
          // Try to select hashed_password to see if it exists
        }
      });
      
      results.tests.push({
        test: 'Users table basic access',
        status: 'SUCCESS',
        user_count: users.length,
        sample_user: users[0] || null
      });
    } catch (error: any) {
      results.tests.push({
        test: 'Users table basic access',
        status: 'FAILED',
        error: error.message
      });
    }

    // Test 2: Check specific user with admin@school.edu
    try {
      const adminUser = await prisma.users.findUnique({
        where: { email: 'admin@school.edu' },
        select: {
          id: true,
          email: true,
          name: true,
          // Do not try to select hashed_password yet
          created_at: true,
          updated_at: true
        }
      });

      results.tests.push({
        test: 'Admin user lookup',
        status: adminUser ? 'SUCCESS' : 'NOT_FOUND',
        user_found: !!adminUser,
        admin_user: adminUser
      });
    } catch (error: any) {
      results.tests.push({
        test: 'Admin user lookup',
        status: 'FAILED',
        error: error.message
      });
    }

    // Test 3: Raw SQL query to check table structure
    try {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;

      results.schema_analysis.users_columns = columns;
      results.tests.push({
        test: 'Users table schema inspection',
        status: 'SUCCESS',
        columns_found: Array.isArray(columns) ? columns.length : 0,
        has_hashed_password: Array.isArray(columns) ? 
          columns.some((col: any) => col.column_name === 'hashed_password') : false
      });
    } catch (error: any) {
      results.tests.push({
        test: 'Users table schema inspection',
        status: 'FAILED',
        error: error.message
      });
    }

    // Test 4: Check if password-related columns exist with different names
    try {
      const passwordColumns = await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
        AND (column_name LIKE '%password%' OR column_name LIKE '%hash%');
      `;

      results.tests.push({
        test: 'Password-related columns search',
        status: 'SUCCESS', 
        password_columns: passwordColumns
      });
    } catch (error: any) {
      results.tests.push({
        test: 'Password-related columns search',
        status: 'FAILED',
        error: error.message
      });
    }

  } catch (error: any) {
    results.tests.push({
      test: 'Overall schema check',
      status: 'FAILED',
      error: error.message
    });
  }

  console.log('=== DB SCHEMA CHECK RESULTS ===');
  console.log(JSON.stringify(results, null, 2));

  return NextResponse.json(results);
}