// Environment Validation API Endpoint
// Provides debugging and validation information

import { NextResponse } from 'next/server';
import { validateEnvironment, getEnvironmentReport } from '@/lib/env-validation';

export async function GET() {
  try {
    const report = getEnvironmentReport();
    
    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Environment validation failed'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const validation = validateEnvironment();
    
    return NextResponse.json({
      success: validation.isValid,
      validation,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    }, { status: 500 });
  }
}