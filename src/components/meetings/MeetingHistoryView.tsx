"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSafeDate } from '@/lib/utils/safe-date';
import {
  Clock,
  User,
  FileText,
  Hash,
  Edit,
  Eye,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

interface Activity {
  id: string;
  type: 'audit' | 'agenda_update' | 'action_update';
  action: string;
  details: string;
  timestamp: string | Date;
  user: {
    name: string;
    email: string;
  };
  changes?: any;
  metadata?: any;
}

interface Props {
  meetingId: number;
}

export function MeetingHistoryView({ meetingId }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [meetingId]);

  const fetchHistory = async () => {
    console.log('🔍 Fetching meeting history for meetingId:', meetingId);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/meetings/${meetingId}/history`);
      console.log('📡 History API response:', response.status, response.ok);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 History data received:', data);
        setActivities(data.activities || []);
      } else {
        const errorData = await response.json();
        console.log('❌ History API error:', errorData);
        setError(errorData.error || 'Failed to load history');
      }
    } catch (err: unknown) {
      console.log('💥 History fetch error:', err);
      setError('Error loading meeting history');
      console.error('Error fetching meeting history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activity: Activity) => {
    switch (activity.type) {
      case 'audit':
        switch (activity.action) {
          case 'VIEW': return <Eye className="h-4 w-4 text-blue-500" />;
          case 'UPDATE': return <Edit className="h-4 w-4 text-yellow-500" />;
          case 'CREATE': return <Plus className="h-4 w-4 text-green-500" />;
          case 'DELETE': return <Trash2 className="h-4 w-4 text-red-500" />;
          default: return <Clock className="h-4 w-4 text-muted-foreground" />;
        }
      case 'agenda_update':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'action_update':
        return <Hash className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (activity: Activity) => {
    switch (activity.type) {
      case 'audit':
        switch (activity.action) {
          case 'VIEW': return 'bg-blue-50 border-blue-200';
          case 'UPDATE': return 'bg-yellow-50 border-yellow-200';
          case 'CREATE': return 'bg-green-50 border-green-200';
          case 'DELETE': return 'bg-red-50 border-red-200';
          default: return 'bg-muted border-border';
        }
      case 'agenda_update':
        return 'bg-orange-50 border-orange-200';
      case 'action_update':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-muted border-border';
    }
  };

  const formatRelativeTime = (timestamp: string | Date) => {
    const date = getSafeDate(timestamp);
    if (!date) return 'Unknown time';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return format(date, 'MMM d, h:mm a');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center text-center">
          <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
          <span className="text-destructive">{error}</span>
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No History Yet</h3>
          <p className="text-muted-foreground">
            Activity and updates for this meeting will appear here
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-1">Update History</h2>
        <p className="text-sm text-muted-foreground">
          {activities.length} recent activities and changes
        </p>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-3 pr-4">
          {activities.map((activity) => (
            <Card
              key={activity.id}
              className={`transition-all hover:shadow-sm ${getActivityColor(activity)}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getActivityIcon(activity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {activity.details}
                      </p>
                      <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {activity.user.name}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.action.replace(/_/g, ' ').toLowerCase()}
                      </Badge>
                    </div>

                    {/* Show metadata for specific activity types */}
                    {activity.metadata && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {activity.type === 'agenda_update' && (
                          <span>Status: {activity.metadata.status}</span>
                        )}
                        {activity.type === 'action_update' && (
                          <span>Status: {activity.metadata.status}</span>
                        )}
                      </div>
                    )}

                    {/* Show changes for audit logs if available */}
                    {activity.changes && typeof activity.changes === 'object' && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <span className="font-medium text-foreground">Changes:</span>
                        <div className="mt-1 space-y-1">
                          {Object.entries(activity.changes).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-muted-foreground">{key}:</span> {JSON.stringify(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}