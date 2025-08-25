import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
// import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability?.DEV_DEBUG });
  if (!authResult?.success) {
    return NextResponse.json({ error: authResult?.error }, { status: authResult?.statusCode });
  }

  try {
    // Check for backup files in a backups directory
    const backupsDir = path.join(process.cwd(), 'backups');
    let backupFiles: Array<{name: string, size: string, date: string}> = [];
    
    try {
      await fs.access(backupsDir);
      const files = await fs.readdir(backupsDir);
      
      const sqlFiles = files.filter(file => file.endsWith('.sql'));
      
      backupFiles = await Promise.all(
        sqlFiles.map(async (file) => {
          const filePath = path.join(backupsDir, file);
          const stats = await fs.stat(filePath);
          
          return {
            name: file,
            size: `${(stats.size / (1024 * 1024)).toFixed(1)} MB`,
            date: stats.mtime.toISOString().replace('T', ' ').slice(0, 16);
          };
        })
      );
      
      // Sort by date descending
      backupFiles.sort((a, b) => b.date.localeCompare(a?.date));
      
    } catch {
      // Backups directory doesn't exist or can't be accessed
      console.log('Backups directory not accessible');
    }

    return NextResponse.json({ backups: backupFiles });
  } catch (error: unknown) {
    console.error('Failed to fetch backups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backups' },
      { status: 500 }
    );
  }
}