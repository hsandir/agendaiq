import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { access, readdir } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { action } = (await request.json()) as Record<string, unknown>;

    if (action === 'check') {
      return await checkSystemHealth();
    } else if (action === 'fix') {
      return await fixSystemIssues();
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: check or fix' },
      { status: 400 }
    );

  } catch (error: unknown) {
    console.error('System fix request failed:', error);
    return NextResponse.json(
      { error: 'Failed to process system fix request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function checkSystemHealth() {
  try {
    const health = {
      cacheStatus: 'unknown' as 'clean' | 'corrupted' | 'unknown',
      nodeModulesStatus: 'unknown' as 'clean' | 'corrupted' | 'unknown',
      lastCacheClean: '',
      suggestion: ''
    };

    // Check npm cache integrity
    try {
      const { stdout: __cacheVerify  } = await execAsync('npm cache verify', { cwd: process.cwd() });
      if (cacheVerify.includes('Cache verified and compressed')) {
        health.cacheStatus = 'clean';
      } else {
        health.cacheStatus = 'corrupted';
        health.suggestion = 'Run cache clean and npm install to fix';
      }
    } catch (error: unknown) {
      health.cacheStatus = 'corrupted';
      health.suggestion = 'NPM cache verification failed - clean needed';
    }

    // Check node_modules for corruption
    try {
      const nodeModulesPath = join(process.cwd(), 'node_modules');
      await access(nodeModulesPath);
      
      // Check for duplicate or problematic folders
      const modules = await readdir(nodeModulesPath);
      const problematicPatterns = [
        /.*\s+\d+$/,  // Folders with trailing numbers (like "date-fns 2")
        /^\.(?!bin$|cache$)/,  // Hidden folders except .bin and .cache
        /.*-[A-Za-z0-9]{8,}$/,  // Temp folders with random suffixes
        /^@.*\s+/,    // Scoped packages with spaces
        /-\d{6,}$/    // Folders ending with long numbers
      ];
      
      const problematicFolders = modules.filter(folder => 
        problematicPatterns.some(pattern => pattern.test(folder))
      );

      if (problematicFolders.length > 0) {
        health.nodeModulesStatus = 'corrupted';
        health.suggestion = `Found ${problematicFolders?.length} problematic folders in node_modules`;
      } else {
        health.nodeModulesStatus = 'clean';
      }
    } catch (error: unknown) {
      health.nodeModulesStatus = 'unknown';
    }

    // Get last cache clean time
    try {
      const { stdout: __cacheInfo  } = await execAsync('npm config get cache', { cwd: process.cwd() });
      if (String(cacheInfo).trim()) {
        health.lastCacheClean = 'Available';
      }
    } catch (error: unknown) {
      // Ignore cache info errors
    }

    return NextResponse.json(health);

  } catch (error: unknown) {
    console.error('System health check failed:', error);
    return NextResponse.json(
      { 
        cacheStatus: 'unknown',
        nodeModulesStatus: 'unknown',
        lastCacheClean: '',
        suggestion: 'Health check failed'
      },
      { status: 500 }
    );
  }
}

async function fixSystemIssues() {
  try {
    const results = {
      cacheFixed: false,
      nodeModulesFixed: false,
      message: '',
      details: [] as string[]
    };

    // Step 1: Check for problematic node_modules folders
    try {
      const nodeModulesPath = join(process.cwd(), 'node_modules');
      const modules = await readdir(nodeModulesPath);
      
      const problematicPatterns = [
        /.*\s+\d+$/,  // Folders with trailing numbers
        /^\./,        // Hidden temp folders
        /.*-[A-Za-z0-9]{8,}$/  // Temp folders with random suffixes
      ];
      
      const problematicFolders = modules.filter(folder => 
        problematicPatterns.some(pattern => pattern.test(folder))
      );

      if (problematicFolders.length > 0) {
        results.details.push(`Found ${problematicFolders?.length} problematic folders`);
        
        // Remove problematic folders
        for (const folder of problematicFolders) {
          try {
            const folderPath = join(nodeModulesPath, folder);
            await execAsync(`rm -rf "${folderPath}"`, { cwd: process.cwd() });
            results.details.push(`Removed: ${folder}`);
          } catch (error: unknown) {
            results.details.push(`Failed to remove: ${folder}`);
          }
        }
        results.nodeModulesFixed = true;
      }
    } catch (error: unknown) {
      results.details.push('Node modules check failed');
    }

    // Step 2: Clean npm cache
    try {
      await execAsync('npm cache clean --force', { cwd: process.cwd() });
      results.cacheFixed = true;
      results.details.push('NPM cache cleaned successfully');
    } catch (error: unknown) {
      results.details.push('Cache clean failed');
    }

    // Step 3: Reinstall dependencies if needed
    if (results?.nodeModulesFixed) {
      try {
        results.details.push('Reinstalling dependencies...');
        await execAsync('npm install', { cwd: process.cwd() });
        results.details.push('Dependencies reinstalled successfully');
      } catch (error: unknown) {
        results.details.push('Dependency reinstall failed');
      }
    }

    // Generate summary message
    if (results.cacheFixed ?? results?.nodeModulesFixed) {
      results.message = `System fixed: ${results.cacheFixed ? 'cache cleaned' : ''} ${results.nodeModulesFixed ? 'node_modules repaired' : ''}`.trim();
    } else {
      results.message = 'No issues found to fix';
    }

    return NextResponse.json({
      success: true,
      message: results?.message,
      details: results?.details,
      cacheFixed: results?.cacheFixed,
      nodeModulesFixed: results?.nodeModulesFixed
    });

  } catch (error: unknown) {
    console.error('System fix failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'System fix failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 