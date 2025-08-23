'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  BookOpen,
  Settings,
  Plus,
  Calendar,
  Award,
  FileText,
  MessageSquare,
  Activity,
  UserPlus,
  Crown,
  Mail,
  Shield
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FEATURES } from '@/lib/features/feature-flags';

interface TeamMember {
  id: number;
  staff_id: number;
  role: 'LEAD' | 'MEMBER';
  joined_at: string;
  staff: {
    id: number;
    users: {
      id: number;
      name: string | null;
      email: string;
      image?: string | null;
    };
    role: {
      title: string;
    };
    department?: {
      name: string;
    };
  };
}

interface Team {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata?: any;
  team_members: TeamMember[];
  _count: {
    team_members: number;
    team_knowledge: number;
  };
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Check feature flag
  if (!FEATURES.TEAMS.enabled) {
    router.push('/dashboard');
    return null;
  }

  useEffect(() => {
    fetchTeam();
  }, [params.id]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/${params.id}/members`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch team');
      }

      const data = await response.json();
      // For now, we'll construct the team from members data
      // In a real app, we'd have a separate endpoint for team details
      if (data.members && data.members.length > 0) {
        setTeam({
          id: params.id as string,
          name: 'Team Name', // This would come from a proper endpoint
          description: 'Team Description',
          type: 'DEPARTMENT',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          team_members: data.members,
          _count: {
            team_members: data.total,
            team_knowledge: 0
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTeamTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPARTMENT':
        return <Users className="h-5 w-5" />;
      case 'PROJECT':
        return <Calendar className="h-5 w-5" />;
      case 'COMMITTEE':
        return <Award className="h-5 w-5" />;
      case 'SUBJECT':
      case 'GRADE_LEVEL':
        return <BookOpen className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getTeamTypeColor = (type: string) => {
    switch (type) {
      case 'DEPARTMENT':
        return 'bg-blue-100 text-blue-800';
      case 'PROJECT':
        return 'bg-green-100 text-green-800';
      case 'COMMITTEE':
        return 'bg-purple-100 text-purple-800';
      case 'SUBJECT':
        return 'bg-orange-100 text-orange-800';
      case 'GRADE_LEVEL':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Team not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const teamLeads = team.team_members.filter(m => m.role === 'LEAD');
  const teamMembers = team.team_members.filter(m => m.role === 'MEMBER');

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Team Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${getTeamTypeColor(team.type)}`}>
                {getTeamTypeIcon(team.type)}
              </div>
              <div>
                <CardTitle className="text-2xl">{team.name}</CardTitle>
                <CardDescription className="mt-1">
                  {team.description || 'No description provided'}
                </CardDescription>
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="outline">{team.type.replace('_', ' ')}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Created {formatDistanceToNow(new Date(team.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/dashboard/teams/${team.id}/settings`)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{team._count.team_members}</div>
                <p className="text-xs text-muted-foreground">
                  {teamLeads.length} lead{teamLeads.length !== 1 ? 's' : ''}, {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Knowledge Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{team._count.team_knowledge}</div>
                <p className="text-xs text-muted-foreground">Documents and resources</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Updates this week</p>
              </CardContent>
            </Card>
          </div>

          {/* Team Leads */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {teamLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={lead.staff.users.image || undefined} />
                      <AvatarFallback>
                        {lead.staff.users.name?.charAt(0) || lead.staff.users.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {lead.staff.users.name || lead.staff.users.email.split('@')[0]}
                      </p>
                      <p className="text-sm text-muted-foreground">{lead.staff.role.title}</p>
                    </div>
                    <Crown className="h-4 w-4 text-yellow-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.team_members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.staff.users.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {member.staff.users.name?.charAt(0) || member.staff.users.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {member.staff.users.name || member.staff.users.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                      </p>
                    </div>
                    {member.role === 'LEAD' && (
                      <Badge variant="secondary">Lead</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team Members ({team._count.team_members})</CardTitle>
                <Button size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.team_members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.staff.users.image || undefined} />
                        <AvatarFallback>
                          {member.staff.users.name?.charAt(0) || member.staff.users.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.staff.users.name || member.staff.users.email.split('@')[0]}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{member.staff.role.title}</span>
                          {member.staff.department && (
                            <>
                              <span>•</span>
                              <span>{member.staff.department.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role === 'LEAD' && (
                        <Badge variant="secondary">
                          <Crown className="mr-1 h-3 w-3" />
                          Lead
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Knowledge Base Coming Soon</h3>
              <p className="text-muted-foreground text-center mb-4">
                Share documents, resources, and best practices with your team
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Activity Feed Coming Soon</h3>
              <p className="text-muted-foreground text-center mb-4">
                Track team updates, discussions, and important events
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}