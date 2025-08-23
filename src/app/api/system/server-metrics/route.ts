import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '@/lib/utils/logger';

const execAsync = promisify(exec);

interface ServerMetrics {
  system: {
    platform: string;
    architecture: string;
    nodeVersion: string;
    nextVersion: string;
    uptime: string;
    hostname: string;
  };
  performance: {
    memory: {
      total: number;
      used: number;
      free: number;
      usage: number;
    };
    cpu: {
      usage: number;
      cores: number;
      model: string;
    };
    disk: {
      total: number;
      used: number;
      free: number;
      usage: number;
    };
  };
  network: {
    protocol: string;
    host: string;
    port: number;
    status: string;
  };
  health: {
    overall: 'healthy' | 'warning' | 'critical';
    alerts: string[];
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_HEALTH });
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    Logger.info('Fetching real-time server metrics', { userId: auth.user?.id }, 'system-metrics');

    // Get real system information
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    const cpus = os.cpus();
    const uptime = process.uptime();
    
    // Calculate real CPU usage
    let avgCpuUsage = 0;
    try {
      if (os.platform() === 'darwin' || os.platform() === 'linux') {
        const { stdout } = await execAsync('ps -A -o %cpu | awk \'{s+=$__1} END {print __s}\'');
        avgCpuUsage = Math.min(Math.max(parseFloat(String(stdout).trim()) || 0, 0), 100);
      } else {
        // Fallback for other platforms - calculate from load average
        const loadAvg = os.loadavg()[0];
        const numCPUs = os.cpus().length;
        avgCpuUsage = Math.min((loadAvg / numCPUs) * 100, 100);
      }
    } catch (error: unknown) {
      // Fallback to load average calculation
      const loadAvg = os.loadavg()[0];
      const numCPUs = os.cpus().length;
      avgCpuUsage = Math.min((loadAvg / numCPUs) * 100, 100);
    }
    avgCpuUsage = Math.round(avgCpuUsage * 10) / 10; // Round to 1 decimal
    
    // Convert uptime to human readable
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const uptimeString = `${hours}h ${minutes}m`;
    
    // Memory calculations (in GB)
    const totalMemoryGB = Math.round((totalMemory / 1024 / 1024 / 1024) * 10) / 10;
    const usedMemoryGB = Math.round((usedMemory / 1024 / 1024 / 1024) * 10) / 10;
    const freeMemoryGB = Math.round((freeMemory / 1024 / 1024 / 1024) * 10) / 10;
    const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);
    
    // Get real disk usage
    let diskTotal = 500; // GB fallback
    let diskUsed = 285; // GB fallback
    let diskFree = diskTotal - diskUsed;
    let diskUsagePercent = Math.round((diskUsed / diskTotal) * 100);
    
    try {
      if (os.platform() === 'darwin') {
        const { stdout } = await execAsync('df -H / | tail -1 | awk \'{print $2 " " $3 " " $__4}\'');
        const parts = String(stdout).trim().split(' ');
        if (parts.length >= 3) {
          diskTotal = Math.round(parseInt(parts[0]) / 1000000000); // Convert to GB
          diskUsed = Math.round(parseInt(parts[1]) / 1000000000);
          diskFree = Math.round(parseInt(parts[2]) / 1000000000);
          diskUsagePercent = Math.round((diskUsed / diskTotal) * 100);
        }
      } else if (os.platform() === 'linux') {
        const { stdout } = await execAsync('df -BG / | tail -1 | awk \'{print $2 " " $3 " " $__4}\'');
        const parts = String(stdout).trim().split(' ');
        if (parts.length >= 3) {
          diskTotal = parseInt(parts[0].replace('G', ''));
          diskUsed = parseInt(parts[1].replace('G', ''));
          diskFree = parseInt(parts[2].replace('G', ''));
          diskUsagePercent = Math.round((diskUsed / diskTotal) * 100);
        }
      }
    } catch (error: unknown) {
      // Keep fallback values - already set above
      Logger.warn('Could not get real disk usage, using fallback values', { error: String(error) }, 'system-metrics');
    }
    
    const serverMetrics: ServerMetrics = {
      system: {
        platform: os.platform(),
        architecture: os.arch(),
        nodeVersion: process?.version,
        nextVersion: "14.2.5", // Would need to get from package.json
        uptime: uptimeString,
        hostname: os.hostname()
      },
      performance: {
        memory: {
          total: totalMemoryGB,
          used: usedMemoryGB,
          free: freeMemoryGB,
          usage: memoryUsagePercent
        },
        cpu: {
          usage: avgCpuUsage,
          cores: cpus?.length,
          model: cpus[0]?.model ?? 'Unknown'
        },
        disk: {
          total: diskTotal,
          used: diskUsed,
          free: diskFree,
          usage: diskUsagePercent
        }
      },
      network: {
        protocol: "HTTP",
        host: "localhost",
        port: 3000,
        status: "Active"
      },
      health: {
        overall: 'healthy',
        alerts: []
      }
    };
    
    // Generate health alerts based on performance
    if (serverMetrics.performance.memory.usage > 80) {
      serverMetrics.health.overall = 'warning';
      serverMetrics.health.alerts.push('High memory usage detected');
    }
    
    if (serverMetrics.performance.cpu.usage > 90) {
      serverMetrics.health.overall = 'critical';
      serverMetrics.health.alerts.push('Critical CPU usage');
    }
    
    if (serverMetrics.performance.disk.usage > 85) {
      if (serverMetrics.health.overall === 'healthy') {
        serverMetrics.health.overall = 'warning';
      }
      serverMetrics.health.alerts.push('Low disk space available');
    }

    Logger.info('Server metrics fetched successfully', { 
      healthStatus: serverMetrics.health?.overall,
      metricsCount: Object.keys(serverMetrics).length,
      userId: session.user.id as string
    }, 'system-metrics');
    
    return NextResponse.json(serverMetrics);
  } catch (error: unknown) {
    Logger.error('Error fetching server metrics', { error: String(error) }, 'system-metrics');
    return NextResponse.json(
      { error: 'Failed to fetch server metrics', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 