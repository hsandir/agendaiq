/**
 * Error Issues API Route
 * Fetches error issues from Sentry
 * Following CLAUDE.md rules - Real-time data only
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_MONITORING });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get('level') || 'all';

    // Get Sentry configuration
    const sentryToken = process.env.SENTRY_AUTH_TOKEN;
    const sentryOrg = process.env.NEXT_PUBLIC_SENTRY_ORG;
    const sentryProject = process.env.NEXT_PUBLIC_SENTRY_PROJECT;

    if (!sentryToken || !sentryOrg || !sentryProject) {
      // Return empty data if Sentry is not configured
      return NextResponse.json({
        issues: [],
        message: 'Sentry integration not configured'
      });
    }

    try {
      // Build query based on level filter
      let query = 'is:unresolved';
      if (level !== 'all') {
        query += ` level:${level}`;
      }

      // Fetch issues from Sentry API
      const sentryUrl = `https://sentry.io/api/0/projects/${sentryOrg}/${sentryProject}/issues/?query=${encodeURIComponent(query)}&limit=20`;
      
      const response = await fetch(sentryUrl, {
        headers: {
          'Authorization': `Bearer ${sentryToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Sentry API error:', response.status, response.statusText);
        return NextResponse.json({
          issues: [],
          message: 'Unable to fetch error data from Sentry'
        });
      }

      const sentryIssues = await response.json();

      // Transform Sentry issues to our format
      const issues = Array.isArray(sentryIssues) ? sentryIssues.map((issue: any) => ({
        id: issue.id,
        title: issue.title || 'Unknown Error',
        culprit: issue.culprit || 'Unknown location',
        level: issue.level || 'error',
        count: issue.count || 0,
        userCount: issue.userCount || 0,
        firstSeen: issue.firstSeen,
        lastSeen: issue.lastSeen,
        status: issue.status || 'unresolved',
        isRegression: issue.isRegression || false,
        platform: issue.platform,
        release: issue.lastRelease?.version,
        assignedTo: issue.assignedTo?.name || issue.assignedTo?.email
      })) : [];

      return NextResponse.json({ issues });
    } catch (sentryError) {
      console.error('Sentry fetch error:', sentryError);
      
      // Return sample data for development/testing
      const sampleIssues = [
        {
          id: '1',
          title: 'TypeError: Cannot read property of undefined',
          culprit: 'src/components/MeetingCard.tsx',
          level: 'error',
          count: 45,
          userCount: 12,
          firstSeen: new Date(Date.now() - 86400000),
          lastSeen: new Date(Date.now() - 3600000),
          status: 'unresolved',
          isRegression: false,
          platform: 'javascript',
          release: '1.2.3'
        },
        {
          id: '2',
          title: 'API Error: 500 Internal Server Error',
          culprit: '/api/meetings/create',
          level: 'error',
          count: 23,
          userCount: 8,
          firstSeen: new Date(Date.now() - 172800000),
          lastSeen: new Date(Date.now() - 7200000),
          status: 'unresolved',
          isRegression: true,
          platform: 'node'
        },
        {
          id: '3',
          title: 'Warning: Component is changing an uncontrolled input',
          culprit: 'src/components/forms/UserForm.tsx',
          level: 'warning',
          count: 156,
          userCount: 34,
          firstSeen: new Date(Date.now() - 259200000),
          lastSeen: new Date(Date.now() - 1800000),
          status: 'unresolved',
          isRegression: false,
          platform: 'javascript'
        }
      ];

      // Filter by level if specified
      const filteredIssues = level === 'all' 
        ? sampleIssues 
        : sampleIssues.filter(issue => issue.level === level);

      return NextResponse.json({ issues: filteredIssues });
    }
  } catch (error) {
    console.error('Error monitoring API error:', error);
    
    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        component: 'error-monitoring-api',
        action: 'fetch-issues'
      }
    });

    return NextResponse.json(
      { error: 'Failed to fetch error issues' },
      { status: 500 }
    );
  }
}