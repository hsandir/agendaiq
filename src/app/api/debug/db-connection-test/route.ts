import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: [] as any[]
  };

  // Test 1: Current DATABASE_URL from env
  try {
    console.log('=== DB CONNECTION TEST 1: Current DATABASE_URL ===');
    const currentUrl = process.env.DATABASE_URL;
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
      result: result1
    });
  } catch (error: any) {
    testResults.tests.push({
      test: 'Current DATABASE_URL', 
      status: 'FAILED',
      error: error.message,
      code: error.code
    });
  }

  // Test 2: Current DIRECT_URL from env  
  try {
    console.log('=== DB CONNECTION TEST 2: Current DIRECT_URL ===');
    const directUrl = process.env.DIRECT_URL;
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
      result: result2
    });
  } catch (error: any) {
    testResults.tests.push({
      test: 'Current DIRECT_URL',
      status: 'FAILED',
      error: error.message,
      code: error.code
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