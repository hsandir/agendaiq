interface ErrorAnalysis {
  category: 'authentication' | 'database' | 'api' | 'frontend' | 'validation' | 'security' | 'performance' | 'network' | 'configuration' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  pageContext: string;
  description: string;
  impact: string;
  solutions: string[];
  preventiveMeasures: string[];
  affectedComponents: string[];
  estimatedFixTime: string;
  priorityScore: number;
  relatedErrors: string[];
}

interface ErrorData {
  message: string;
  url?: string;
  stack?: string;
  timestamp?: string;
  severity?: string;
  userId?: string;
}

interface ErrorPattern {
  pattern: RegExp;
  category: ErrorAnalysis['category'];
  severity: ErrorAnalysis['severity'];
  getAnalysis: (error: string, url: string, stack?: string) => ErrorAnalysis;
}

export class ErrorAnalyzer {
  private static patterns: ErrorPattern[] = [
    // Authentication Errors
    {
      pattern: /authentication|unauthorized|login|session|token|jwt/i,
      category: 'authentication',
      severity: 'high',
      getAnalysis: (error, url, stack) => ({
        category: 'authentication',
        severity: 'high',
        pageContext: ErrorAnalyzer.extractPageContext(url),
        description: 'Authentication system error occurred. User session is invalid or authorization issue is happening.',
        impact: 'Users cannot login or their sessions are terminated. This severely affects user experience.',
        solutions: [
          'Check session storage and cookies',
          'Verify NEXTAUTH_SECRET environment variable is properly configured',
          'Check database connection and Session table',
          'Verify JWT token expiry settings',
          'Review middleware configuration'
        ],
        preventiveMeasures: [
          'Optimize session timeout duration',
          'Add token refresh mechanism',
          'Improve login state management',
          'Add error boundaries'
        ],
        affectedComponents: ['Auth System', 'Session Management', 'Middleware'],
        estimatedFixTime: '30-60 minutes',
        priorityScore: 90,
        relatedErrors: ['Session expired', 'Invalid token', 'Unauthorized access']
      })
    },

    // Database Errors
    {
      pattern: /database|prisma|connection|query|timeout|deadlock/i,
      category: 'database',
      severity: 'critical',
      getAnalysis: (error, url, stack) => ({
        category: 'database',
        severity: 'critical',
        pageContext: ErrorAnalyzer.extractPageContext(url),
        description: 'Database connection or query operation failed. This can have system-wide impact.',
        impact: 'Data read/write operations stop. All users are affected. System may become unusable.',
        solutions: [
          'Check database connection string (DATABASE_URL)',
          'Ensure Supabase/PostgreSQL server is running',
          'Check connection pool settings',
          'Restart Prisma client',
          'Check database migrations'
        ],
        preventiveMeasures: [
          'Optimize connection pooling',
          'Add database health checks',
          'Configure query timeouts',
          'Set up database monitoring system'
        ],
        affectedComponents: ['Database', 'Prisma Client', 'All API Endpoints'],
        estimatedFixTime: '15-30 minutes',
        priorityScore: 100,
        relatedErrors: ['Connection failed', 'Query timeout', 'Migration error']
      })
    },

    // API Errors
    {
      pattern: /api|fetch|network|400|401|403|404|500|502|503|504/i,
      category: 'api',
      severity: 'high',
      getAnalysis: (error, url, stack) => {
        const statusCode = error.match(/\b(4\d\d|5\d\d)\b/)?.[0];
        return {
          category: 'api',
          severity: statusCode?.startsWith('5') ? 'critical' : 'high',
          pageContext: ErrorAnalyzer.extractPageContext(url),
          description: `API endpoint communication error. ${statusCode ? `HTTP ${statusCode} error` : 'Network issue'} detected.`,
          impact: 'Specific features do not work. User operations cannot be completed. Data updates fail.',
          solutions: [
            'Check if API endpoint is running',
            'Test network connection',
            'Check request payload and headers',
            'Check rate limiting',
            'Review server logs'
          ],
          preventiveMeasures: [
            'Add API response validation',
            'Implement retry mechanism',
            'Fallback data strategy',
            'Loading states and error handling'
          ],
          affectedComponents: ['API Layer', 'Data Fetching', 'User Interface'],
          estimatedFixTime: '20-45 minutes',
          priorityScore: statusCode?.startsWith('5') ? 85 : 70,
          relatedErrors: [`HTTP ${statusCode}`, 'Network timeout', 'API unavailable']
        };
      }
    },

    // Frontend React/Next.js Errors
    {
      pattern: /react|next|hydration|rendering|component|hook|jsx/i,
      category: 'frontend',
      severity: 'medium',
      getAnalysis: (error, url, stack) => ({
        category: 'frontend',
        severity: error.includes('hydration') ? 'high' : 'medium',
        pageContext: ErrorAnalyzer.extractPageContext(url),
        description: 'Frontend rendering or React component error. SSR/CSR mismatch or component lifecycle issue may be occurring.',
        impact: 'Page does not load properly or interactive features do not work. User experience is negatively affected.',
        solutions: [
          'Check component state management',
          'Review useEffect dependencies',
          'Check SSR/CSR hydration compatibility',
          'Check console warnings',
          'Inspect component tree with React DevTools'
        ],
        preventiveMeasures: [
          'Add error boundaries',
          'PropTypes or TypeScript validation',
          'Increase unit test coverage',
          'Update ESLint rules'
        ],
        affectedComponents: ['React Components', 'Page Rendering', 'Client Side'],
        estimatedFixTime: '15-30 minutes',
        priorityScore: error.includes('hydration') ? 75 : 50,
        relatedErrors: ['Hydration mismatch', 'Component error', 'Hook error']
      })
    },

    // Validation Errors
    {
      pattern: /validation|required|invalid|schema|zod|yup/i,
      category: 'validation',
      severity: 'medium',
      getAnalysis: (error, url, stack) => ({
        category: 'validation',
        severity: 'medium',
        pageContext: ErrorAnalyzer.extractPageContext(url),
        description: 'Form validation or data validation error. User input is in unexpected format or required fields are missing.',
        impact: 'Form submission fails. User operations cannot be completed. Data consistency may be affected.',
        solutions: [
          'Check form validation schema',
          'Review required fields and types',
          'Check client-server validation compatibility',
          'Add input format validation',
          'Improve error messages'
        ],
        preventiveMeasures: [
          'Comprehensive input validation',
          'Real-time validation feedback',
          'Clear error messages',
          'Field format examples'
        ],
        affectedComponents: ['Forms', 'Input Validation', 'Data Processing'],
        estimatedFixTime: '10-20 minutes',
        priorityScore: 40,
        relatedErrors: ['Required field missing', 'Invalid format', 'Schema error']
      })
    },

    // Security Errors
    {
      pattern: /security|xss|csrf|cors|permission|forbidden|blocked/i,
      category: 'security',
      severity: 'critical',
      getAnalysis: (error, url, stack) => ({
        category: 'security',
        severity: 'critical',
        pageContext: ErrorAnalyzer.extractPageContext(url),
        description: 'Security system detected a threat or unauthorized operation is being performed.',
        impact: 'Security vulnerability risk. User data security may be compromised. System may be vulnerable to attacks.',
        solutions: [
          'Check CORS settings',
          'Review Content Security Policy',
          'Check authentication middleware',
          'Verify user permissions',
          'Check security headers'
        ],
        preventiveMeasures: [
          'Regular security audits',
          'Input sanitization',
          'Rate limiting',
          'Security monitoring'
        ],
        affectedComponents: ['Security Layer', 'Authentication', 'Authorization'],
        estimatedFixTime: '60-120 minutes',
        priorityScore: 95,
        relatedErrors: ['CORS blocked', 'Permission denied', 'Security violation']
      })
    },

    // Performance Errors
    {
      pattern: /performance|slow|timeout|memory|leak|bundle|large/i,
      category: 'performance',
      severity: 'medium',
      getAnalysis: (error, url, stack) => ({
        category: 'performance',
        severity: 'medium',
        pageContext: ErrorAnalyzer.extractPageContext(url),
        description: 'Performance issue detected. Page is loading slowly or memory usage is high.',
        impact: 'User experience deteriorates. Page opens slowly. Issues may occur on mobile devices.',
        solutions: [
          'Perform bundle size analysis',
          'Implement lazy loading',
          'Check image optimization',
          'Prevent unnecessary re-renders',
          'Check for memory leaks'
        ],
        preventiveMeasures: [
          'Performance monitoring',
          'Code splitting',
          'Caching strategies',
          'Resource optimization'
        ],
        affectedComponents: ['Performance', 'Bundle', 'Memory Management'],
        estimatedFixTime: '30-60 minutes',
        priorityScore: 60,
        relatedErrors: ['Slow loading', 'Memory leak', 'Large bundle']
      })
    }
  ];

  public static analyzeError(error: string, url: string, stack?: string): ErrorAnalysis {
    // Check known patterns first
    for (const pattern of this.patterns) {
      if (pattern.pattern.test(error) || (stack && pattern.pattern.test(stack))) {
        return pattern.getAnalysis(error, url, stack);
      }
    }

    // If no pattern found, do generic analysis
    return {
      category: 'unknown',
      severity: this.determineSeverityByKeywords(error, stack),
      pageContext: this.extractPageContext(url),
      description: 'Unidentified error occurred. Stack trace and error message should be analyzed.',
      impact: 'Error impact has not been determined yet. Detailed analysis required.',
      solutions: [
        'Review error message and stack trace in detail',
        'Check if there are additional warnings or errors in console',
        'Check failed requests in Network tab',
        'Debug with Browser DevTools'
      ],
      preventiveMeasures: [
        'Comprehensive error logging',
        'Error boundary implementation',
        'Better error handling'
      ],
      affectedComponents: ['Unknown'],
      estimatedFixTime: '30-60 minutes',
      priorityScore: 30,
      relatedErrors: []
    };
  }

  private static extractPageContext(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Page context mapping
      const pageContextMap: Record<string, string> = {
        '/dashboard': 'Main Dashboard Page',
        '/dashboard/meetings': 'Meeting Management',
        '/dashboard/meeting-intelligence': 'Meeting Intelligence',
        '/dashboard/settings': 'System Settings',
        '/dashboard/monitoring': 'Live Monitoring',
        '/dashboard/development': 'Development Tools',
        '/auth/signin': 'Sign In Page',
        '/auth/signup': 'Sign Up Page',
        '/api/': 'API Endpoint'
      };

      for (const [path, context] of Object.entries(pageContextMap)) {
        if (pathname.startsWith(path)) {
          return context;
        }
      }

      return `Page: ${pathname}`;
    } catch {
      return 'Unknown Page';
    }
  }

  private static determineSeverityByKeywords(error: string, stack?: string): 'low' | 'medium' | 'high' | 'critical' {
    const fullText = (error + ' ' + (stack ?? '')).toLowerCase();
    
    if (fullText.includes('critical') || fullText.includes('fatal') || fullText.includes('crash')) {
      return 'critical';
    }
    
    if (fullText.includes('error') || fullText.includes('failed') || fullText.includes('exception')) {
      return 'high';
    }
    
    if (fullText.includes('warning') || fullText.includes('deprecated')) {
      return 'medium';
    }
    
    return 'low';
  }

  public static generateErrorReport(errors: ErrorData[]): {
    summary: string;
    totalErrors: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    topAffectedPages: string[];
    recommendations: string[];
  } {
    const analyses = errors.map(err => this.analyzeError(err.message, err.url ?? '', err.stack));
    
    const summary = this.generateSummary(analyses);
    const totalErrors = errors.length;
    const criticalCount = analyses.filter(a => a.severity === 'critical').length;
    const highCount = analyses.filter(a => a.severity === 'high').length;
    const mediumCount = analyses.filter(a => a.severity === 'medium').length;
    const lowCount = analyses.filter(a => a.severity === 'low').length;
    
    // Most affected pages
    const pageCount: Record<string, number> = {};
    analyses.forEach(a => {
      pageCount[a.pageContext] = (pageCount[a.pageContext] || 0) + 1;
    });
    
    const topAffectedPages = (Object.entries(pageCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([page]) => page));

    // General recommendations
    const recommendations = this.generateRecommendations(analyses);
    
    return {
      summary,
      totalErrors,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      topAffectedPages,
      recommendations
    };
  }

  private static generateSummary(analyses: ErrorAnalysis[]): string {
    if (analyses.length === 0) return 'System appears healthy! 🎉';
    
    const critical = analyses.filter(a => a.severity === 'critical').length;
    const high = analyses.filter(a => a.severity === 'high').length;
    
    if (critical > 0) {
      return `🚨 CRITICAL: ${critical} critical errors detected. Immediate action required!`;
    }
    
    if (high > 0) {
      return `⚠️ HIGH: ${high} high priority errors found. Should be resolved with priority.`;
    }
    
    return `📝 Total ${analyses.length} errors detected. Most are low priority.`;
  }

  private static generateRecommendations(analyses: ErrorAnalysis[]): string[] {
    const categoryCount: Record<string, number> = {};
    analyses.forEach(a => {
      categoryCount[a.category] = (categoryCount[a.category] || 0) + 1;
    });
    
    const recommendations = [];
    
    if (categoryCount.authentication > 0) {
      recommendations.push('🔐 Review authentication system and improve session management');
    }
    
    if (categoryCount.database > 0) {
      recommendations.push('💾 Stabilize database connection and perform query optimization');
    }
    
    if (categoryCount.api > 0) {
      recommendations.push('🌐 Test API endpoints and add error handling');
    }
    
    if (categoryCount.frontend > 0) {
      recommendations.push('⚛️ Review React components and add error boundaries');
    }
    
    if (categoryCount.security > 0) {
      recommendations.push('🛡️ Check security configuration and perform security audit');
    }
    
    return recommendations;
  }
}

export type { ErrorAnalysis };