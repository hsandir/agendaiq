# Sentry Error Monitoring Integration

## Overview

AgendaIQ is integrated with Sentry for comprehensive error tracking, performance monitoring, and debugging capabilities.

## Setup Instructions

### 1. Create Sentry Account

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project for AgendaIQ
3. Select "Next.js" as the platform

### 2. Configure Environment Variables

Add the following to your `.env.local`:

```bash
# Public DSN (for client-side)
NEXT_PUBLIC_SENTRY_DSN=https://your-public-key@o123456.ingest.sentry.io/1234567

# Server DSN (optional, can be same as public)
SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/1234567

# For source map uploads (production builds)
SENTRY_ORG=your-organization
SENTRY_PROJECT=agendaiq
SENTRY_AUTH_TOKEN=your-auth-token

# Environment
NODE_ENV=development

# Git commit SHA (automatically set by Vercel)
NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA=
```

### 3. Generate Auth Token

1. Go to Settings → Auth Tokens in Sentry
2. Create a new token with these scopes:
   - `project:releases`
   - `org:read`
   - `project:write`

## Features

### Error Tracking

- **Client-side errors**: Caught by ErrorBoundary component
- **Server-side errors**: Handled by server error handler
- **API errors**: Wrapped with error handling utilities
- **Unhandled rejections**: Automatically captured

### User Context

User information is automatically attached to errors:
- User ID
- Email
- Staff ID
- Role

### Performance Monitoring

- Page load times
- API response times
- Database query performance
- Custom transactions

### Error Pages

Custom error pages with Sentry integration:
- `/error.tsx` - Application errors
- `/global-error.tsx` - Critical errors
- `/not-found.tsx` - 404 errors

## Testing

### Development Testing

Test Sentry integration using the test endpoint:

```bash
# Simple error
curl http://localhost:3000/api/test-sentry?type=simple

# API error with status code
curl http://localhost:3000/api/test-sentry?type=api

# Performance monitoring
curl http://localhost:3000/api/test-sentry?type=performance

# Error with breadcrumbs
curl http://localhost:3000/api/test-sentry?type=breadcrumb

# Error with user context
curl http://localhost:3000/api/test-sentry?type=user-context
```

### Verifying Integration

1. Check Sentry dashboard for captured errors
2. Verify user context is attached
3. Check performance metrics
4. Review breadcrumb trails

## Usage Examples

### Manual Error Capture

```typescript
import * as Sentry from '@sentry/nextjs';

// Capture exception
try {
  // Your code
} catch (error) {
  Sentry.captureException(error);
}

// Capture message
Sentry.captureMessage('Something happened', 'warning');
```

### Using Error Handler

```typescript
import { handleServerError } from '@/lib/sentry/server-error-handler';

export async function POST(request: NextRequest) {
  try {
    // Your API logic
  } catch (error) {
    return handleServerError(error, request, {
      message: 'Failed to process request',
      context: { endpoint: 'users' }
    });
  }
}
```

### Adding Breadcrumbs

```typescript
import { addBreadcrumb } from '@/lib/sentry/sentry-utils';

// Add breadcrumb
addBreadcrumb('User clicked button', 'ui.click', {
  button: 'submit',
  form: 'user-profile'
});
```

### Performance Monitoring

```typescript
import { Performance } from '@/lib/sentry/sentry-utils';

// Measure database query
const users = await Performance.measureQuery('findUsers', async () => {
  return await prisma.user.findMany();
});

// Measure API route
return await Performance.measureRoute('getUserProfile', async () => {
  // Route logic
  return NextResponse.json(data);
});
```

## Best Practices

### 1. Sensitive Data

Never log sensitive information:
- Passwords
- API keys
- Personal data
- Payment information

### 2. Error Context

Always provide context:
```typescript
Sentry.withScope((scope) => {
  scope.setContext('meeting', {
    id: meetingId,
    type: meetingType
  });
  Sentry.captureException(error);
});
```

### 3. Performance Sampling

Adjust sampling rates for production:
```typescript
// sentry.client.config.ts
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
```

### 4. Error Filtering

Filter out noise:
- Browser extension errors
- Network timeouts
- Known third-party errors

## Troubleshooting

### Errors Not Appearing

1. Check DSN is correct
2. Verify environment variables are loaded
3. Check browser console for Sentry errors
4. Ensure not blocked by ad blockers

### Performance Issues

1. Reduce `tracesSampleRate` in production
2. Disable session replay if not needed
3. Filter out unnecessary transactions

### Source Maps

1. Ensure `SENTRY_AUTH_TOKEN` is set
2. Check build logs for upload errors
3. Verify organization and project names

## Security

- DSNs are safe to expose publicly
- Never commit auth tokens
- Use environment-specific projects
- Enable security headers

## Monitoring Dashboard

Access your Sentry dashboard at:
- Development: `https://[org].sentry.io/projects/agendaiq-dev/`
- Production: `https://[org].sentry.io/projects/agendaiq/`

Key metrics to monitor:
- Error rate
- Performance scores
- User impact
- Release health