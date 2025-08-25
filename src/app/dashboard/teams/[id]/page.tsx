'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddMemberDialog } from '@/components/teams/AddMemberDialog';
import { CreateKnowledgeDialog } from '@/components/teams/CreateKnowledgeDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Shield,
  MoreVertical,
  UserMinus,
  ShieldCheck,
  Download,
  ExternalLink,
  Edit2,
  Trash2,
  Search,
  Filter,
  FolderOpen,
  Globe,
  FileCode,
  FileSpreadsheet,
  Presentation,
  Image,
  Video,
  Hash,
  Clock,
  Eye,
  Copy,
  Share2,
  Lock,
  Unlock
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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

interface TeamKnowledge {
  id: number;
  title: string;
  description?: string | null;
  type: string;
  category?: string | null;
  url?: string | null;
  content?: string | null;
  tags?: string[] | null;
  is_public: boolean;
  views_count: number;
  downloads_count: number;
  created_at: string;
  updated_at: string;
  users?: {
    name: string | null;
    email: string;
    image?: string | null;
  };
  metadata?: any;
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
  team_knowledge?: TeamKnowledge[];
  _count: {
    team_members: number;
    team_knowledge: number;
  };
}

interface TeamActivity {
  id: string;
  type: 'member_joined' | 'knowledge_added' | 'team_created';
  timestamp: string;
  user: {
    id?: number;
    name?: string | null;
    email?: string;
    image?: string | null;
  } | null;
  data: any;
}

export default function TeamDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showCreateKnowledgeDialog, setShowCreateKnowledgeDialog] = useState(false);
  const [knowledgeSearchQuery, setKnowledgeSearchQuery] = useState('');
  const [knowledgeTypeFilter, setKnowledgeTypeFilter] = useState<string>('all');
  const [knowledgeCategoryFilter, setKnowledgeCategoryFilter] = useState<string>('all');
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Check feature flag
  if (!FEATURES.TEAMS.enabled) {
    router.push('/dashboard');
    return null;
  }

  useEffect(() => {
    fetchTeam();
  }, [params.id]);

  useEffect(() => {
    if (activeTab === 'activity' && team) {
      fetchActivities();
    }
  }, [activeTab, team]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch team');
      }

      const data = await response.json();
      setTeam(data.team);
      
      // Fetch knowledge resources
      const knowledgeResponse = await fetch(`/api/teams/${params.id}/knowledge`);
      if (knowledgeResponse.ok) {
        const knowledgeData = await knowledgeResponse.json();
        setTeam(prev => prev ? { ...prev, team_knowledge: knowledgeData.knowledge } : null);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await fetch(`/api/teams/${params.id}/activity`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      setActivities(data.activities);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleChangeRole = async (memberId: number, newRole: 'LEAD' | 'MEMBER') => {
    try {
      const response = await fetch(`/api/teams/${params.id}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          role: newRole,
        }),
      });

      if (!response.ok) throw new Error('Failed to update member role');

      toast({
        title: "Success",
        description: `Member role updated to ${newRole === 'LEAD' ? 'Team Lead' : 'Member'}`
      });
      fetchTeam();
      if (activeTab === 'activity') {
        fetchActivities();
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: 'Failed to update member role',
        variant: "destructive"
      });
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) return;

    try {
      const response = await fetch(`/api/teams/${params.id}/members?member_id=${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove member');

      toast({
        title: "Success",
        description: 'Member removed from team'
      });
      fetchTeam();
      if (activeTab === 'activity') {
        fetchActivities();
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: 'Failed to remove member',
        variant: "destructive"
      });
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT': return <FileText className="h-4 w-4" />;
      case 'LINK': return <Globe className="h-4 w-4" />;
      case 'NOTE': return <BookOpen className="h-4 w-4" />;
      case 'PRESENTATION': return <Presentation className="h-4 w-4" />;
      case 'SPREADSHEET': return <FileSpreadsheet className="h-4 w-4" />;
      case 'CODE': return <FileCode className="h-4 w-4" />;
      case 'IMAGE': return <Image className="h-4 w-4" />;
      case 'VIDEO': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'DOCUMENT': return 'blue';
      case 'LINK': return 'green';
      case 'NOTE': return 'purple';
      case 'PRESENTATION': return 'orange';
      case 'SPREADSHEET': return 'emerald';
      case 'CODE': return 'pink';
      case 'IMAGE': return 'yellow';
      case 'VIDEO': return 'red';
      default: return 'gray';
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
  
  // Filter knowledge resources
  const filteredKnowledge = team.team_knowledge?.filter(item => {
    const matchesSearch = !knowledgeSearchQuery || 
      item.title.toLowerCase().includes(knowledgeSearchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(knowledgeSearchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(knowledgeSearchQuery.toLowerCase()));
    
    const matchesType = knowledgeTypeFilter === 'all' || item.type === knowledgeTypeFilter;
    const matchesCategory = knowledgeCategoryFilter === 'all' || item.category === knowledgeCategoryFilter;
    
    return matchesSearch && matchesType && matchesCategory;
  }) || [];
  
  const uniqueCategories = [...new Set(team.team_knowledge?.map(k => k.category).filter(Boolean) || [])];
  const knowledgeTypes = [...new Set(team.team_knowledge?.map(k => k.type) || [])];

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
              <Button onClick={() => setShowAddMemberDialog(true)}>
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
                <Button size="sm" onClick={() => setShowAddMemberDialog(true)}>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.location.href = `mailto:${member.staff.users.email}`}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {member.role === 'MEMBER' ? (
                            <DropdownMenuItem onClick={() => handleChangeRole(member.staff_id, 'LEAD')}>
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Make Team Lead
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleChangeRole(member.staff_id, 'MEMBER')}>
                              <Users className="mr-2 h-4 w-4" />
                              Make Member
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleRemoveMember(member.staff_id)}
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          {/* Knowledge Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Knowledge Base</CardTitle>
                  <CardDescription>
                    {team._count.team_knowledge} resources shared with the team
                  </CardDescription>
                </div>
                <Button onClick={() => setShowCreateKnowledgeDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Resource
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resources..."
                    value={knowledgeSearchQuery}
                    onChange={(e) => setKnowledgeSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={knowledgeTypeFilter} onValueChange={setKnowledgeTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {knowledgeTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {getResourceIcon(type)}
                          {type}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={knowledgeCategoryFilter} onValueChange={setKnowledgeCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map(category => (
                      <SelectItem key={category} value={category || ''}>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          {category}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Knowledge Grid */}
              {filteredKnowledge.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredKnowledge.map((item) => {
                    const ResourceIcon = getResourceIcon(item.type);
                    const resourceColor = getResourceColor(item.type);
                    
                    return (
                      <Card key={item.id} className="group hover:shadow-lg transition-all">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className={`p-2 rounded-lg bg-${resourceColor}-100 text-${resourceColor}-600`}>
                              {ResourceIcon}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {item.url && (
                                  <>
                                    <DropdownMenuItem onClick={() => window.open(item.url, '_blank')}>
                                      {item.type === 'LINK' ? (
                                        <>
                                          <ExternalLink className="mr-2 h-4 w-4" />
                                          Open Link
                                        </>
                                      ) : (
                                        <>
                                          <Download className="mr-2 h-4 w-4" />
                                          Download
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Copy className="mr-2 h-4 w-4" />
                                      Copy Link
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="mt-3">
                            <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {/* Tags */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {item.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  <Hash className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {item.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{item.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {/* Metadata */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {item.views_count}
                              </span>
                              {item.downloads_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <Download className="h-3 w-3" />
                                  {item.downloads_count}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {item.is_public ? (
                                <Unlock className="h-3 w-3" />
                              ) : (
                                <Lock className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                          
                          {/* Footer */}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={item.users?.image || undefined} />
                              <AvatarFallback className="text-xs">
                                {item.users?.name?.charAt(0) || item.users?.email?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {item.users?.name || item.users?.email?.split('@')[0]}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-2 w-2" />
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            {item.category && (
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  {knowledgeSearchQuery || knowledgeTypeFilter !== 'all' || knowledgeCategoryFilter !== 'all' ? (
                    <>
                      <Search className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                      <p className="text-muted-foreground mb-4">
                        Try adjusting your search or filters
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setKnowledgeSearchQuery('');
                          setKnowledgeTypeFilter('all');
                          setKnowledgeCategoryFilter('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Resources Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start building your team's knowledge base
                      </p>
                      <Button onClick={() => setShowCreateKnowledgeDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Resource
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Team Activity
              </CardTitle>
              <CardDescription>
                Recent updates, member joins, and knowledge sharing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-6">
                  {activities.map((activity, index) => {
                    const getActivityIcon = () => {
                      switch (activity.type) {
                        case 'member_joined': return <UserPlus className="h-4 w-4 text-green-600" />;
                        case 'knowledge_added': return <BookOpen className="h-4 w-4 text-blue-600" />;
                        case 'team_created': return <Users className="h-4 w-4 text-purple-600" />;
                        default: return <Activity className="h-4 w-4 text-gray-600" />;
                      }
                    };

                    const getActivityText = () => {
                      switch (activity.type) {
                        case 'member_joined':
                          return (
                            <>
                              <strong>{activity.user?.name || activity.user?.email?.split('@')[0]}</strong> joined the team
                              {activity.data.role === 'LEAD' && <Badge variant="secondary" className="ml-2">Team Lead</Badge>}
                            </>
                          );
                        case 'knowledge_added':
                          return (
                            <>
                              <strong>{activity.user?.name || activity.user?.email?.split('@')[0]}</strong> added a new {activity.data.type.toLowerCase()} 
                              <strong className="ml-1">"{activity.data.title}"</strong>
                            </>
                          );
                        case 'team_created':
                          return (
                            <>
                              Team <strong>"{activity.data.team_name}"</strong> was created
                            </>
                          );
                        default:
                          return 'Unknown activity';
                      }
                    };

                    return (
                      <div key={activity.id} className="relative">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1 relative">
                            <div className="flex items-center justify-center w-8 h-8 bg-background border-2 rounded-full z-10">
                              {getActivityIcon()}
                            </div>
                            {index < activities.length - 1 && (
                              <div className="absolute top-8 left-4 h-8 w-px bg-border -translate-x-1/2" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pb-6">
                            <div className="flex items-start gap-3">
                              {activity.user && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={activity.user.image || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {activity.user.name?.charAt(0) || activity.user.email?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex-1">
                                <p className="text-sm">
                                  {getActivityText()}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                  </span>
                                  {activity.data.staff_role && (
                                    <Badge variant="outline" className="text-xs">
                                      {activity.data.staff_role}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
                  <p className="text-muted-foreground">
                    Team activity will appear here as members join and contribute
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Member Dialog */}
      {team && (
        <>
          <AddMemberDialog
            open={showAddMemberDialog}
            onOpenChange={setShowAddMemberDialog}
            teamId={team.id}
            currentMembers={team.team_members.map(m => m.staff_id)}
            onMembersAdded={() => {
              fetchTeam();
              if (activeTab === 'activity') {
                fetchActivities();
              }
            }}
          />
          <CreateKnowledgeDialog
            open={showCreateKnowledgeDialog}
            onOpenChange={setShowCreateKnowledgeDialog}
            teamId={team.id}
            onKnowledgeCreated={() => {
              fetchTeam();
              if (activeTab === 'activity') {
                fetchActivities();
              }
            }}
          />
        </>
      )}
    </div>
  );
}