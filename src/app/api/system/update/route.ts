import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_UPDATE });
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }
    const { type, packages } = (await request.json()) as Record<string, unknown>;

    if (type === 'packages') {
      return await updatePackages(Array.isArray(packages) ? packages as string[] : []);
    }

    return NextResponse.json(
      { error: 'Invalid update type' },
      { status: 400 }
    );

  } catch (error: unknown) {
    console.error('Update request failed:', error);
    return NextResponse.json(
      { error: 'Failed to process update request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function updatePackages(specificPackages?: string[]) {
  try {
    // Create auto-backup before updating
    try {
      const backupResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/system/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'auto-backup', 
          message: 'Pre-update backup' 
        })
      });
      
      if (backupResponse.ok) {
        console.log('Auto-backup created before package update');
      } else {
        console.warn('Auto-backup failed, continuing with update');
      }
    } catch (error: unknown) {
      console.warn('Auto-backup failed:', error);
    }

    // Get current package status
    const beforeStatus = await getDetailedPackageStatus();
    console.log('Before update - outdated packages:', beforeStatus.outdated.length);

    const updateReport = {
      attempted: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [] as Array<{
        package: string;
        status: 'success' | 'failed' | 'skipped';
        reason?: string;
        from?: string;
        to?: string;
        error?: string;
      }>
    };

    // Filter packages for Node.js compatibility and actual updates needed
    let packagesToUpdate = beforeStatus.outdated;
    
    // If specific packages are requested, filter for those
    if (specificPackages && specificPackages.length > 0) {
      packagesToUpdate = packagesToUpdate.filter(pkg => specificPackages.includes(pkg.name));
    }
    
    packagesToUpdate = packagesToUpdate.filter(pkg => {
      // Skip packages that require newer Node.js versions
      if (pkg.name === 'lru-cache' && pkg.latest.includes('11.')) {
        updateReport.details.push({
          package: pkg.name,
          status: 'skipped',
          reason: 'Requires Node.js 20+, current: 18.20.8',
          from: pkg.current,
          to: pkg.latest
        });
        updateReport.skipped++;
        return false;
      }

      // Skip "downgrades" (when latest is actually older)
      if (isActualDowngrade(pkg.current, pkg.latest)) {
        updateReport.details.push({
          package: pkg.name,
          status: 'skipped',
          reason: 'Latest version is older than current (keeping current)',
          from: pkg.current,
          to: pkg.latest
        });
        updateReport.skipped++;
        return false;
      }

      // Skip same versions
      if (pkg.current === pkg.latest || pkg.current === pkg.wanted) {
        updateReport.details.push({
          package: pkg.name,
          status: 'skipped',
          reason: 'Already at latest compatible version',
          from: pkg.current,
          to: pkg.latest
        });
        updateReport.skipped++;
        return false;
      }

      // Skip major React updates (keep on 18.x for compatibility)
      if ((pkg.name === 'react' || pkg.name === 'react-dom' || pkg.name.includes('@types/react')) && 
          pkg.latest.startsWith('19.')) {
        updateReport.details.push({
          package: pkg.name,
          status: 'skipped',
          reason: 'Major React version skipped for compatibility',
          from: pkg.current,
          to: pkg.latest
        });
        updateReport.skipped++;
        return false;
      }

      // Skip TailwindCSS v4 (beta/unstable)
      if (pkg.name === 'tailwindcss' && pkg.latest.startsWith('4.')) {
        updateReport.details.push({
          package: pkg.name,
          status: 'skipped',
          reason: 'TailwindCSS v4 is beta, keeping stable v3',
          from: pkg.current,
          to: pkg.latest
        });
        updateReport.skipped++;
        return false;
      }

      return true;
    });

    updateReport.attempted = packagesToUpdate.length;

    if (packagesToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No compatible updates available',
        summary: updateReport,
        suggestion: 'All packages are at their latest compatible versions for Node.js 18.x'
      });
    }

    // Clean npm cache first to avoid ENOTEMPTY errors
    try {
      await execAsync('npm cache clean --force', { cwd: process.cwd() });
    } catch (error: unknown) {
      console.warn('Cache clean warning:', error);
    }

    // Update packages individually for better reporting
    for (const pkg of packagesToUpdate) {
      try {
        // Use wanted version (compatible) rather than latest
        const targetVersion = pkg.wanted ?? pkg.latest;
        
        await execAsync(
          `npm install ${pkg.name}@${targetVersion} --save --legacy-peer-deps --no-audit`,
          { 
            cwd: process.cwd(),
            timeout: 60000 // 1 minute per package
          }
        );

        updateReport.details.push({
          package: pkg.name,
          status: 'success',
          from: pkg.current,
          to: targetVersion
        });
        updateReport.successful++;

      } catch (error: unknown) {
        console.error(`Failed to update ${pkg.name}:`, error instanceof Error ? error.message : String(error));
        
        updateReport.details.push({
          package: pkg.name,
          status: 'failed',
          from: pkg.current,
          to: pkg.wanted ?? pkg.latest,
          error: error instanceof Error ? error.message : String(error).split('\n')[0] // First line of error
        });
        updateReport.failed++;
      }
    }

    // Get final status
    const afterStatus = await getDetailedPackageStatus();

    return NextResponse.json({
      success: updateReport.successful > 0,
      message: `Update completed: ${updateReport.successful} successful, ${updateReport.failed} failed, ${updateReport.skipped} skipped`,
      summary: updateReport,
      before: beforeStatus.outdated.length,
      after: afterStatus.outdated.length,
      suggestion: updateReport.failed > 0 ? 
        'Some updates failed. Check the detailed report and consider using compatibility fix.' : 
        'Updates completed successfully!'
    });

  } catch (error: unknown) {
    console.error('Package update failed:', error);
    return NextResponse.json(
      { 
        error: 'Package update failed', 
        details: error instanceof Error ? error.message : String(error),
        suggestion: 'Try using System Management compatibility fix to resolve conflicts'
      },
      { status: 500 }
    );
  }
}

async function getDetailedPackageStatus() {
  try {
    const { stdout } = await execAsync('npm outdated --json', { cwd: process.cwd() });
    const outdatedPackages = JSON.parse(stdout || '{}');
    
    const outdatedList = (Object.entries(outdatedPackages).map(([name, info]: [string, any]) => ({
      name,
      current: info.current,
      wanted: info.wanted,
      latest: info.latest,
      type: getUpdateType(info.current, info.latest)
    })));

    return {
      outdated: outdatedList,
      total: outdatedList.length
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'stdout' in error) {
      try {
        const outdatedPackages = JSON.parse(String((error as any).stdout || '{}'));
        const outdatedList = (Object.entries(outdatedPackages).map(([name, info]: [string, any]) => ({
          name,
          current: info.current,
          wanted: info.wanted,
          latest: info.latest,
          type: getUpdateType(info.current, info.latest)
        })));
        return { outdated: outdatedList, total: outdatedList.length };
      } catch {
        return { outdated: [], total: 0 };
      }
    }
    return { outdated: [], total: 0 };
  }
}

function isActualDowngrade(current: string, latest: string): boolean {
  try {
    // Remove non-numeric prefixes and compare
    const currentNumbers = (current.replace(/[^\d.]/g, '').split('.').map(Number));
    const latestNumbers = (latest.replace(/[^\d.]/g, '').split('.').map(Number));
    
    // Compare major.minor.patch
    for (let i = 0; i < Math.max(currentNumbers.length, latestNumbers.length); i++) {
      const curr = currentNumbers[i] ?? 0;
      const lat = latestNumbers[i] ?? 0;
      
      if (lat < curr) return true;  // Latest is lower = downgrade
      if (lat > curr) return false; // Latest is higher = upgrade
    }
    
    return false; // Same version
  } catch {
    return false;
  }
}

function getUpdateType(current: string, latest: string): 'major' | 'minor' | 'patch' {
  try {
    const currentParts = (current.replace(/[^\d.]/g, '').split('.').map(Number));
    const latestParts = (latest.replace(/[^\d.]/g, '').split('.').map(Number));
    
    if (latestParts[0] > currentParts[0]) return 'major';
    if (latestParts[1] > currentParts[1]) return 'minor';
    return 'patch';
  } catch {
    return 'patch';
  }
} 