import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Schema for autofix request
const autofixSchema = z.object({
  errorType: z.string(),
  errorMessage: z.string(),
  context: z.object({
    file: z.string().optional(),
    line: z.number().optional(),
    column: z.number().optional(),
    workflow: z.string().optional(),
    job: z.string().optional(),
  }).optional(),
});

interface AutofixSuggestion {
  id: string;
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  commands: string[];
  files: Array<{
    path: string;
    action: 'create' | 'modify' | 'delete';
    content?: string;
  }>;
  preventive: boolean;
}

// GET /api/dev/ci-cd/autofix - Get autofix suggestions for an error
export async function GET(request: NextRequest) {
  try {
    // Development endpoint - no auth required
    console.log('Autofix API called');

    const { searchParams } = new URL(request.url);
    const errorType = searchParams.get('errorType') || '';
    const errorMessage = searchParams.get('errorMessage') || '';

    const suggestions = await generateAutofixSuggestions(errorType, errorMessage);

    return NextResponse.json({
      suggestions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating autofix suggestions:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate autofix suggestions',
        code: 'AUTOFIX_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST /api/dev/ci-cd/autofix - Apply an autofix
export async function POST(request: NextRequest) {
  try {
    // Development endpoint - no auth required
    console.log('Autofix POST API called');

    const body = await request.json();
    const { suggestionId, errorType, errorMessage, dryRun = true, customSuggestion } = body;

    // Use custom suggestion if provided, otherwise generate and find
    let suggestion: AutofixSuggestion;
    
    if (customSuggestion) {
      suggestion = customSuggestion;
      console.log('Using custom suggestion:', suggestion.title);
    } else {
      // Generate suggestions and find the one to apply
      const suggestions = await generateAutofixSuggestions(errorType || '', errorMessage || '');
      const found = suggestions.find(s => s.id === suggestionId);
      
      if (!found) {
        return NextResponse.json(
          { error: 'Suggestion not found' },
          { status: 404 }
        );
      }
      suggestion = found;
    }

    const results = {
      applied: [] as string[],
      failed: [] as { action: string; error: string }[],
      dryRun,
    };

    // Apply commands
    for (const command of suggestion.commands) {
      try {
        if (!dryRun) {
          const { stdout, stderr } = await execAsync(command, {
            cwd: process.cwd(),
          });
          results.applied.push(`Command: ${command}\nOutput: ${stdout || stderr}`);
        } else {
          results.applied.push(`[DRY RUN] Would execute: ${command}`);
        }
      } catch (error) {
        results.failed.push({
          action: `Command: ${command}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Apply file changes
    for (const file of suggestion.files) {
      try {
        const filePath = path.join(process.cwd(), file.path);
        
        if (!dryRun) {
          switch (file.action) {
            case 'create':
              if (file.content) {
                await fs.writeFile(filePath, file.content);
                results.applied.push(`Created file: ${file.path}`);
              }
              break;
            case 'modify':
              if (file.content) {
                // Backup original file
                const backup = await fs.readFile(filePath, 'utf-8');
                await fs.writeFile(`${filePath}.backup`, backup);
                await fs.writeFile(filePath, file.content);
                results.applied.push(`Modified file: ${file.path} (backup created)`);
              }
              break;
            case 'delete':
              await fs.unlink(filePath);
              results.applied.push(`Deleted file: ${file.path}`);
              break;
          }
        } else {
          results.applied.push(`[DRY RUN] Would ${file.action} file: ${file.path}`);
        }
      } catch (error) {
        results.failed.push({
          action: `File ${file.action}: ${file.path}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Create a git commit if changes were made and not a dry run
    if (!dryRun && results.applied.length > 0 && results.failed.length === 0) {
      try {
        await execAsync('git add -A');
        await execAsync(`git commit -m "Auto-fix: ${suggestion.title}\n\nApplied automatic fix for ${errorType}"`);
        results.applied.push('Created git commit for changes');
      } catch (error) {
        // Commit might fail if no changes were made
        console.log('Git commit failed (might be no changes):', error);
      }
    }

    return NextResponse.json({
      success: results.failed.length === 0,
      suggestion,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error applying autofix:', error);
    return NextResponse.json(
      {
        error: 'Failed to apply autofix',
        code: 'AUTOFIX_APPLY_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Generate autofix suggestions based on error type and message
async function generateAutofixSuggestions(
  errorType: string,
  errorMessage: string
): Promise<AutofixSuggestion[]> {
  const suggestions: AutofixSuggestion[] = [];

  // NPM errors
  if (errorType.includes('NPM') || errorMessage.includes('npm')) {
    suggestions.push({
      id: 'npm-install',
      title: 'Reinstall dependencies',
      description: 'Remove node_modules and package-lock.json, then reinstall',
      confidence: 'high',
      commands: [
        'rm -rf node_modules package-lock.json',
        'npm cache clean --force',
        'npm install',
      ],
      files: [],
      preventive: false,
    });

    if (errorMessage.includes('audit')) {
      suggestions.push({
        id: 'npm-audit-fix',
        title: 'Fix npm vulnerabilities',
        description: 'Run npm audit fix to resolve security vulnerabilities',
        confidence: 'high',
        commands: [
          'npm audit fix',
          'npm audit fix --force',
        ],
        files: [],
        preventive: true,
      });
    }
  }

  // Module not found errors
  if (errorType.includes('Module Not Found') || errorMessage.includes('Cannot find module')) {
    const moduleMatch = errorMessage.match(/Cannot find module ['"](.+?)['"]/);
    const moduleName = moduleMatch ? moduleMatch[1] : '';

    if (moduleName) {
      suggestions.push({
        id: 'install-missing-module',
        title: `Install missing module: ${moduleName}`,
        description: `Install the missing dependency ${moduleName}`,
        confidence: 'high',
        commands: [
          `npm install ${moduleName}`,
        ],
        files: [],
        preventive: false,
      });
    }

    suggestions.push({
      id: 'check-imports',
      title: 'Fix import paths',
      description: 'Check and fix import statements',
      confidence: 'medium',
      commands: [
        'npm run lint -- --fix',
      ],
      files: [],
      preventive: true,
    });
  }

  // TypeScript errors
  if (errorType.includes('TypeScript') || errorType.includes('Type Error')) {
    suggestions.push({
      id: 'fix-types',
      title: 'Fix TypeScript errors',
      description: 'Run TypeScript compiler and attempt to fix type errors',
      confidence: 'medium',
      commands: [
        'npx tsc --noEmit --skipLibCheck',
        'npm run type-check',
      ],
      files: [],
      preventive: false,
    });

    suggestions.push({
      id: 'update-types',
      title: 'Update type definitions',
      description: 'Update @types packages to latest versions',
      confidence: 'low',
      commands: [
        'npm update --save-dev @types/node @types/react @types/react-dom',
      ],
      files: [],
      preventive: true,
    });
  }

  // Lint errors
  if (errorType.includes('Lint') || errorMessage.includes('eslint')) {
    suggestions.push({
      id: 'auto-fix-lint',
      title: 'Auto-fix lint errors',
      description: 'Run ESLint with auto-fix flag',
      confidence: 'high',
      commands: [
        'npm run lint -- --fix',
        'npx prettier --write "src/**/*.{ts,tsx,js,jsx}"',
      ],
      files: [],
      preventive: false,
    });
  }

  // Test failures
  if (errorType.includes('Test') || errorMessage.includes('test failed')) {
    suggestions.push({
      id: 'update-snapshots',
      title: 'Update test snapshots',
      description: 'Update Jest snapshots if snapshot tests are failing',
      confidence: 'medium',
      commands: [
        'npm test -- -u',
      ],
      files: [],
      preventive: false,
    });

    suggestions.push({
      id: 'clear-test-cache',
      title: 'Clear test cache',
      description: 'Clear Jest cache and re-run tests',
      confidence: 'low',
      commands: [
        'npx jest --clearCache',
        'npm test',
      ],
      files: [],
      preventive: false,
    });
  }

  // Build failures
  if (errorType.includes('Build') || errorMessage.includes('build failed')) {
    suggestions.push({
      id: 'clean-build',
      title: 'Clean and rebuild',
      description: 'Remove build artifacts and rebuild',
      confidence: 'high',
      commands: [
        'rm -rf .next',
        'rm -rf dist',
        'npm run build',
      ],
      files: [],
      preventive: false,
    });

    suggestions.push({
      id: 'check-env',
      title: 'Check environment variables',
      description: 'Ensure all required environment variables are set',
      confidence: 'medium',
      commands: [],
      files: [
        {
          path: '.env.local',
          action: 'create',
          content: `# Auto-generated environment file
DATABASE_URL=postgresql://user:password@localhost:5432/agendaiq
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
JWT_SECRET=your-jwt-secret`,
        },
      ],
      preventive: true,
    });
  }

  // Database/Prisma errors
  if (errorMessage.includes('prisma') || errorMessage.includes('database')) {
    suggestions.push({
      id: 'prisma-generate',
      title: 'Regenerate Prisma client',
      description: 'Regenerate Prisma client and push schema',
      confidence: 'high',
      commands: [
        'npx prisma generate',
        'npx prisma db push',
      ],
      files: [],
      preventive: false,
    });

    suggestions.push({
      id: 'prisma-migrate',
      title: 'Run database migrations',
      description: 'Apply pending database migrations',
      confidence: 'medium',
      commands: [
        'npx prisma migrate deploy',
      ],
      files: [],
      preventive: false,
    });
  }

  // Memory errors
  if (errorType.includes('Memory') || errorMessage.includes('heap out of memory')) {
    suggestions.push({
      id: 'increase-memory',
      title: 'Increase Node.js memory limit',
      description: 'Increase memory allocation for Node.js processes',
      confidence: 'high',
      commands: [],
      files: [
        {
          path: '.npmrc',
          action: 'create',
          content: 'node-options="--max-old-space-size=4096"',
        },
      ],
      preventive: true,
    });
  }

  // Connection errors
  if (errorType.includes('Connection') || errorMessage.includes('ECONNREFUSED')) {
    suggestions.push({
      id: 'check-services',
      title: 'Check and restart services',
      description: 'Ensure all required services are running',
      confidence: 'medium',
      commands: [
        'docker-compose up -d',
        'npm run dev',
      ],
      files: [],
      preventive: false,
    });
  }

  // Generic fallback suggestions
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'general-cleanup',
      title: 'General cleanup and rebuild',
      description: 'Perform a complete cleanup and rebuild',
      confidence: 'low',
      commands: [
        'rm -rf node_modules .next package-lock.json',
        'npm cache clean --force',
        'npm install',
        'npm run build',
      ],
      files: [],
      preventive: false,
    });
  }

  return suggestions;
}