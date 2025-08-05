import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { handleServerError, ApiError } from '@/lib/sentry/server-error-handler';
import { addBreadcrumb, Performance } from '@/lib/sentry/sentry-utils';

/**
 * Test endpoint for Sentry error tracking
 * This endpoint is for development/testing purposes only
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'simple';
  
  // Add breadcrumb for tracking
  addBreadcrumb('Test Sentry endpoint accessed', 'test', { type });
  
  try {
    switch (type) {
      case 'simple':
        // Simple error
        throw new Error('Test error from Sentry test endpoint');
        
      case 'api':
        // API error with custom status code
        throw new ApiError('Test API error', 400, { 
          endpoint: '/api/test-sentry',
          timestamp: new Date().toISOString() 
        });
        
      case 'unhandled':
        // Unhandled rejection
        Promise.reject(new Error('Unhandled promise rejection test'));
        return NextResponse.json({ message: 'Unhandled error triggered' });
        
      case 'performance':
        // Performance monitoring test
        return await Performance.measureRoute('test-sentry', async () => {
          // Simulate slow operation
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return NextResponse.json({ 
            message: 'Performance test completed',
            duration: '1000ms'
          });
        });
        
      case 'breadcrumb':
        // Test breadcrumbs
        addBreadcrumb('Step 1: Starting process', 'process');
        addBreadcrumb('Step 2: Processing data', 'process', { items: 10 });
        addBreadcrumb('Step 3: Error occurred', 'process', {}, 'error');
        
        throw new Error('Error after breadcrumb trail');
        
      case 'user-context':
        // Test with user context
        Sentry.withScope((scope) => {
          scope.setUser({
            id: 'test-user-123',
            email: 'test@example.com',
            username: 'testuser',
          });
          
          Sentry.captureException(new Error('Error with user context'));
        });
        
        return NextResponse.json({ 
          message: 'Error with user context sent to Sentry' 
        });
        
      case 'none':
        // Success case
        return NextResponse.json({ 
          message: 'No error - everything working correctly!',
          availableTypes: [
            'simple',
            'api', 
            'unhandled',
            'performance',
            'breadcrumb',
            'user-context',
            'none'
          ]
        });
        
      default:
        return NextResponse.json({ 
          error: 'Unknown test type',
          availableTypes: [
            'simple',
            'api', 
            'unhandled',
            'performance',
            'breadcrumb',
            'user-context',
            'none'
          ]
        }, { status: 400 });
    }
  } catch (error) {
    // Use the server error handler
    return handleServerError(error, request, {
      message: 'Test error handled by Sentry',
      context: { testType: type },
    });
  }
}

// Disable this endpoint in production
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }
  
  // Allow testing POST errors
  return GET(request);
}