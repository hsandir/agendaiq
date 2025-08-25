import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type APIAuthResult } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { emailService } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const auth: APIAuthResult = await withAuth(request, {
      requireAuth: true,
      requireCapability: Capability.SYSTEM_ADMIN // Only admins can test email
    });

    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const { _user } = auth;
    const body = await request.json() as { email?: string };
    const testEmail = body.email || auth.user.email;

    // Test SMTP connection first
    const connectionOk = await emailService.verifyConnection();
    if (!connectionOk) {
      return NextResponse.json(
        { error: 'SMTP connection failed' },
        { status: 500 }
      );
    }

    // Send test email
    await emailService.sendNotification({
      to: testEmail,
      subject: '✅ AgendaIQ Email System Test',
      title: 'Email System Test',
      message: `This is a test email from AgendaIQ to verify that the email system is working correctly. If you received this email, the email configuration is successful!`,
      priority: 'normal',
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      actionText: 'Go to Dashboard'
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      connection: 'verified'
    });

  } catch (error) {
    if (error instanceof Error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { 
        error: 'Email test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        connection: 'failed'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth: APIAuthResult = await withAuth(request, {
      requireAuth: true,
      requireCapability: Capability.SYSTEM_ADMIN
    });

    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    // Just verify connection without sending email
    const connectionOk = await emailService.verifyConnection();
    
    return NextResponse.json({
      connection: connectionOk ? 'verified' : 'failed',
      config: {
        host: process.env.SMTP_HOST || 'Not configured',
        port: process.env.SMTP_PORT || 'Not configured',
        from: process.env.SMTP_FROM || 'Not configured',
        hasAuthKey: !!process.env.SMTP_AUTH_KEY
      }
    });

  } catch (error) {
    console.error('Email config check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check email configuration',
        connection: 'failed'
      },
      { status: 500 }
    );
  }
}