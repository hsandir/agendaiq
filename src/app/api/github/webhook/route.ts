import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

function verifySignature(payload: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');
    const delivery = request.headers.get('x-github-delivery');
    
    const body = await request.text();
    
    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    const payload = JSON.parse(body);
    
    // Handle different webhook events
    switch (event) {
      case 'workflow_run':
        console.log('Workflow run event:', {
          action: payload.action,
          workflow: payload.workflow_run.name,
          status: payload.workflow_run.status,
          conclusion: payload.workflow_run.conclusion,
          run_id: payload.workflow_run.id,
        });
        
        // TODO: Store in database or send notifications
        break;
        
      case 'workflow_job':
        console.log('Workflow job event:', {
          action: payload.action,
          job: payload.workflow_job.name,
          status: payload.workflow_job.status,
          conclusion: payload.workflow_job.conclusion,
        });
        break;
        
      case 'push':
        console.log('Push event:', {
          ref: payload.ref,
          commits: payload.commits.length,
          pusher: payload.pusher.name,
        });
        break;
        
      default:
        console.log(`Unhandled event type: ${event}`);
    }
    
    return NextResponse.json({ 
      success: true,
      event,
      delivery
    });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}