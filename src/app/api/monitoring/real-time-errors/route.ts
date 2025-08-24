import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { ErrorAnalyzer } from '@/lib/monitoring/error-analyzer';

interface StoredError extends ErrorReport {
  id: string;
  receivedAt: string;
  analysis: {
    category: string;
    severity: string;
    pageContext: string;
    description: string;
    impact: string;
    solutions: string[];
    priorityScore: number;
  };
  resolved: boolean;
  priority: number;
  resolvedAt?: string;
}

interface PageAnalytics {
  totalErrors: number;
  severityBreakdown: Record<string, number>;
  mostCommonCategory: string;
  errorRate: number;
  lastErrorTime: string | null;
  healthScore: number;
  recentErrors: number;
  criticalCount: number;
  highCount: number;
  averagePriority: number;
}

// In-memory storage for real-time errors (Redis can be used in production)
const errorStore: Map<string, StoredError[]> = new Map();
const MAX_ERRORS_PER_PAGE = 100;

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  pageLoadTime?: number;
  networkSpeed?: string;
  deviceInfo?: {
    type: string;
    os: string;
    browser: string;
    viewport: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const errorData: ErrorReport = await request.json();
    
    // Analyze the error
    const analysis = ErrorAnalyzer.analyzeError(
      errorData.message,
      errorData.url,
      errorData.stack
    );

    // Enhanced error object
    const enhancedError = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...errorData,
      analysis,
      receivedAt: new Date().toISOString(),
      source: request.headers.get('x-forwarded-for') ? 'production' : 'local',
      priority: analysis.priorityScore,
      resolved: false
    };

    // Store by page context
    const pageContext = analysis.pageContext;
    const existingErrors = errorStore.get(pageContext) || [];
    
    // Check if the same error already exists
    const isDuplicate = existingErrors.some(err => 
      err.message === errorData.message && 
      err.url === errorData.url &&
      Date.now() - new Date(err.timestamp).getTime() < 30000 // within 30 seconds
    );

    if (!isDuplicate) {
      existingErrors.unshift(enhancedError);
      
      // Check max limit
      if (existingErrors.length > MAX_ERRORS_PER_PAGE) {
        existingErrors.splice(MAX_ERRORS_PER_PAGE);
      }
      
      errorStore.set(pageContext, existingErrors);

      // Immediate notification for critical errors
      if (analysis.severity === 'critical') {
        await sendCriticalErrorNotification(enhancedError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      errorId: enhancedError.id,
      analysis: {
        category: analysis.category,
        severity: analysis.severity,
        solutions: analysis.solutions.slice(0, 2), // First 2 solutions
        estimatedFixTime: analysis.estimatedFixTime
      }
    });

  } catch (error: unknown) {
    console.error('Error processing real-time error report:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process error report' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_MONITORING });
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.statusCode });
    }
    const { _searchParams } = new URL(request.url);
    const pageContext = searchParams.get('page');
    const severity = searchParams.get('severity');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const resolved = searchParams.get('resolved') === 'true';

    let allErrors: StoredError[] = [];

    if (pageContext) {
      // Errors for a specific page
      allErrors = errorStore.get(pageContext) || [];
    } else {
      // All errors
      for (const errors of errorStore.values()) {
        allErrors.push(...errors);
      }
    }

    // Filter by severity
    if (severity && severity !== 'all') {
      allErrors = allErrors.filter(err => err.analysis.severity === severity);
    }

    // Filter by category
    if (category && category !== 'all') {
      allErrors = allErrors.filter(err => err.analysis.category === category);
    }

    // Filter by resolved status
    allErrors = allErrors.filter(err => err.resolved === resolved);

    // Sort by priority and timestamp
    allErrors.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
    });

    // Limit results
    allErrors = allErrors.slice(0, limit);

    // Generate comprehensive report
    const report = ErrorAnalyzer.generateErrorReport(allErrors);

    // Page-specific analytics
    const pageAnalytics = generatePageAnalytics();

    return NextResponse.json({
      success: true,
      errors: allErrors,
      report,
      pageAnalytics,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Error fetching real-time errors:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch errors' 
    }, { status: 500 });
  }
}

// Mark error as resolved
export async function PATCH(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_MONITORING });
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.statusCode });
    }
    const { _errorId, _resolved } = (await request.json()) as Record<_string, unknown>;
    
    // Find and update error in all pages
    for (const [page, errors] of errorStore.entries()) {
      const errorIndex = errors.findIndex(err => err.id === errorId);
      if (errorIndex !== -1) {
        errors[errorIndex].resolved = resolved;
        errors[errorIndex].resolvedAt = new Date().toISOString();
        errorStore.set(page, errors);
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update error status' 
    }, { status: 500 });
  }
}

async function sendCriticalErrorNotification(error: StoredError) {
  // For critical error notifications
  // In real applications: email, Slack, webhook integrations
  console.error('🚨 CRITICAL ERROR DETECTED:', {
    message: error.message,
    page: error.analysis.pageContext,
    timestamp: error.timestamp,
    solutions: error.analysis.solutions
  });

  // Future: Email/Slack notification integration
  // await sendSlackNotification(error);
  // await sendEmailAlert(error);
}

function generatePageAnalytics() {
  const analytics: Record<string, PageAnalytics> = {};
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  for (const [page, errors] of errorStore.entries()) {
    const recentErrors = errors.filter(err => {
      const errorTime = new Date(err.receivedAt).getTime();
      return errorTime > oneHourAgo.getTime();
    });

    analytics[page] = {
      totalErrors: errors.length,
      recentErrors: recentErrors.length,
      criticalCount: errors.filter(e => e.analysis.severity === 'critical').length,
      highCount: errors.filter(e => e.analysis.severity === 'high').length,
      mostCommonCategory: getMostCommonCategory(errors),
      averagePriority: errors.reduce((sum, e) => sum + e.priority, 0) / errors.length,
      lastErrorTime: errors.length > 0 ? errors[0].receivedAt : null,
      healthScore: calculatePageHealthScore(errors),
      severityBreakdown: {
        critical: errors.filter(e => e.analysis.severity === 'critical').length,
        high: errors.filter(e => e.analysis.severity === 'high').length,
        medium: errors.filter(e => e.analysis.severity === 'medium').length,
        low: errors.filter(e => e.analysis.severity === 'low').length
      },
      errorRate: errors.length / Math.max(1, (Date.now() - oneHourAgo.getTime()) / (1000 * 60 * 60)) // errors per hour
    };
  }

  return analytics;
}

function getMostCommonCategory(errors: StoredError[]): string {
  const categories: Record<string, number> = {};
  
  errors.forEach(err => {
    categories[err.analysis.category] = (categories[err.analysis.category] || 0) + 1;
  });

  return Object.entries(categories)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';
}

function calculatePageHealthScore(errors: StoredError[]): number {
  if (errors.length === 0) return 100;
  
  const recentErrors = errors.filter(err => {
    const errorTime = new Date(err.receivedAt).getTime();
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return errorTime > oneHourAgo;
  });

  const criticalCount = recentErrors.filter(e => e.analysis.severity === 'critical').length;
  const highCount = recentErrors.filter(e => e.analysis.severity === 'high').length;

  let score = 100;
  score -= criticalCount * 30; // Critical errors heavily impact score
  score -= highCount * 15;     // High errors moderately impact score
  score -= recentErrors.length * 2; // General error count

  return Math.max(0, Math.min(100, score));
}