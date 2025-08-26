import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    env_vars_check: {
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
      DIRECT_URL_exists: !!process.env.DIRECT_URL,
      DIRECT_URL_length: process.env.DIRECT_URL?.length || 0,
      NEXTAUTH_SECRET_exists: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_SECRET_length: process.env.NEXTAUTH_SECRET?.length || 0
    },
    tests: [] as any[]
  };

  // Test 1: Current DATABASE_URL from env
  const currentUrl = process.env.DATABASE_URL;
  try {
    console.log('=== DB CONNECTION TEST 1: Current DATABASE_URL ===');
    console.log('DATABASE_URL length:', currentUrl?.length);
    console.log('DATABASE_URL preview:', currentUrl?.substring(0, 50) + '...');
    
    const prisma1 = new PrismaClient({
      datasources: {
        db: {
          url: currentUrl
        }
      }
    });
    
    const result1 = await prisma1.$queryRaw`SELECT version()`;
    await prisma1.$disconnect();
    
    testResults.tests.push({
      test: 'Current DATABASE_URL',
      status: 'SUCCESS',
      url_preview: currentUrl?.substring(0, 50) + '...',
      url_length: currentUrl?.length,
      result: result1
    });
  } catch (error: any) {
    testResults.tests.push({
      test: 'Current DATABASE_URL', 
      status: 'FAILED',
      error: error.message,
      code: error.code,
      url_length: currentUrl?.length,
      url_preview: currentUrl?.substring(0, 50) + '...',
      url_last_10_chars: currentUrl?.slice(-10)
    });
  }

  // Test 2: Current DIRECT_URL from env
  const directUrl = process.env.DIRECT_URL;  
  try {
    console.log('=== DB CONNECTION TEST 2: Current DIRECT_URL ===');
    console.log('DIRECT_URL length:', directUrl?.length);
    console.log('DIRECT_URL preview:', directUrl?.substring(0, 50) + '...');
    
    const prisma2 = new PrismaClient({
      datasources: {
        db: {
          url: directUrl
        }
      }
    });
    
    const result2 = await prisma2.$queryRaw`SELECT version()`;
    await prisma2.$disconnect();
    
    testResults.tests.push({
      test: 'Current DIRECT_URL',
      status: 'SUCCESS', 
      url_preview: directUrl?.substring(0, 50) + '...',
      url_length: directUrl?.length,
      result: result2
    });
  } catch (error: any) {
    testResults.tests.push({
      test: 'Current DIRECT_URL',
      status: 'FAILED',
      error: error.message,
      code: error.code,
      url_length: directUrl?.length,
      url_preview: directUrl?.substring(0, 50) + '...',
      url_last_10_chars: directUrl?.slice(-10)
    });
  }

  // Test 3: Manually constructed URL with decoded password
  try {
    console.log('=== DB CONNECTION TEST 3: Manually decoded password ===');
    const manualUrl = 'postgresql://postgres:s?r&v6vXSCEc_8A@db.tvhqasooledcffwogbvd.supabase.co:5432/postgres';
    console.log('Manual URL preview:', manualUrl.substring(0, 50) + '...');
    
    const prisma3 = new PrismaClient({
      datasources: {
        db: {
          url: manualUrl
        }
      }
    });
    
    const result3 = await prisma3.$queryRaw`SELECT version()`;
    await prisma3.$disconnect();
    
    testResults.tests.push({
      test: 'Manual URL (decoded password)',
      status: 'SUCCESS',
      url_preview: manualUrl.substring(0, 50) + '...',
      result: result3
    });
  } catch (error: any) {
    testResults.tests.push({
      test: 'Manual URL (decoded password)',
      status: 'FAILED', 
      error: error.message,
      code: error.code
    });
  }

  // Test 4: Try with session pooler and decoded password
  try {
    console.log('=== DB CONNECTION TEST 4: Session pooler with decoded password ===');
    const poolerUrl = 'postgresql://postgres:s?r&v6vXSCEc_8A@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1';
    console.log('Pooler URL preview:', poolerUrl.substring(0, 50) + '...');
    
    const prisma4 = new PrismaClient({
      datasources: {
        db: {
          url: poolerUrl
        }
      }
    });
    
    const result4 = await prisma4.$queryRaw`SELECT version()`;
    await prisma4.$disconnect();
    
    testResults.tests.push({
      test: 'Session pooler (decoded password)',
      status: 'SUCCESS',
      url_preview: poolerUrl.substring(0, 50) + '...',
      result: result4
    });
  } catch (error: any) {
    testResults.tests.push({
      test: 'Session pooler (decoded password)',
      status: 'FAILED',
      error: error.message, 
      code: error.code
    });
  }

  console.log('=== DB CONNECTION TEST RESULTS ===');
  console.log(JSON.stringify(testResults, null, 2));

  return NextResponse.json(testResults);
}