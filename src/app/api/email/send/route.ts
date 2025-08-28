import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type APIAuthResult } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { emailService } from '@/lib/email/service';
import { EmailTemplateData } from '@/lib/email/types';
import { z } from 'zod';

const sendEmailSchema = z.object({
  type: z.enum(['meeting_invite', 'team_notification', 'password_reset', 'verification', 'notification']),
  data: z.record(z.unknown()),
});

export async function POST(request: NextRequest) {
  try {
    const auth: APIAuthResult = await withAuth(request, {
      requireAuth: true,
      requireCapability: Capability.MEETING_CREATE // Basic capability for email sending
    });

    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const body = await request.json() as Record<string, unknown>;
    const { type, data } = sendEmailSchema.parse(body);

    // Validate and send email based on type
    await emailService.sendEmail(data as unknown as EmailTemplateData);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}