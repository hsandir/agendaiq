import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'list') {
      return await listBackups();
    } else if (action === 'status') {
      return await getBackupStatus();
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Backup GET failed:', error);
    return NextResponse.json(
      { error: 'Failed to process backup request', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, message, restore, components } = await request.json();

    if (type === 'create') {
      return await createBackup(message);
    } else if (type === 'full-system') {
      return await createFullSystemBackup(components);
    } else if (type === 'github-push') {
      return await pushToGitHub(message);
    } else if (type === 'auto-backup') {
      return await autoBackup(message);
    } else if (type === 'restore' && restore) {
      return await restoreBackup(restore);
    }

    return NextResponse.json({ error: 'Invalid backup type' }, { status: 400 });
  } catch (error: any) {
    console.error('Backup POST failed:', error);
    return NextResponse.json(
      { error: 'Failed to process backup request', details: error.message },
      { status: 500 }
    );
  }
}

async function createBackup(message: string = 'Manual backup') {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const branchName = `backup/manual-${timestamp}`;
    
    // Get current branch and status
    const { stdout: currentBranch } = await execAsync('git branch --show-current', { cwd: process.cwd() });
    const { stdout: status } = await execAsync('git status --porcelain', { cwd: process.cwd() });
    
    // Create backup info
    const backupInfo = {
      timestamp: new Date().toISOString(),
      branch: branchName,
      originalBranch: currentBranch.trim(),
      message: message,
      type: 'manual',
      changes: status.split('\n').filter(line => line.trim()).length,
      files: await getProjectFiles()
    };

    // Stage all changes
    await execAsync('git add -A', { cwd: process.cwd() });
    
    // Commit if there are changes
    if (status.trim()) {
      await execAsync(`git commit -m "${message} - ${timestamp}"`, { cwd: process.cwd() });
    }

    // Create backup branch
    await execAsync(`git checkout -b ${branchName}`, { cwd: process.cwd() });
    
    // Return to original branch
    await execAsync(`git checkout ${currentBranch.trim()}`, { cwd: process.cwd() });

    // Save backup metadata
    await saveBackupMetadata(backupInfo);

    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      backup: backupInfo
    });

  } catch (error: any) {
    console.error('Backup creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create backup', details: error.message },
      { status: 500 }
    );
  }
}

async function pushToGitHub(message: string = 'Automated backup') {
  try {
    const timestamp = new Date().toISOString();
    
    // Get current branch
    const { stdout: currentBranch } = await execAsync('git branch --show-current', { cwd: process.cwd() });
    
    // Stage and commit all changes
    await execAsync('git add -A', { cwd: process.cwd() });
    
    const { stdout: status } = await execAsync('git status --porcelain', { cwd: process.cwd() });
    if (status.trim()) {
      await execAsync(`git commit -m "${message} - ${timestamp}"`, { cwd: process.cwd() });
    }

    // Try to push to GitHub
    try {
      const { stdout: pushOutput } = await execAsync(`git push origin ${currentBranch.trim()}`, { 
        cwd: process.cwd(),
        timeout: 30000 
      });

      const backupInfo = {
        timestamp,
        branch: currentBranch.trim(),
        message: message,
        type: 'github',
        pushed: true,
        output: pushOutput
      };

      await saveBackupMetadata(backupInfo);

      return NextResponse.json({
        success: true,
        message: 'Successfully pushed to GitHub',
        backup: backupInfo
      });

    } catch (pushError: any) {
      // If push fails, still save local backup info
      const backupInfo = {
        timestamp,
        branch: currentBranch.trim(),
        message: message,
        type: 'github-failed',
        pushed: false,
        error: pushError.message
      };

      await saveBackupMetadata(backupInfo);

      return NextResponse.json({
        success: false,
        message: 'Local backup saved, but GitHub push failed',
        backup: backupInfo,
        suggestion: 'Check GitHub credentials and network connection'
      });
    }

  } catch (error: any) {
    console.error('GitHub backup failed:', error);
    return NextResponse.json(
      { error: 'Failed to backup to GitHub', details: error.message },
      { status: 500 }
    );
  }
}

async function autoBackup(triggerReason: string = 'System update') {
  try {
    const timestamp = new Date().toISOString();
    const branchName = `backup/auto-${timestamp.replace(/[:.]/g, '-')}`;
    
    // Get project status
    const { stdout: status } = await execAsync('git status --porcelain', { cwd: process.cwd() });
    
    if (!status.trim()) {
      return NextResponse.json({
        success: true,
        message: 'No changes to backup',
        skipped: true
      });
    }

    // Create auto backup
    await execAsync('git add -A', { cwd: process.cwd() });
    await execAsync(`git commit -m "Auto-backup: ${triggerReason} - ${timestamp}"`, { cwd: process.cwd() });
    
    // Create backup branch
    const { stdout: currentBranch } = await execAsync('git branch --show-current', { cwd: process.cwd() });
    await execAsync(`git branch ${branchName}`, { cwd: process.cwd() });

    const backupInfo: any = {
      timestamp,
      branch: branchName,
      originalBranch: currentBranch.trim(),
      message: `Auto-backup: ${triggerReason}`,
      type: 'auto',
      trigger: triggerReason,
      changes: status.split('\n').filter(line => line.trim()).length
    };

    await saveBackupMetadata(backupInfo);

    // Try to push to GitHub automatically
    try {
      await execAsync(`git push origin ${branchName}`, { 
        cwd: process.cwd(),
        timeout: 15000 
      });
      backupInfo.pushed = true;
    } catch {
      backupInfo.pushed = false;
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-backup completed',
      backup: backupInfo
    });

  } catch (error: any) {
    console.error('Auto-backup failed:', error);
    return NextResponse.json(
      { error: 'Auto-backup failed', details: error.message },
      { status: 500 }
    );
  }
}

async function restoreBackup(backupBranch: string) {
  try {
    // Get current status
    const { stdout: currentBranch } = await execAsync('git branch --show-current', { cwd: process.cwd() });
    
    // Checkout to backup branch
    await execAsync(`git checkout ${backupBranch}`, { cwd: process.cwd() });
    
    // Create restoration point
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const restorePoint = `restore-point-${timestamp}`;
    await execAsync(`git checkout -b ${restorePoint}`, { cwd: process.cwd() });
    
    // Return to main branch and merge
    await execAsync(`git checkout ${currentBranch.trim()}`, { cwd: process.cwd() });
    await execAsync(`git merge ${backupBranch}`, { cwd: process.cwd() });

    const restoreInfo = {
      timestamp: new Date().toISOString(),
      restoredFrom: backupBranch,
      restorePoint: restorePoint,
      currentBranch: currentBranch.trim()
    };

    await saveBackupMetadata({
      ...restoreInfo,
      type: 'restore',
      message: `Restored from backup: ${backupBranch}`
    });

    return NextResponse.json({
      success: true,
      message: 'Backup restored successfully',
      restore: restoreInfo
    });

  } catch (error: any) {
    console.error('Restore failed:', error);
    return NextResponse.json(
      { error: 'Failed to restore backup', details: error.message },
      { status: 500 }
    );
  }
}

async function listBackups() {
  try {
    // Get all backup branches
    const { stdout: branches } = await execAsync('git branch -a', { cwd: process.cwd() });
    const backupBranches = branches
      .split('\n')
      .map(branch => branch.trim().replace(/^\*\s*/, ''))
      .filter(branch => branch.includes('backup/'))
      .slice(0, 20); // Limit to 20 most recent

    // Load backup metadata
    const backups = [];
    try {
      const metadataPath = path.join(process.cwd(), '.backup-metadata.json');
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      
      for (const branch of backupBranches) {
        const backupData = metadata.find((b: any) => b.branch === branch) || {
          branch,
          timestamp: 'Unknown',
          message: 'No metadata available',
          type: 'unknown'
        };
        backups.push(backupData);
      }
    } catch {
      // If no metadata file, create basic backup list
      for (const branch of backupBranches) {
        backups.push({
          branch,
          timestamp: 'Unknown',
          message: 'No metadata available',
          type: 'unknown'
        });
      }
    }

    return NextResponse.json({
      success: true,
      backups: backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    });

  } catch (error: any) {
    console.error('List backups failed:', error);
    return NextResponse.json(
      { error: 'Failed to list backups', details: error.message },
      { status: 500 }
    );
  }
}

async function getBackupStatus() {
  try {
    const { stdout: currentBranch } = await execAsync('git branch --show-current', { cwd: process.cwd() });
    const { stdout: status } = await execAsync('git status --porcelain', { cwd: process.cwd() });
    const { stdout: lastCommit } = await execAsync('git log -1 --format="%H %s %ad" --date=iso', { cwd: process.cwd() });
    
    // Check GitHub connection
    let githubStatus = 'unknown';
    try {
      await execAsync('git ls-remote origin HEAD', { cwd: process.cwd(), timeout: 5000 });
      githubStatus = 'connected';
    } catch {
      githubStatus = 'disconnected';
    }

    // Get backup count
    const { stdout: branches } = await execAsync('git branch -a', { cwd: process.cwd() });
    const backupCount = branches.split('\n').filter(branch => branch.includes('backup/')).length;

    return NextResponse.json({
      success: true,
      status: {
        currentBranch: currentBranch.trim(),
        hasUncommittedChanges: status.trim().length > 0,
        uncommittedFiles: status.split('\n').filter(line => line.trim()).length,
        lastCommit: lastCommit.trim(),
        githubStatus,
        backupCount,
        diskUsage: await getDiskUsage()
      }
    });

  } catch (error: any) {
    console.error('Get backup status failed:', error);
    return NextResponse.json(
      { error: 'Failed to get backup status', details: error.message },
      { status: 500 }
    );
  }
}

async function saveBackupMetadata(backupInfo: any) {
  try {
    const metadataPath = path.join(process.cwd(), '.backup-metadata.json');
    let metadata = [];
    
    try {
      metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    } catch {
      // File doesn't exist, start with empty array
    }

    metadata.push(backupInfo);
    
    // Keep only last 50 backups
    metadata = metadata.slice(-50);
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.warn('Failed to save backup metadata:', error);
  }
}

async function getProjectFiles() {
  try {
    const { stdout } = await execAsync('find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" | grep -v node_modules | grep -v .next | head -20', { cwd: process.cwd() });
    return stdout.split('\n').filter(line => line.trim()).length;
  } catch {
    return 0;
  }
}

async function getDiskUsage() {
  try {
    const { stdout } = await execAsync('du -sh .', { cwd: process.cwd() });
    return stdout.split('\t')[0];
  } catch {
    return 'Unknown';
  }
}

async function createFullSystemBackup(components: string[] = ['database', 'settings', 'files', 'schema']) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `full-system-${timestamp}`;
    const backupDir = path.join(process.cwd(), 'temp-backup', backupId);
    const zipPath = path.join(process.cwd(), 'backups', `${backupId}.zip`);

    // Ensure directories exist
    await fs.mkdir(path.dirname(zipPath), { recursive: true });
    await fs.mkdir(backupDir, { recursive: true });

    let totalSize = 0;
    const includedComponents: string[] = [];

    // 1. Database Backup
    if (components.includes('database')) {
      try {
        const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
        const dbBackupPath = path.join(backupDir, 'database.db');
        await fs.copyFile(dbPath, dbBackupPath);
        
        const dbStats = await fs.stat(dbBackupPath);
        totalSize += dbStats.size;
        includedComponents.push('Database');
      } catch (error) {
        console.warn('Database backup failed:', error);
      }
    }

    // 2. System Settings
    if (components.includes('settings')) {
      try {
        const settingsDir = path.join(backupDir, 'settings');
        await fs.mkdir(settingsDir, { recursive: true });

        // Copy environment files
        const envFiles = ['.env', '.env.local', '.env.example'];
        for (const envFile of envFiles) {
          try {
            const source = path.join(process.cwd(), envFile);
            const dest = path.join(settingsDir, envFile);
            await fs.copyFile(source, dest);
          } catch {}
        }

        // Copy configuration files
        const configFiles = [
          'next.config.ts',
          'tailwind.config.ts',
          'tsconfig.json',
          'package.json',
          'package-lock.json'
        ];
        
        for (const configFile of configFiles) {
          try {
            const source = path.join(process.cwd(), configFile);
            const dest = path.join(settingsDir, configFile);
            await fs.copyFile(source, dest);
          } catch {}
        }

        const settingsStats = await fs.stat(settingsDir);
        totalSize += settingsStats.size;
        includedComponents.push('Settings');
      } catch (error) {
        console.warn('Settings backup failed:', error);
      }
    }

    // 3. Uploaded Files (if exists)
    if (components.includes('files')) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        const filesBackupDir = path.join(backupDir, 'files');
        
        // Check if uploads directory exists
        try {
          await fs.access(uploadsDir);
          await execAsync(`cp -r "${uploadsDir}" "${filesBackupDir}"`);
          const filesStats = await fs.stat(filesBackupDir);
          totalSize += filesStats.size;
          includedComponents.push('Files');
        } catch {
          // Create empty files directory
          await fs.mkdir(filesBackupDir, { recursive: true });
          await fs.writeFile(path.join(filesBackupDir, '.gitkeep'), '');
          includedComponents.push('Files (Empty)');
        }
      } catch (error) {
        console.warn('Files backup failed:', error);
      }
    }

    // 4. Database Schema
    if (components.includes('schema')) {
      try {
        const schemaDir = path.join(backupDir, 'schema');
        await fs.mkdir(schemaDir, { recursive: true });

        // Copy Prisma schema and migrations
        const prismaDir = path.join(process.cwd(), 'prisma');
        await execAsync(`cp -r "${prismaDir}" "${schemaDir}/"`);

        const schemaStats = await fs.stat(schemaDir);
        totalSize += schemaStats.size;
        includedComponents.push('Schema');
      } catch (error) {
        console.warn('Schema backup failed:', error);
      }
    }

    // 5. System Logs (if requested)
    if (components.includes('logs')) {
      try {
        const logsDir = path.join(backupDir, 'logs');
        await fs.mkdir(logsDir, { recursive: true });

        const systemLogsDir = path.join(process.cwd(), 'logs');
        try {
          await fs.access(systemLogsDir);
          await execAsync(`cp -r "${systemLogsDir}" "${logsDir}/"`);
        } catch {
          // Create backup metadata log
          const metadata = {
            timestamp: new Date().toISOString(),
            components: includedComponents,
            systemInfo: {
              nodeVersion: process.version,
              platform: process.platform,
              arch: process.arch
            }
          };
          await fs.writeFile(path.join(logsDir, 'backup-metadata.json'), JSON.stringify(metadata, null, 2));
        }

        const logsStats = await fs.stat(logsDir);
        totalSize += logsStats.size;
        includedComponents.push('Logs');
      } catch (error) {
        console.warn('Logs backup failed:', error);
      }
    }

    // Create ZIP file
    await execAsync(`cd "${backupDir}" && zip -r "${zipPath}" ./*`);

    // Clean up temporary directory
    await execAsync(`rm -rf "${backupDir}"`);

    // Get final ZIP size
    const zipStats = await fs.stat(zipPath);
    const finalSize = zipStats.size;

    // Save backup metadata
    const backupInfo = {
      id: backupId,
      type: 'full-system',
      status: 'completed',
      size: `${(finalSize / 1024 / 1024).toFixed(2)} MB`,
      timestamp: new Date().toISOString(),
      filename: `${backupId}.zip`,
      components: includedComponents,
      downloadUrl: `/api/system/backup/download/${backupId}.zip`,
      duration: '~30s'
    };

    await saveBackupMetadata(backupInfo);

    return NextResponse.json({
      success: true,
      message: 'Full system backup created successfully',
      backup: backupInfo
    });

  } catch (error: any) {
    console.error('Full system backup failed:', error);
    return NextResponse.json(
      { error: 'Failed to create full system backup', details: error.message },
      { status: 500 }
    );
  }
}

// PUT method for uploading and restoring backups
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('backup') as File;

    if (!file) {
      return NextResponse.json({ error: 'No backup file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ error: 'Invalid file type. Only ZIP files are supported.' }, { status: 400 });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const restoreDir = path.join(process.cwd(), 'temp-restore', timestamp);
    const uploadPath = path.join(restoreDir, file.name);

    // Create restore directory
    await fs.mkdir(restoreDir, { recursive: true });

    // Save uploaded file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    await fs.writeFile(uploadPath, buffer);

    // Extract ZIP file
    await execAsync(`cd "${restoreDir}" && unzip "${file.name}"`);

    // Restore components (simplified - in production this would be more careful)
    let restoredComponents: string[] = [];

    // Restore database
    try {
      const dbBackupPath = path.join(restoreDir, 'database.db');
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      await fs.copyFile(dbBackupPath, dbPath);
      restoredComponents.push('Database');
    } catch {}

    // Clean up
    await execAsync(`rm -rf "${restoreDir}"`);

    const restoreInfo = {
      timestamp: new Date().toISOString(),
      filename: file.name,
      restoredComponents,
      type: 'restore',
      status: 'completed'
    };

    await saveBackupMetadata(restoreInfo);

    return NextResponse.json({
      success: true,
      message: 'Backup restored successfully',
      restore: restoreInfo
    });

  } catch (error: any) {
    console.error('Backup upload/restore failed:', error);
    return NextResponse.json(
      { error: 'Failed to upload and restore backup', details: error.message },
      { status: 500 }
    );
  }
}