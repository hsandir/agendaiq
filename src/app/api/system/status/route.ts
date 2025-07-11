import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '@/lib/prisma';

const execAsync = promisify(exec);

interface PackageInfo {
  current: string;
  wanted: string;
  latest: string;
}

interface OutdatedPackage {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  type: 'major' | 'minor' | 'patch';
}

export async function GET(request: NextRequest) {
  try {
    const [packages, database, server, linting, dependencies] = await Promise.all([
      getPackageStatus(),
      getDatabaseStatus(),
      getServerStatus(),
      getLintingStatus(),
      checkMissingDependencies()
    ]);

    const systemHealth = {
      overall: 'healthy',
      issues: [] as string[],
      warnings: [] as string[]
    };

    // Check for critical issues
    if (!database.connected) {
      systemHealth.overall = 'critical';
      systemHealth.issues.push('Database connection failed');
    }

    if (dependencies.missing.length > 0) {
      systemHealth.overall = systemHealth.overall === 'critical' ? 'critical' : 'degraded';
      systemHealth.issues.push(`Missing ${dependencies.missing.length} dependencies`);
    }

    if (packages.vulnerabilities > 0) {
      systemHealth.warnings.push(`${packages.vulnerabilities} security vulnerabilities found`);
    }

    if (linting.errors > 0) {
      systemHealth.warnings.push(`${linting.errors} linting errors found`);
    }

    return NextResponse.json({
      health: systemHealth,
      packages,
      database,
      server,
      linting,
      dependencies,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('System status check failed:', error);
    return NextResponse.json(
      { 
        health: { overall: 'critical', issues: ['System status check failed'], warnings: [] },
        error: 'Failed to get system status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

async function getPackageStatus() {
  try {
    // Use timeout to prevent hanging
    const timeout = 10000; // 10 seconds
    
    // Check for vulnerabilities first (faster)
    let vulnerabilities = 0;
    try {
      const result = await Promise.race([
        execAsync('npm audit --json --audit-level=moderate', { cwd: process.cwd() }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
      ]) as { stdout: string };
      const auditData = JSON.parse(result.stdout);
      vulnerabilities = auditData.metadata?.vulnerabilities?.total || 0;
    } catch {
      // npm audit returns non-zero exit code when vulnerabilities are found
    }

    // Check outdated packages with timeout
    let outdatedList: OutdatedPackage[] = [];
    try {
      const result = await Promise.race([
        execAsync('npm outdated --json', { cwd: process.cwd() }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
      ]) as { stdout: string };
      
              const outdatedPackages = JSON.parse(result.stdout || '{}');
      
      outdatedList = Object.entries(outdatedPackages)
        .map(([name, info]: [string, any]) => ({
          name,
          current: info.current,
          wanted: info.wanted,
          latest: info.latest,
          type: getUpdateType(info.current, info.latest)
        }))
        .filter(pkg => {
          // Filter out same versions
          if (pkg.current === pkg.latest || pkg.current === pkg.wanted) {
            return false;
          }
          
          // Filter out downgrades (when "latest" is actually older)
          if (isActualDowngrade(pkg.current, pkg.latest)) {
            return false;
          }
          
          // Filter out Node.js incompatible packages
          if (pkg.name === 'lru-cache' && pkg.latest.includes('11.')) {
            return false; // Skip lru-cache v11 (requires Node 20+)
          }
          
          return true;
        });
    } catch (error) {
      console.log('npm outdated timed out or failed, using cached data');
      // Return empty list if command times out
    }

    return {
      outdated: outdatedList,
      vulnerabilities,
      total: outdatedList.length
    };
  } catch (error: any) {
    if (error?.stdout) {
      try {
        const outdatedPackages = JSON.parse(error.stdout);
        const outdatedList = Object.entries(outdatedPackages)
          .map(([name, info]: [string, any]) => ({
            name,
            current: info.current,
            wanted: info.wanted,
            latest: info.latest,
            type: getUpdateType(info.current, info.latest)
          }))
          .filter(pkg => {
            // Same filtering logic
            if (pkg.current === pkg.latest || pkg.current === pkg.wanted) {
              return false;
            }
            if (isActualDowngrade(pkg.current, pkg.latest)) {
              return false;
            }
            if (pkg.name === 'lru-cache' && pkg.latest.includes('11.')) {
              return false;
            }
            return true;
          });
        return { outdated: outdatedList, vulnerabilities: 0, total: outdatedList.length };
      } catch {
        return { outdated: [], vulnerabilities: 0, total: 0 };
      }
    }
    return { outdated: [], vulnerabilities: 0, total: 0 };
  }
}

function isActualDowngrade(current: string, latest: string): boolean {
  try {
    // Remove non-numeric prefixes and compare
    const currentNumbers = current.replace(/[^\d.]/g, '').split('.').map(Number);
    const latestNumbers = latest.replace(/[^\d.]/g, '').split('.').map(Number);
    
    // Compare major.minor.patch
    for (let i = 0; i < Math.max(currentNumbers.length, latestNumbers.length); i++) {
      const curr = currentNumbers[i] || 0;
      const lat = latestNumbers[i] || 0;
      
      if (lat < curr) return true;  // Latest is lower = downgrade
      if (lat > curr) return false; // Latest is higher = upgrade
    }
    
    return false; // Same version
  } catch {
    return false;
  }
}

async function checkMissingDependencies() {
  try {
    // Check for common import patterns that might be missing
    const { stdout: grepOutput } = await execAsync(
      "grep -r \"from ['\\\"]\@\" src/ --include=\"*.tsx\" --include=\"*.ts\" --include=\"*.jsx\" --include=\"*.js\" | head -50",
      { cwd: process.cwd() }
    );

    const importLines = grepOutput.split('\n').filter(line => line.trim());
    const missingDeps = [];
    const foundDeps = new Set();

    for (const line of importLines) {
      const match = line.match(/from\s+['"](@[^'"]+|[^@'"][^'"]*)['"]/);
      if (match) {
        const dep = match[1];
        
        // Skip internal components (starting with @/ or relative imports)
        if (dep.startsWith('@/') || dep.startsWith('./') || dep.startsWith('../')) {
          continue;
        }
        
        if (!foundDeps.has(dep)) {
          foundDeps.add(dep);
          
          // Check if dependency exists in node_modules
          try {
            await execAsync(`test -d node_modules/${dep}`, { cwd: process.cwd() });
          } catch {
            // Check if it's in package.json
            try {
              const { stdout: packageJson } = await execAsync('cat package.json', { cwd: process.cwd() });
              const pkg = JSON.parse(packageJson);
              const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
              
              if (!allDeps[dep]) {
                missingDeps.push({
                  name: dep,
                  type: 'missing',
                  suggestedVersion: 'latest',
                  foundIn: line.split(':')[0]
                });
              }
            } catch {
              missingDeps.push({
                name: dep,
                type: 'missing',
                suggestedVersion: 'latest',
                foundIn: line.split(':')[0]
              });
            }
          }
        }
      }
    }

    return {
      missing: missingDeps,
      total: missingDeps.length,
      suggestion: missingDeps.length > 0 ? 
        `Run: npm install ${missingDeps.map(d => d.name).join(' ')} --legacy-peer-deps` : null
    };

  } catch (error) {
    return { missing: [], total: 0, suggestion: null };
  }
}

async function getDatabaseStatus() {
  try {
    await prisma.$connect();
    
    // Get table count
    const tables = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    ` as any[];

    await prisma.$disconnect();
    
    return {
      connected: true,
      status: 'PostgreSQL Connected',
      tables: Number(tables[0]?.count || 0)
    };
  } catch (error: any) {
    return {
      connected: false,
      status: 'Database Connection Failed',
      error: error.message,
      tables: 0
    };
  }
}

async function getServerStatus() {
  return {
    running: true,
    port: 3000,
    uptime: '0h 0m', // This could be enhanced with actual uptime tracking
    memory: process.memoryUsage(),
    node_version: process.version
  };
}

async function getLintingStatus() {
  try {
    const { stdout, stderr } = await execAsync('npx eslint src/ --format json --max-warnings 0', { 
      cwd: process.cwd() 
    });
    
    const results = JSON.parse(stdout || '[]');
    const errors = results.reduce((sum: number, result: any) => sum + result.errorCount, 0);
    const warnings = results.reduce((sum: number, result: any) => sum + result.warningCount, 0);
    
    const filesWithIssues = results
      .filter((result: any) => result.errorCount > 0 || result.warningCount > 0)
      .map((result: any) => result.filePath.replace(process.cwd(), ''))
      .slice(0, 5);

    return {
      errors,
      warnings,
      files: filesWithIssues
    };
  } catch (error: any) {
    // ESLint might return non-zero exit code for errors, parse the output anyway
    try {
      const results = JSON.parse(error.stdout || '[]');
      const errors = results.reduce((sum: number, result: any) => sum + result.errorCount, 0);
      const warnings = results.reduce((sum: number, result: any) => sum + result.warningCount, 0);
      
      return { errors, warnings, files: [] };
    } catch {
      return { errors: 0, warnings: 0, files: [] };
    }
  }
}

function getUpdateType(current: string, latest: string): 'major' | 'minor' | 'patch' {
  try {
    const currentParts = current.replace(/[^\d.]/g, '').split('.').map(Number);
    const latestParts = latest.replace(/[^\d.]/g, '').split('.').map(Number);
    
    if (latestParts[0] > currentParts[0]) return 'major';
    if (latestParts[1] > currentParts[1]) return 'minor';
    return 'patch';
  } catch {
    return 'patch';
  }
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
} 