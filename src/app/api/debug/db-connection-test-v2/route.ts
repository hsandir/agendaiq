import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    password_analysis: {
      raw_password: 's?r&v6vXSCEc_8A',
      url_encoded: 's%3Fr%26v6vXSCEc_8A',
      explanation: 'Special characters ? and & must be URL encoded in connection strings'
    },
    tests: [] as any[]
  };

  // Test 1: Production connection strings with proper encoding
  const encodedPassword = 's%3Fr%26v6vXSCEc_8A';
  
  try {
    console.log('=== DB CONNECTION TEST: Direct connection with URL-encoded password ===');
    const directUrlEncoded = `postgresql://postgres:${encodedPassword}@db.tvhqasooledcffwogbvd.supabase.co:5432/postgres`;
    console.log('Direct URL preview:', directUrlEncoded.substring(0, 70) + '...');
    
    const prisma1 = new PrismaClient({
      datasources: {
        db: {
          url: directUrlEncoded
        }
      }
    });
    
    const result1 = await prisma1.$queryRaw`SELECT version()`;
    await prisma1.$disconnect();
    
    testResults.tests.push({
      test: 'Direct connection (URL-encoded password)',
      status: 'SUCCESS',
      url_preview: directUrlEncoded.substring(0, 70) + '...',
      result: result1
    });
  } catch (error: any) {
    testResults.tests.push({
      test: 'Direct connection (URL-encoded password)',
      status: 'FAILED',
      error: error.message,
      code: error.code
    });
  }

  // Test 2: Session pooler with URL-encoded password
  try {
    console.log('=== DB CONNECTION TEST: Session pooler with URL-encoded password ===');
    const poolerUrlEncoded = `postgresql://postgres:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
    console.log('Pooler URL preview:', poolerUrlEncoded.substring(0, 70) + '...');
    
    const prisma2 = new PrismaClient({
      datasources: {
        db: {
          url: poolerUrlEncoded
        }
      }
    });
    
    const result2 = await prisma2.$queryRaw`SELECT version()`;
    await prisma2.$disconnect();
    
    testResults.tests.push({
      test: 'Session pooler (URL-encoded password)',
      status: 'SUCCESS',
      url_preview: poolerUrlEncoded.substring(0, 70) + '...',
      result: result2
    });
  } catch (error: any) {
    testResults.tests.push({
      test: 'Session pooler (URL-encoded password)',
      status: 'FAILED',
      error: error.message,
      code: error.code
    });
  }

  // Test 3: Verify current production env vars
  try {
    console.log('=== PRODUCTION ENV ANALYSIS ===');
    const currentDatabaseUrl = process.env.DATABASE_URL || '';
    const currentDirectUrl = process.env.DIRECT_URL || '';
    
    testResults.tests.push({
      test: 'Production Environment Analysis',
      status: 'INFO',
      details: {
        database_url_contains_encoded_password: currentDatabaseUrl.includes('s%3Fr%26v6vXSCEc_8A'),
        direct_url_contains_encoded_password: currentDirectUrl.includes('s%3Fr%26v6vXSCEc_8A'),
        database_url_preview: currentDatabaseUrl.substring(0, 70) + '...',
        direct_url_preview: currentDirectUrl.substring(0, 70) + '...'
      }
    });
  } catch (error: any) {
    testResults.tests.push({
      test: 'Production Environment Analysis',
      status: 'FAILED',
      error: error.message
    });
  }

  console.log('=== DB CONNECTION TEST V2 RESULTS ===');
  console.log(JSON.stringify(testResults, null, 2));

  return NextResponse.json(testResults);
}