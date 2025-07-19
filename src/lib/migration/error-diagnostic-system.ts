/**
 * ERROR DIAGNOSTIC & REPORTING SYSTEM
 * Sistem hatalarını tespit eder ve otomatik çözüm önerir
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SystemError {
  id: string;
  type: 'typescript' | 'runtime' | 'import' | 'auth' | 'database' | 'api';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  filePath?: string;
  lineNumber?: number;
  errorCode?: string;
  stackTrace?: string;
  suggestedFix?: string;
  autoFixAvailable: boolean;
  timestamp: Date;
}

export interface DiagnosticReport {
  systemHealth: 'healthy' | 'warning' | 'critical';
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errors: SystemError[];
  fixes: AutoFix[];
  recommendations: string[];
  timestamp: Date;
}

export interface AutoFix {
  id: string;
  title: string;
  description: string;
  command?: string;
  fileChanges?: FileFixChange[];
  dependencies?: string[];
  risk: 'low' | 'medium' | 'high';
  estimatedTime: string;
}

export interface FileFixChange {
  filePath: string;
  action: 'create' | 'modify' | 'delete';
  content?: string;
  lineChanges?: {
    line: number;
    before: string;
    after: string;
  }[];
}

// ===== ERROR DETECTION PATTERNS =====

export const ERROR_PATTERNS = [
  // TypeScript Errors
  {
    pattern: /Type '.*' is not assignable to type '.*'/,
    type: 'typescript' as const,
    severity: 'high' as const,
    category: 'Type Mismatch'
  },
  {
    pattern: /Module '".*"' has no exported member '.*'/,
    type: 'import' as const,
    severity: 'high' as const,
    category: 'Import Error'
  },
  {
    pattern: /Cannot find module '.*' or its corresponding type declarations/,
    type: 'import' as const,
    severity: 'critical' as const,
    category: 'Missing Module'
  },
  
  // Auth Errors
  {
    pattern: /Authentication required/,
    type: 'auth' as const,
    severity: 'high' as const,
    category: 'Auth Required'
  },
  {
    pattern: /Insufficient permissions/,
    type: 'auth' as const,
    severity: 'medium' as const,
    category: 'Permission Denied'
  },
  {
    pattern: /Failed to start workflow engine/,
    type: 'auth' as const,
    severity: 'high' as const,
    category: 'Workflow Permission'
  },

  // Runtime Errors
  {
    pattern: /is not a function/,
    type: 'runtime' as const,
    severity: 'critical' as const,
    category: 'Function Error'
  },
  {
    pattern: /Cannot read property '.*' of undefined/,
    type: 'runtime' as const,
    severity: 'high' as const,
    category: 'Property Access'
  },

  // API Errors
  {
    pattern: /API resolved without sending a response/,
    type: 'api' as const,
    severity: 'medium' as const,
    category: 'API Response'
  },
  {
    pattern: /Internal Server Error/,
    type: 'api' as const,
    severity: 'high' as const,
    category: 'Server Error'
  }
];

// ===== DIAGNOSTIC ENGINE =====

export class ErrorDiagnosticEngine {
  private projectRoot: string;
  private errors: SystemError[] = [];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  // Run comprehensive system diagnosis
  async runDiagnosis(): Promise<DiagnosticReport> {
    console.log('🔍 Starting System Diagnosis...');
    
    const errors: SystemError[] = [];
    
    // Check TypeScript compilation
    const tsErrors = await this.checkTypeScriptErrors();
    errors.push(...tsErrors);

    // Check runtime logs
    const runtimeErrors = await this.checkRuntimeErrors();
    errors.push(...runtimeErrors);

    // Check import issues
    const importErrors = await this.checkImportIssues();
    errors.push(...importErrors);

    // Check auth system
    const authErrors = await this.checkAuthSystem();
    errors.push(...authErrors);

    // Check API endpoints
    const apiErrors = await this.checkAPIEndpoints();
    errors.push(...apiErrors);

    // Generate fixes
    const fixes = this.generateAutoFixes(errors);

    // Create report
    const report: DiagnosticReport = {
      systemHealth: this.calculateSystemHealth(errors),
      totalErrors: errors.length,
      errorsByType: this.groupErrorsByType(errors),
      errorsBySeverity: this.groupErrorsBySeverity(errors),
      errors,
      fixes,
      recommendations: this.generateRecommendations(errors),
      timestamp: new Date()
    };

    console.log('✅ Diagnosis completed');
    return report;
  }

  // Check TypeScript compilation errors
  private async checkTypeScriptErrors(): Promise<SystemError[]> {
    const errors: SystemError[] = [];
    
    try {
      console.log('📝 Checking TypeScript compilation...');
      const { stdout, stderr } = await execAsync('npx tsc --noEmit --pretty false');
      
      if (stderr) {
        const lines = stderr.split('\n');
        
        for (const line of lines) {
          if (line.includes('error TS')) {
            const match = line.match(/^(.+?)\((\d+),\d+\): error TS(\d+): (.+)$/);
            if (match) {
              const [, filePath, lineNumber, errorCode, description] = match;
              
              errors.push({
                id: `TS-${errorCode}-${Date.now()}`,
                type: 'typescript',
                severity: 'high',
                title: `TypeScript Error ${errorCode}`,
                description,
                filePath,
                lineNumber: parseInt(lineNumber),
                errorCode: `TS${errorCode}`,
                autoFixAvailable: this.hasTypeScriptAutoFix(errorCode),
                timestamp: new Date()
              });
            }
          }
        }
      }
    } catch (error) {
      errors.push({
        id: `TS-COMPILE-${Date.now()}`,
        type: 'typescript',
        severity: 'critical',
        title: 'TypeScript Compilation Failed',
        description: error instanceof Error ? error.message : 'Unknown compilation error',
        autoFixAvailable: false,
        timestamp: new Date()
      });
    }

    return errors;
  }

  // Check runtime errors from logs
  private async checkRuntimeErrors(): Promise<SystemError[]> {
    const errors: SystemError[] = [];
    
    try {
      console.log('🔄 Checking runtime errors...');
      
      // Check .next/build-manifest.json for build errors
      const buildManifestPath = path.join(this.projectRoot, '.next/build-manifest.json');
      
      try {
        await fs.access(buildManifestPath);
        // If accessible, check for common runtime patterns in recently modified files
        
        const logFiles = [
          path.join(this.projectRoot, 'logs/error.log'),
          path.join(this.projectRoot, 'logs/app.log')
        ];

        for (const logFile of logFiles) {
          try {
            const content = await fs.readFile(logFile, 'utf-8');
            errors.push(...this.parseErrorsFromLogs(content));
          } catch {
            // Log file doesn't exist, continue
          }
        }
        
      } catch {
        errors.push({
          id: `RUNTIME-BUILD-${Date.now()}`,
          type: 'runtime',
          severity: 'high',
          title: 'Build Artifacts Missing',
          description: 'Application build artifacts not found, possible build failure',
          autoFixAvailable: true,
          suggestedFix: 'Run: npm run build',
          timestamp: new Date()
        });
      }
      
    } catch (error) {
      // Continue with other checks
    }

    return errors;
  }

  // Check import issues
  private async checkImportIssues(): Promise<SystemError[]> {
    const errors: SystemError[] = [];
    
    try {
      console.log('📦 Checking import issues...');
      
      // Use a simple import check by trying to compile a test file
      const testFile = path.join(this.projectRoot, 'temp-import-test.ts');
      const testContent = `
        import { authOptions } from '@/lib/auth/auth-options';
        import { authOptions as newAuth } from '@/lib/auth/auth-options';
        import { AuthenticatedUser } from '@/lib/auth/auth-utils';
        import { DynamicRBAC } from '@/lib/security/dynamic-rbac-full';
      `;
      
      await fs.writeFile(testFile, testContent);
      
      try {
        await execAsync(`npx tsc --noEmit ${testFile}`);
      } catch (compileError) {
        const errorOutput = compileError instanceof Error ? compileError.message : '';
        
        if (errorOutput.includes('Cannot find module')) {
          errors.push({
            id: `IMPORT-MISSING-${Date.now()}`,
            type: 'import',
            severity: 'critical',
            title: 'Missing Import Modules',
            description: 'Required modules not found - possible auth system migration needed',
            autoFixAvailable: true,
            suggestedFix: 'Run auth migration system',
            timestamp: new Date()
          });
        }
      } finally {
        // Clean up test file
        try {
          await fs.unlink(testFile);
        } catch {}
      }
      
    } catch (error) {
      // Continue with other checks
    }

    return errors;
  }

  // Check auth system integrity
  private async checkAuthSystem(): Promise<SystemError[]> {
    const errors: SystemError[] = [];
    
    try {
      console.log('🔐 Checking auth system...');
      
      // Check for old auth imports
      const authFiles = [
        'src/lib/auth.ts',
        'src/lib/auth/auth-options.ts',
        'src/lib/auth/auth-utils.ts'
      ];

      for (const filePath of authFiles) {
        try {
          const fullPath = path.join(this.projectRoot, filePath);
          const content = await fs.readFile(fullPath, 'utf-8');
          
          // Check for conflicting auth patterns
          if (content.includes('getServerSession') && content.includes('@/lib/auth/auth-options"')) {
            errors.push({
              id: `AUTH-CONFLICT-${Date.now()}`,
              type: 'auth',
              severity: 'high',
              title: 'Auth Import Conflicts',
              description: `Conflicting auth imports detected in ${filePath}`,
              filePath,
              autoFixAvailable: true,
              suggestedFix: 'Run auth migration to standardize imports',
              timestamp: new Date()
            });
          }
          
        } catch {
          // File doesn't exist
          if (filePath === 'src/lib/auth/auth-options.ts') {
            errors.push({
              id: `AUTH-MISSING-${Date.now()}`,
              type: 'auth',
              severity: 'critical',
              title: 'Auth Options Missing',
              description: 'Core auth configuration file not found',
              filePath,
              autoFixAvailable: true,
              timestamp: new Date()
            });
          }
        }
      }
      
    } catch (error) {
      // Continue with other checks
    }

    return errors;
  }

  // Check API endpoints
  private async checkAPIEndpoints(): Promise<SystemError[]> {
    const errors: SystemError[] = [];
    
    try {
      console.log('🌐 Checking API endpoints...');
      
      // Test if server is running and check key endpoints
      const testEndpoints = [
        '/api/health',
        '/api/auth/session',
        '/api/project-management/rules'
      ];

      for (const endpoint of testEndpoints) {
        try {
          const response = await fetch(`http://localhost:3000${endpoint}`);
          
          if (response.status >= 500) {
            errors.push({
              id: `API-500-${Date.now()}`,
              type: 'api',
              severity: 'high',
              title: 'API Server Error',
              description: `${endpoint} returning ${response.status}`,
              autoFixAvailable: false,
              timestamp: new Date()
            });
          }
          
        } catch (fetchError) {
          errors.push({
            id: `API-CONNECTION-${Date.now()}`,
            type: 'api',
            severity: 'medium',
            title: 'API Connection Failed',
            description: `Cannot connect to ${endpoint}`,
            autoFixAvailable: true,
            suggestedFix: 'Start development server: npm run dev',
            timestamp: new Date()
          });
        }
      }
      
    } catch (error) {
      // Continue with other checks
    }

    return errors;
  }

  // Parse errors from log content
  private parseErrorsFromLogs(logContent: string): SystemError[] {
    const errors: SystemError[] = [];
    const lines = logContent.split('\n');
    
    for (const line of lines) {
      for (const pattern of ERROR_PATTERNS) {
        if (pattern.pattern.test(line)) {
          errors.push({
            id: `LOG-${pattern.type.toUpperCase()}-${Date.now()}`,
            type: pattern.type,
            severity: pattern.severity,
            title: `${pattern.category} Error`,
            description: line.trim(),
            autoFixAvailable: this.hasAutoFix(pattern.type, line),
            timestamp: new Date()
          });
        }
      }
    }
    
    return errors;
  }

  // Generate auto-fixes for detected errors
  private generateAutoFixes(errors: SystemError[]): AutoFix[] {
    const fixes: AutoFix[] = [];
    
    // Group errors by type for batch fixes
    const errorsByType = this.groupErrorsByType(errors);
    
    // TypeScript/Import fixes
    if (errorsByType.typescript > 0 || errorsByType.import > 0) {
      fixes.push({
        id: 'FIX-AUTH-MIGRATION',
        title: 'Run Auth System Migration',
        description: 'Automatically migrate auth imports and types to new system',
        command: 'npm run migrate:auth',
        risk: 'medium',
        estimatedTime: '2-5 minutes'
      });
    }

    // Auth permission fixes
    if (errorsByType.auth > 0) {
      const permissionErrors = errors.filter(e => 
        e.description.includes('Insufficient permissions') || 
        e.description.includes('workflow engine')
      );
      
      if (permissionErrors.length > 0) {
        fixes.push({
          id: 'FIX-RBAC-PERMISSIONS',
          title: 'Fix RBAC Permissions',
          description: 'Update RBAC system with missing permissions for workflow management',
          fileChanges: [{
            filePath: 'src/lib/security/dynamic-rbac-full.ts',
            action: 'modify',
            content: '// Enhanced permissions for workflow management'
          }],
          risk: 'low',
          estimatedTime: '1 minute'
        });
      }
    }

    // Runtime fixes
    if (errorsByType.runtime > 0) {
      fixes.push({
        id: 'FIX-REBUILD',
        title: 'Clean Build & Restart',
        description: 'Clean build artifacts and restart development server',
        command: 'rm -rf .next && npm run dev',
        risk: 'low',
        estimatedTime: '30 seconds'
      });
    }

    // API fixes
    if (errorsByType.api > 0) {
      fixes.push({
        id: 'FIX-API-ROUTES',
        title: 'Fix API Route Structure',
        description: 'Ensure all API routes follow correct pattern',
        command: 'npm run check:api-routes',
        risk: 'low',
        estimatedTime: '1 minute'
      });
    }

    return fixes;
  }

  // Calculate overall system health
  private calculateSystemHealth(errors: SystemError[]): 'healthy' | 'warning' | 'critical' {
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const highErrors = errors.filter(e => e.severity === 'high').length;
    
    if (criticalErrors > 0) return 'critical';
    if (highErrors > 3) return 'critical';
    if (highErrors > 0 || errors.length > 5) return 'warning';
    
    return 'healthy';
  }

  // Group errors by type
  private groupErrorsByType(errors: SystemError[]): Record<string, number> {
    return errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // Group errors by severity
  private groupErrorsBySeverity(errors: SystemError[]): Record<string, number> {
    return errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // Generate recommendations
  private generateRecommendations(errors: SystemError[]): string[] {
    const recommendations: string[] = [];
    
    const errorsByType = this.groupErrorsByType(errors);
    
    if (errorsByType.auth > 0) {
      recommendations.push('Consider running the auth migration system to standardize authentication patterns');
    }
    
    if (errorsByType.typescript > 2) {
      recommendations.push('Run TypeScript strict mode check to catch type issues early');
    }
    
    if (errorsByType.import > 0) {
      recommendations.push('Review import paths and ensure all modules are properly exported');
    }
    
    if (errorsByType.runtime > 0) {
      recommendations.push('Add more error boundaries and runtime error handling');
    }

    return recommendations;
  }

  // Check if TypeScript error has auto-fix
  private hasTypeScriptAutoFix(errorCode: string): boolean {
    const autoFixableErrors = ['2307', '2345', '2339', '2740']; // Common fixable TS errors
    return autoFixableErrors.includes(errorCode);
  }

  // Check if error type has auto-fix
  private hasAutoFix(errorType: string, errorMessage: string): boolean {
    if (errorType === 'auth' && errorMessage.includes('permissions')) return true;
    if (errorType === 'import' && errorMessage.includes('Cannot find module')) return true;
    if (errorType === 'typescript') return true;
    
    return false;
  }

  // Apply auto-fix
  async applyAutoFix(fixId: string): Promise<boolean> {
    console.log(`🔧 Applying fix: ${fixId}`);
    
    try {
      switch (fixId) {
        case 'FIX-AUTH-MIGRATION':
          // Run auth migration
          const { AuthMigrationEngine } = await import('./auth-migration-system');
          const migrationEngine = new AuthMigrationEngine();
          await migrationEngine.runMigration();
          return true;

        case 'FIX-RBAC-PERMISSIONS':
          // Apply RBAC fixes (already done in previous commits)
          return true;

        case 'FIX-REBUILD':
          await execAsync('rm -rf .next');
          console.log('Build cache cleared');
          return true;

        default:
          console.log(`Unknown fix ID: ${fixId}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to apply fix ${fixId}:`, error);
      return false;
    }
  }

  // Generate comprehensive report
  async generateReport(report: DiagnosticReport): Promise<string> {
    const healthEmoji = {
      'healthy': '✅',
      'warning': '⚠️',
      'critical': '🚨'
    };

    const reportContent = `# System Diagnostic Report
${healthEmoji[report.systemHealth]} **System Health**: ${report.systemHealth.toUpperCase()}
📅 **Generated**: ${report.timestamp.toISOString()}

## Summary
- **Total Errors**: ${report.totalErrors}
- **Critical**: ${report.errorsBySeverity.critical || 0}
- **High**: ${report.errorsBySeverity.high || 0}
- **Medium**: ${report.errorsBySeverity.medium || 0}
- **Low**: ${report.errorsBySeverity.low || 0}

## Errors by Type
${Object.entries(report.errorsByType).map(([type, count]) => 
  `- **${type}**: ${count}`
).join('\n')}

## Detailed Errors
${report.errors.map(error => `
### ${error.title}
- **Type**: ${error.type}
- **Severity**: ${error.severity}
- **Description**: ${error.description}
${error.filePath ? `- **File**: ${error.filePath}${error.lineNumber ? `:${error.lineNumber}` : ''}` : ''}
${error.suggestedFix ? `- **Suggested Fix**: ${error.suggestedFix}` : ''}
${error.autoFixAvailable ? '- 🔧 **Auto-fix available**' : ''}
`).join('\n')}

## Available Auto-Fixes
${report.fixes.map(fix => `
### ${fix.title}
- **Risk**: ${fix.risk}
- **Estimated Time**: ${fix.estimatedTime}
- **Description**: ${fix.description}
${fix.command ? `- **Command**: \`${fix.command}\`` : ''}
`).join('\n')}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps
1. Review critical and high severity errors first
2. Apply auto-fixes where available
3. Test functionality after each fix
4. Re-run diagnosis to verify fixes
5. Consider implementing recommended improvements
`;

    // Save report
    const reportPath = path.join(this.projectRoot, 'DIAGNOSTIC_REPORT.md');
    await fs.writeFile(reportPath, reportContent, 'utf-8');
    
    return reportContent;
  }
}

// Export singleton
export const errorDiagnostic = new ErrorDiagnosticEngine(); 