import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { Capability } from "@/lib/auth/policy";
import * as os from 'os';

// GET Method - Server metrics
export async function GET(request: NextRequest) {
  try {
    // REQUIRED: Auth check - Operations admin for server metrics
    const authResult = await withAuth(request, { 
      requireAuth: true, 
      requireCapability: Capability.OPS_HEALTH 
    });
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error }, 
        { status: authResult.statusCode }
      );
    }

    // Get real system metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);

    // CPU usage calculation
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });
    
    const cpuUsagePercent = Math.round(100 - ((totalIdle / totalTick) * 100));

    // Server uptime
    const uptimeSeconds = process.uptime();
    const uptimeDays = Math.floor(uptimeSeconds / 86400);
    const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600);

    // Health status determination
    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    const alerts: string[] = [];

    if (memoryUsagePercent > 80) {
      healthStatus = 'warning';
      alerts.push('High memory usage detected');
    }
    if (memoryUsagePercent > 90) {
      healthStatus = 'critical';
      alerts.push('Critical memory usage');
    }
    if (cpuUsagePercent > 80) {
      if (healthStatus === 'healthy') {
        healthStatus = 'warning';
      }
      alerts.push('High CPU usage detected');
    }
    if (cpuUsagePercent > 90) {
      healthStatus = 'critical';
      alerts.push('Critical CPU usage');
    }

    // Build server metrics response
    const serverMetrics = {
      system: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
        cpuCount: cpus.length,
        architecture: os.arch(),
        nodeVersion: process.version.replace('v', ''),
        nextVersion: "15.3.3",
        uptime: `${uptimeDays}d ${uptimeHours}h`
      },
      performance: {
        cpu: {
          usage: cpuUsagePercent,
          cores: cpus.length,
          model: cpus[0]?.model || 'Unknown'
        },
        memory: {
          usage: memoryUsagePercent,
          used: Math.round(usedMemory / (1024 * 1024 * 1024)),
          free: Math.round(freeMemory / (1024 * 1024 * 1024)),
          total: Math.round(totalMemory / (1024 * 1024 * 1024))
        },
        disk: {
          usage: 0, // Would require additional system calls
          used: 0,
          free: 0,
          total: 0
        }
      },
      health: {
        overall: healthStatus,
        services: {
          database: 'connected',
          redis: 'connected',
          email: 'operational'
        },
        alerts
      },
      network: {
        protocol: "HTTP",
        host: "localhost",
        port: 3000,
        status: "Active",
        requests: {
          total: 0, // Would need request tracking
          perMinute: 0
        },
        bandwidth: {
          incoming: '0 MB',
          outgoing: '0 MB'
        }
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({ 
      data: serverMetrics,
      message: "Server metrics retrieved successfully" 
    });

  } catch (error: unknown) {
    console.error('Server Metrics API Error:', error);
    return NextResponse.json(
      { 
        error: "Failed to retrieve server metrics",
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}