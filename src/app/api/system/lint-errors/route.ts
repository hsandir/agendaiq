import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface LintError {
  filePath: string;
  line: number;
  column: number;
  ruleId: string;
  severity: number;
  message: string;
  nodeType?: string;
  messageId?: string;
  endLine?: number;
  endColumn?: number;
  fix?: {
    range: [number, number];
    text: string;
  };
  suggestions?: Array<{
    desc: string;
    fix: {
      range: [number, number];
      text: string;
    };
  }>;
}

interface LintResult {
  filePath: string;
  messages: LintError[];
  errorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
  source?: string;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_LINT });
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const severity = url.searchParams.get('severity') ?? 'all'; // all, errors, warnings
    const limit = parseInt(url.searchParams.get('limit') ?? '100');
    const offset = parseInt(url.searchParams.get('offset') ?? '0');

    if (action === 'summary') {
      return await getLintSummary();
    } else if (action === 'details') {
      return await getLintDetails(severity, limit, offset);
    } else if (action === 'fixable') {
      return await getFixableErrors();
    } else if (action === 'type-casting-violations') {
      return await getTypeCastingViolations();
    } else if (action === 'dangerous-patterns') {
      return await getDangerousPatterns();
    }

    return NextResponse.json({ error: 'Invalid action. Use: summary, details, fixable, type-casting-violations, or dangerous-patterns' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Lint error API failed:', error);
    await logError('LINT_API_ERROR', error instanceof Error ? error.message : "Unknown error", { action: 'GET' });
    return NextResponse.json(
      { error: 'Failed to get lint errors', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_LINT });
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }
    const body = await request.json() as Record<string, unknown>;
    const { __action, __filePath, __fixes } = body;

    if (action === 'fix') {
      return await fixLintErrors(filePath, fixes);
    } else if (action === 'autofix') {
      return await autoFixErrors();
    } else if (action === 'report') {
      return await reportErrorsToAdmin(fixes);
    }

    return NextResponse.json({ error: 'Invalid action. Use: fix, autofix, or report' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Lint fix API failed:', error);
    await logError('LINT_FIX_ERROR', error instanceof Error ? error.message : "Unknown error", { action: 'POST' });
    return NextResponse.json(
      { error: 'Failed to fix lint errors', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function getLintSummary() {
  try {
    const { __stdout, __stderr } = await execAsync('npx eslint src/ --format json', { 
      cwd: process.cwd() 
    });
    
    const results: LintResult[] = JSON.parse(stdout || '[]');
    
    const summary = results.reduce((acc, result) => {
      acc.totalFiles++;
      acc.totalErrors += result.errorCount;
      acc.totalWarnings += result.warningCount;
      acc.fixableErrors += result.fixableErrorCount;
      acc.fixableWarnings += result.fixableWarningCount;
      
      if (result.errorCount > 0 ?? result.warningCount > 0) {
        acc.filesWithIssues++;
      }
      
      return acc;
    }, {
      totalFiles: 0,
      filesWithIssues: 0,
      totalErrors: 0,
      totalWarnings: 0,
      fixableErrors: 0,
      fixableWarnings: 0
    });

    // Get most common error types
    const errorTypes = new Map<string, number>();
    results.forEach(result => {
      result.messages.forEach(msg => {
        if (msg.severity === 2) { // Error
          const count = errorTypes.get(msg.ruleId) ?? 0;
          errorTypes.set(msg.ruleId, count + 1);
        }
      });
    });

    const topErrors = (Array.from(errorTypes.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([rule, count]) => ({ rule, count })));

    return NextResponse.json({
      success: true,
      summary,
      topErrors,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    // ESLint might return non-zero exit code for errors, parse the output anyway
    try {
      const errorOutput = error?.stdout || '[]';
      const results: LintResult[] = JSON.parse(errorOutput);
      const summary = results.reduce((acc, result) => {
        acc.totalFiles++;
        acc.totalErrors += result.errorCount;
        acc.totalWarnings += result.warningCount;
        acc.fixableErrors += result.fixableErrorCount;
        acc.fixableWarnings += result.fixableWarningCount;
        
        if (result.errorCount > 0 ?? result.warningCount > 0) {
          acc.filesWithIssues++;
        }
        
        return acc;
      }, {
        totalFiles: 0,
        filesWithIssues: 0,
        totalErrors: 0,
        totalWarnings: 0,
        fixableErrors: 0,
        fixableWarnings: 0
      });

      return NextResponse.json({
        success: true,
        summary,
        topErrors: [],
        timestamp: new Date().toISOString()
      });
    } catch {
      throw error;
    }
  }
}

async function getLintDetails(severity: string, limit: number, offset: number) {
  try {
    const { __stdout } = await execAsync('npx eslint src/ --format json', { 
      cwd: process.cwd() 
    });
    
    const results: LintResult[] = JSON.parse(stdout || '[]');
    
    // Flatten all errors from all files
    const allErrors: (LintError & { filePath: string })[] = [];
    results.forEach(result => {
      result.messages.forEach(msg => {
        if (severity === 'errors' && msg.severity !== 2) return;
        if (severity === 'warnings' && msg.severity !== 1) return;
        
        allErrors.push({
          ...msg,
          filePath: result.filePath.replace(process.cwd(), '')
        });
      });
    });

    // Sort by severity (errors first), then by file path
    allErrors.sort((a, b) => {
      if (a.severity !== b.severity) return b.severity - a.severity;
      return a.filePath.localeCompare(b.filePath);
    });

    // Paginate
    const paginatedErrors = allErrors.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      errors: paginatedErrors,
      pagination: {
        total: allErrors.length,
        offset,
        limit,
        hasNext: offset + limit < allErrors.length,
        hasPrevious: offset > 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    try {
      const errorOutput = error?.stdout || '[]';
      const results: LintResult[] = JSON.parse(errorOutput);
      const allErrors: (LintError & { filePath: string })[] = [];
      results.forEach(result => {
        result.messages.forEach(msg => {
          if (severity === 'errors' && msg.severity !== 2) return;
          if (severity === 'warnings' && msg.severity !== 1) return;
          
          allErrors.push({
            ...msg,
            filePath: result.filePath.replace(process.cwd(), '')
          });
        });
      });

      const paginatedErrors = allErrors.slice(offset, offset + limit);

      return NextResponse.json({
        success: true,
        errors: paginatedErrors,
        pagination: {
          total: allErrors.length,
          offset,
          limit,
          hasNext: offset + limit < allErrors.length,
          hasPrevious: offset > 0
        },
        timestamp: new Date().toISOString()
      });
    } catch {
      throw error;
    }
  }
}

async function getFixableErrors() {
  try {
    const { __stdout } = await execAsync('npx eslint src/ --format json', { 
      cwd: process.cwd() 
    });
    
    const results: LintResult[] = JSON.parse(stdout || '[]');
    
    const fixableErrors: (LintError & { filePath: string })[] = [];
    results.forEach(result => {
      result.messages.forEach(msg => {
        if (msg.fix || (msg.suggestions && msg.suggestions.length > 0)) {
          fixableErrors.push({
            ...msg,
            filePath: result.filePath.replace(process.cwd(), '')
          });
        }
      });
    });

    return NextResponse.json({
      success: true,
      fixableErrors,
      count: fixableErrors.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    try {
      const errorOutput = error?.stdout || '[]';
      const results: LintResult[] = JSON.parse(errorOutput);
      const fixableErrors: (LintError & { filePath: string })[] = [];
      results.forEach(result => {
        result.messages.forEach(msg => {
          if (msg.fix || (msg.suggestions && msg.suggestions.length > 0)) {
            fixableErrors.push({
              ...msg,
              filePath: result.filePath.replace(process.cwd(), '')
            });
          }
        });
      });

      return NextResponse.json({
        success: true,
        fixableErrors,
        count: fixableErrors.length,
        timestamp: new Date().toISOString()
      });
    } catch {
      throw error;
    }
  }
}

async function autoFixErrors() {
  try {
    // Run ESLint with --fix flag
    const { __stdout, __stderr } = await execAsync('npx eslint src/ --fix --format json', { 
      cwd: process.cwd() 
    });
    
    // Get remaining errors after auto-fix
    const results: LintResult[] = JSON.parse(stdout || '[]');
    const remainingErrors = results.reduce((sum, result) => sum + result.errorCount, 0);
    const remainingWarnings = results.reduce((sum, result) => sum + result.warningCount, 0);

    await logError('LINT_AUTO_FIX', 'Auto-fix completed', {
      remainingErrors,
      remainingWarnings,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Auto-fix completed successfully',
      remainingErrors,
      remainingWarnings,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    // Even if some errors remain, auto-fix might have worked partially
    try {
      const errorOutput = error?.stdout || '[]';
      const results: LintResult[] = JSON.parse(errorOutput);
      const remainingErrors = results.reduce((sum, result) => sum + result.errorCount, 0);
      const remainingWarnings = results.reduce((sum, result) => sum + result.warningCount, 0);

      return NextResponse.json({
        success: true,
        message: 'Auto-fix completed with some remaining issues',
        remainingErrors,
        remainingWarnings,
        timestamp: new Date().toISOString()
      });
    } catch {
      throw error;
    }
  }
}

async function fixLintErrors(filePath: string, fixes: Array<Record<string, unknown>>) {
  try {
    // Read the file
    const fullPath = path.join(process.cwd(), filePath);
    const content = await readFile(fullPath, 'utf-8');

    // Apply fixes in reverse order (from end to beginning) to maintain positions
    let fixedContent = content;
    const sortedFixes = fixes.sort((a, b) => {
      const aRange = a.range as [number, number] | undefined;
      const bRange = b.range as [number, number] | undefined;
      return (bRange?.[0] || 0) - (aRange?.[0] || 0);
    });

    for (const fix of sortedFixes) {
      const fixRange = fix.range as [number, number] | undefined;
      if (!fixRange) continue;
      
      const before = fixedContent.slice(0, fixRange[0]);
      const after = fixedContent.slice(fixRange[1]);
      fixedContent = before + fix.text + after;
    }

    // Write the fixed content back
    await writeFile(fullPath, fixedContent);

    await logError('LINT_MANUAL_FIX', 'Manual fixes applied', {
      filePath,
      fixCount: fixes.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Applied ${fixes.length} fixes to ${filePath}`,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    throw new Error(`Failed to fix errors in ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function reportErrorsToAdmin(errors: Array<Record<string, unknown>>) {
  try {
    // Log to system error reporting
    await logError('LINT_ERROR_REPORT', 'Lint errors reported to admin', {
      errorCount: errors.length,
      errors: errors.slice(0, 10), // Log first 10 errors
      timestamp: new Date().toISOString(),
      reportedBy: 'system',
      priority: 'medium'
    });

    // Here you could also send to external monitoring service
    // await sendToMonitoringService(errors);

    return NextResponse.json({
      success: true,
      message: `Reported ${errors.length} lint errors to system administrators`,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    throw new Error(`Failed to report errors: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function getTypeCastingViolations() {
  try {
    const { __stdout } = await execAsync(
      'grep -rn "as Record<__string, unknown>" src/ --include="*.ts" --include="*.tsx" || true',
      { cwd: process.cwd() }
    );

    const violations: Array<{
      filePath: string;
      line: number;
      content: string;
      severity: 'critical';
      type: 'DANGEROUS_TYPE_CASTING';
      suggestion: string;
    }> = [];

    if (stdout) {
      const lines = stdout.trim().split('\n');
      lines.forEach(line => {
        const match = line.match(/^([^:]+):(\d+):(.+)$/);
        if (match) {
          const [, filePath, lineNumber, content] = match;
          violations.push({
            filePath: filePath.replace(process.cwd(), ''),
            line: parseInt(lineNumber),
            content: content.trim(),
            severity: 'critical',
            type: 'DANGEROUS_TYPE_CASTING',
            suggestion: 'Replace with proper TypeScript interfaces or type guards'
          });
        }
      });
    }

    // Also check for multiple chained assertions
    const { stdout: __chainedAssertions } = await execAsync(
      'grep -rn "as.*as" src/ --include="*.ts" --include="*.tsx" || true',
      { cwd: process.cwd() }
    );

    if (chainedAssertions) {
      const lines = chainedAssertions.trim().split('\n');
      lines.forEach(line => {
        const match = line.match(/^([^:]+):(\d+):(.+)$/);
        if (match) {
          const [, filePath, lineNumber, content] = match;
          violations.push({
            filePath: filePath.replace(process.cwd(), ''),
            line: parseInt(lineNumber),
            content: content.trim(),
            severity: 'critical',
            type: 'CHAINED_TYPE_CASTING',
            suggestion: 'Avoid chained type assertions - use single proper type assertion or type guards'
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      violations,
      count: violations.length,
      summary: {
        critical: violations.length,
        mostCommonPatterns: getPatternSummary(violations)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Failed to scan for type casting violations:', error);
    return NextResponse.json(
      { error: 'Failed to scan for violations', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function getDangerousPatterns() {
  try {
    const patterns = [
      {
        name: 'Record<string, unknown> casting',
        pattern: 'as Record<string, unknown>',
        severity: 'critical',
        description: 'Dangerous type casting that can cause syntax errors'
      },
      {
        name: 'Unknown type casting',
        pattern: 'as unknown',
        severity: 'high',
        description: 'Type casting to unknown bypasses TypeScript safety'
      },
      {
        name: 'Chained type assertions',
        pattern: 'as.*as',
        severity: 'critical',
        description: 'Multiple chained type assertions can cause syntax errors'
      },
      {
        name: 'Any type usage',
        pattern: ': any',
        severity: 'medium',
        description: 'Using any type bypasses TypeScript type checking'
      }
    ];

    const results = [];

    for (const pattern of patterns) {
      const { __stdout } = await execAsync(
        `grep -rn "${pattern.__pattern}" src/ --include="*.ts" --include="*.tsx" | wc -l ?? echo 0`,
        { cwd: process.cwd() }
      );
      
      const count = parseInt(stdout.trim()) || 0;
      results.push({
        ...pattern,
        occurrences: count
      });
    }

    // Get total risk score
    const riskScore = results.reduce((total, pattern) => {
      const multiplier = pattern.severity === 'critical' ? 10 : 
                       pattern.severity === 'high' ? 5 : 
                       pattern.severity === 'medium' ? 2 : 1;
      return total + (pattern.occurrences * multiplier);
    }, 0);

    return NextResponse.json({
      success: true,
      patterns: results,
      summary: {
        totalPatterns: results.length,
        totalOccurrences: results.reduce((sum, p) => sum + p.occurrences, 0),
        riskScore,
        riskLevel: riskScore > 50 ? 'HIGH' : riskScore > 20 ? 'MEDIUM' : 'LOW'
      },
      recommendations: [
        'Replace "as Record<string, unknown>" with proper TypeScript interfaces',
        'Use type guards instead of "as unknown" casting',
        'Avoid chained type assertions completely',
        'Define specific types instead of using "any"'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Failed to scan for dangerous patterns:', error);
    return NextResponse.json(
      { error: 'Failed to scan patterns', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function getPatternSummary(violations: Array<{ type: string; filePath: string }>) {
  const summary: Record<string, { count: number; files: string[] }> = {};
  
  violations.forEach(violation => {
    if (!summary[violation.type]) {
      summary[violation.type] = { count: 0, files: [] };
    }
    summary[violation.type].count++;
    if (!summary[violation.type].files.includes(violation.filePath)) {
      summary[violation.type].files.push(violation.filePath);
    }
  });

  return summary;
}

async function logError(type: string, message: string, details: Record<string, unknown>) {
  try {
    const logEntry = {
      type,
      message,
      details,
      timestamp: new Date().toISOString(),
      level: 'info'
    };

    // Write to system log file
    const logPath = path.join(process.cwd(), 'logs', 'lint-errors.log');
    await writeFile(logPath, JSON.stringify(logEntry) + '\n', { flag: 'a' });

    // You could also log to database here
    // await prisma.systemLog.create({ data: logEntry });

  } catch (error: unknown) {
    console.error('Failed to log error:', error);
  }
} 