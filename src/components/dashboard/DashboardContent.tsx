'use client';

import { useLayout } from '@/lib/layout/layout-provider';
import { layoutClasses } from '@/lib/layout/layout-types';
import Link from "next/link";
import { Calendar, Users, FileText } from "lucide-react";
import { LucideIcon } from 'lucide-react';

// User types
interface User {
  id: number;
  name: string;
  email: string;
}

interface UserWithStaff extends User {
  staff?: {
    id: number;
    role: {
      title: string;
    };
    school?: {
      name: string;
      code: string | null;
    };
  } | null;
  Staff?: Array<{
    id: number;
    Role: {
      title: string;
    };
    School: {
      name: string;
      address?: string;
    };
  }>;
}

// Meeting type
interface Meeting {
  id: number;
  title: string;
  scheduled_date: string;
  start_time: string;
  location?: string;
}

// Quick stats type
interface QuickStat {
  name: string;
  value: number;
  icon: LucideIcon;
}

interface DashboardContentProps {
  user: User;
  userWithStaff: UserWithStaff;
  upcomingMeetings: Meeting[];
  quickStats: QuickStat[];
  safeFormatDateTime: (date: string | Date, format?: string, fallback?: string) => string;
}

export function DashboardContent({ 
  user, 
  userWithStaff, 
  upcomingMeetings, 
  quickStats, 
  safeFormatDateTime 
}: DashboardContentProps) {
  const { layout } = useLayout();
  const contentLayoutClass = layoutClasses.content[(layout.contentLayout)];
  
  // Default two-column layout for modern themes
  const renderContent = () => {
    return (
      <div className="max-w-full">
        {renderWelcomeHeader()}
        {renderQuickStats()}
        <div className={contentLayoutClass}>
          {renderMeetingsList()}
          {renderActivitySummary()}
        </div>
      </div>
    );
  };

  const renderWelcomeHeader = () => (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back, {user.name}</h1>
      {(userWithStaff?.staff?.school ?? userWithStaff?.Staff?.[0]?.School) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{(userWithStaff as any).staff?.school?.name ?? userWithStaff.Staff?.[0]?.School?.name}</span>
          {((userWithStaff as any).staff?.school?.code ?? userWithStaff.Staff?.[0]?.School?.address) && (
            <>
              <span>•</span>
              <span>{(userWithStaff as any).staff?.school?.code ?? userWithStaff.Staff?.[0]?.School?.address}</span>
            </>
          )}
        </div>
      )}
    </div>
  );

  const renderQuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {quickStats.map((stat) => (
        <div key={stat.name} className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <stat.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{stat.name}</h3>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMeetingsList = () => (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Today's Meetings</h2>
        <Link
          href="/dashboard/meetings"
          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          View all →
        </Link>
      </div>
      
      <div className="space-y-4">
        {upcomingMeetings.slice(0, 4).map((meeting) => (
          <div
            key={meeting.id}
            className="flex items-center justify-between p-4 bg-background/50 border border-border/50 rounded-xl hover:bg-card/60 transition-colors group"
          >
            <div className="flex-1">
              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                {meeting.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {safeFormatDateTime(meeting.start_time, undefined, 'No date set')}
              </p>
            </div>
            <div className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full">
              Scheduled
            </div>
          </div>
        ))}
        
        {upcomingMeetings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming meetings scheduled</p>
            <Link
              href="/dashboard/meetings"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 5h2v14h-2zM5 11h14v2H5z"/>
              </svg>
              Schedule Meeting
            </Link>
          </div>
        )}
      </div>
    </section>
  );

  const renderActivitySummary = () => (
    <section className="card p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Recent Activity</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-background/30 rounded-lg border border-border/30">
          <p className="font-medium text-foreground mb-1">Meeting Intelligence Update</p>
          <ul className="text-sm text-muted-foreground space-y-1 pl-4">
            <li>• New AI-powered meeting summaries available</li>
            <li>• Action items automatically extracted</li>
            <li>• Follow-up tasks created in dashboard</li>
          </ul>
          <div className="text-xs text-muted-foreground mt-3 text-right">Just now</div>
        </div>

        <div className="p-4 bg-background/30 rounded-lg border border-border/30">
          <p className="font-medium text-foreground mb-1">Team Collaboration</p>
          <ul className="text-sm text-muted-foreground space-y-1 pl-4">
            <li>• 3 new notes shared with your team</li>
            <li>• Meeting room booking confirmed</li>
            <li>• Presentation materials uploaded</li>
          </ul>
          <div className="text-xs text-muted-foreground mt-3 text-right">2 hours ago</div>
        </div>
      </div>

      {renderQuickActions()}
    </section>
  );

  const renderQuickActions = () => (
    <div className="mt-8 pt-6 border-t border-border/30">
      <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Quick Actions</h3>
      <div className="space-y-3">
        <Link 
          href="/dashboard/meetings" 
          className="flex items-center gap-3 p-3 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors group"
        >
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground group-hover:text-primary">Create Meeting</span>
        </Link>
        <a 
          href="/dashboard/notes" 
          className="flex items-center gap-3 p-3 bg-background/30 hover:bg-background/50 rounded-lg transition-colors group"
        >
          <FileText className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Add Notes</span>
        </a>
        <a 
          href="/dashboard/team" 
          className="flex items-center gap-3 p-3 bg-background/30 hover:bg-background/50 rounded-lg transition-colors group"
        >
          <Users className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">View Team</span>
        </a>
      </div>
    </div>
  );

  return <div>{renderContent()}</div>;
}