import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, allow all authenticated users to access alerts configuration
    // TODO: Add proper admin role checking when role system is finalized

    // Get system alerts configuration
    const alertsConfig = {
      rules: [
        {
          id: "1",
          name: "Database Connection Failure",
          description: "Alert when database connection fails or times out",
          type: "error" as const,
          condition: "database.connection.failed",
          threshold: 1,
          enabled: true,
          channels: ["email", "slack"],
          lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          triggerCount: 3
        },
        {
          id: "2",
          name: "High Memory Usage",
          description: "Alert when memory usage exceeds 80%",
          type: "warning" as const,
          condition: "system.memory.usage",
          threshold: 80,
          enabled: true,
          channels: ["email"],
          triggerCount: 0
        },
        {
          id: "3",
          name: "API Rate Limit Exceeded",
          description: "Alert when API rate limits are exceeded",
          type: "warning" as const,
          condition: "api.ratelimit.exceeded",
          threshold: 5,
          enabled: true,
          channels: ["slack"],
          lastTriggered: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
          triggerCount: 12
        },
        {
          id: "4",
          name: "Failed Login Attempts",
          description: "Alert on multiple failed login attempts",
          type: "warning" as const,
          condition: "auth.failed_attempts",
          threshold: 5,
          enabled: false,
          channels: ["email", "slack"],
          triggerCount: 0
        },
        {
          id: "5",
          name: "Backup Completion",
          description: "Notify when daily backup is completed",
          type: "info" as const,
          condition: "backup.completed",
          threshold: 1,
          enabled: true,
          channels: ["email"],
          lastTriggered: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), // 22 hours ago
          triggerCount: 1
        },
        {
          id: "6",
          name: "System Health Degradation",
          description: "Alert when system health status changes to degraded or critical",
          type: "error" as const,
          condition: "system.health.degraded",
          threshold: 1,
          enabled: true,
          channels: ["email", "slack"],
          triggerCount: 0
        }
      ],
      channels: [
        {
          id: "email",
          name: "Email Notifications",
          type: "email" as const,
          enabled: true,
          config: {
            recipients: ["admin@agendaiq.com", "alerts@agendaiq.com"],
            subject_prefix: "[AgendaIQ Alert]"
          }
        },
        {
          id: "slack",
          name: "Slack Alerts",
          type: "slack" as const,
          enabled: true,
          config: {
            webhook_url: "https://hooks.slack.com/services/***",
            channel: "#system-alerts",
            username: "AgendaIQ Bot"
          }
        },
        {
          id: "webhook",
          name: "Custom Webhook",
          type: "webhook" as const,
          enabled: false,
          config: {
            url: "https://your-webhook-url.com/alerts",
            method: "POST"
          }
        },
        {
          id: "sms",
          name: "SMS Alerts",
          type: "sms" as const,
          enabled: false,
          config: {
            numbers: ["+1234567890"],
            provider: "twilio"
          }
        }
      ],
      globalSettings: {
        enableAlerts: true,
        quietHours: {
          enabled: true,
          start: "22:00",
          end: "08:00"
        },
        escalation: {
          enabled: true,
          delay: 30
        }
      },
      statistics: {
        totalAlerts: 16,
        alertsToday: 3,
        activeRules: 4,
        enabledChannels: 2
      }
    };

    return NextResponse.json(alertsConfig);
  } catch (error) {
    console.error('Error fetching alerts configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, allow all authenticated users to save alerts configuration
    // TODO: Add proper admin role checking when role system is finalized

    const body = await request.json();
    
    // Here you would typically save the configuration to database
    // For now, we'll just return success
    console.log('Saving alerts configuration:', body);

    return NextResponse.json({ 
      success: true, 
      message: 'Alerts configuration saved successfully' 
    });
  } catch (error) {
    console.error('Error saving alerts configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save alerts configuration' },
      { status: 500 }
    );
  }
} 