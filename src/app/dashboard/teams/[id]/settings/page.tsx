'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Settings,
  Users,
  Shield,
  Bell,
  Trash2,
  AlertTriangle,
  Save,
  RefreshCw,
  Info,
  Calendar,
  Activity,
  Database,
  Archive,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  MessageSquare,
  UserCheck,
  UserX,
  Clock,
  Building,
  GraduationCap,
  Briefcase,
  Award,
  BookOpen,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { FEATURES } from '@/lib/features/feature-flags';

interface Team {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata?: any;
  _count: {
    team_members: number;
    team_knowledge: number;
  };
}

export default function TeamSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    is_active: true,
    metadata: {
      purpose: '',
      goals: '',
      rules: '',
      slack_channel: '',
      email_alias: '',
      meeting_schedule: '',
      visibility: 'private',
      auto_add_new_staff: false,
      require_approval: true,
      notification_preferences: {
        new_member: true,
        new_resource: true,
        member_left: true,
        resource_updated: false,
        weekly_digest: true
      },
      permissions: {
        members_can_add: false,
        members_can_remove: false,
        members_can_edit_resources: true,
        members_can_delete_resources: false
      }
    }
  });

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
      const response = await fetch(`/api/teams/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch team');
      }

      const data = await response.json();
      setTeam(data.team);
      
      // Initialize form with team data
      setFormData({
        name: data.team.name,
        description: data.team.description || '',
        type: data.team.type,
        is_active: data.team.is_active,
        metadata: {
          purpose: data.team.metadata?.purpose || '',
          goals: data.team.metadata?.goals || '',
          rules: data.team.metadata?.rules || '',
          slack_channel: data.team.metadata?.slack_channel || '',
          email_alias: data.team.metadata?.email_alias || '',
          meeting_schedule: data.team.metadata?.meeting_schedule || '',
          visibility: data.team.metadata?.visibility || 'private',
          auto_add_new_staff: data.team.metadata?.auto_add_new_staff || false,
          require_approval: data.team.metadata?.require_approval !== false,
          notification_preferences: {
            new_member: data.team.metadata?.notification_preferences?.new_member !== false,
            new_resource: data.team.metadata?.notification_preferences?.new_resource !== false,
            member_left: data.team.metadata?.notification_preferences?.member_left !== false,
            resource_updated: data.team.metadata?.notification_preferences?.resource_updated || false,
            weekly_digest: data.team.metadata?.notification_preferences?.weekly_digest !== false
          },
          permissions: {
            members_can_add: data.team.metadata?.permissions?.members_can_add || false,
            members_can_remove: data.team.metadata?.permissions?.members_can_remove || false,
            members_can_edit_resources: data.team.metadata?.permissions?.members_can_edit_resources !== false,
            members_can_delete_resources: data.team.metadata?.permissions?.members_can_delete_resources || false
          }
        }
      });
    } catch (err) {
    if (err instanceof Error) {
      if (err instanceof Error) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/teams/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          is_active: formData.is_active,
          metadata: {
            ...team?.metadata,
            ...formData.metadata
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to update team');

      toast.success('Team settings updated successfully');
      fetchTeam();
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (deleteConfirmation !== team?.name) {
      toast.error('Team name does not match');
      return;
    }

    try {
      const response = await fetch(`/api/teams/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete team');

      toast.success('Team deleted successfully');
      router.push('/dashboard/teams');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  const handleExportJSON = async () => {
    try {
      const response = await fetch(`/api/teams/${params.id}/export?format=json`);
      if (!response.ok) throw new Error('Export failed');
      
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${team?.name || 'team'}-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Team data exported as JSON');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export team data');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/teams/${params.id}/export?format=csv`);
      if (!response.ok) throw new Error('Export failed');
      
      const csvData = await response.text();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${team?.name || 'team'}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Team data exported as CSV');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export team data');
    }
  };

  const handleArchiveTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          is_active: false,
          metadata: {
            ...formData.metadata,
            archived_at: new Date().toISOString(),
            archived_by: 'current_user' // This should be actual user ID
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to archive team');

      toast.success('Team archived successfully');
      router.push('/dashboard/teams');
    } catch (error) {
      console.error('Error archiving team:', error);
      toast.error('Failed to archive team');
    }
  };

  const getTeamTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPARTMENT':
        return <Building className="h-5 w-5" />;
      case 'PROJECT':
        return <Briefcase className="h-5 w-5" />;
      case 'COMMITTEE':
        return <Award className="h-5 w-5" />;
      case 'SUBJECT':
        return <BookOpen className="h-5 w-5" />;
      case 'GRADE_LEVEL':
        return <GraduationCap className="h-5 w-5" />;
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
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Team not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/teams/${team.id}`}>
            <Button
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Team
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${getTeamTypeColor(team.type)}`}>
              {getTeamTypeIcon(team.type)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{team.name} Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage team configuration and preferences
              </p>
            </div>
          </div>
        </div>
        <Badge variant={team.is_active ? 'default' : 'secondary'}>
          {team.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Basic team details and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter team name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Team Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({...formData, type: value})}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEPARTMENT">Department</SelectItem>
                      <SelectItem value="PROJECT">Project Team</SelectItem>
                      <SelectItem value="COMMITTEE">Committee</SelectItem>
                      <SelectItem value="SUBJECT">Subject Team</SelectItem>
                      <SelectItem value="GRADE_LEVEL">Grade Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the team's purpose and goals"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Team Purpose</Label>
                <Textarea
                  id="purpose"
                  value={formData.metadata.purpose}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: {...formData.metadata, purpose: e.target.value}
                  })}
                  placeholder="What is the main purpose of this team?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Team Goals</Label>
                <Textarea
                  id="goals"
                  value={formData.metadata.goals}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: {...formData.metadata, goals: e.target.value}
                  })}
                  placeholder="List the team's primary goals and objectives"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Team Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive teams are hidden from most views
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Team Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Control who can see this team
                  </p>
                </div>
                <Select
                  value={formData.metadata.visibility}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    metadata: {...formData.metadata, visibility: value}
                  })}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Unlock className="h-4 w-4" />
                        Public
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Private
                      </div>
                    </SelectItem>
                    <SelectItem value="hidden">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" />
                        Hidden
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Team Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Team Statistics</CardTitle>
              <CardDescription>
                Overview of team activity and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Members</span>
                  </div>
                  <p className="text-2xl font-bold">{team._count.team_members}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm">Resources</span>
                  </div>
                  <p className="text-2xl font-bold">{team._count.team_knowledge}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Created</span>
                  </div>
                  <p className="text-sm font-medium">
                    {format(new Date(team.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">Last Updated</span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatDistanceToNow(new Date(team.updated_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Member Permissions</CardTitle>
              <CardDescription>
                Control what team members can do
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Members Can Add New Members
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow regular members to invite others to the team
                  </p>
                </div>
                <Switch
                  checked={formData.metadata.permissions.members_can_add}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      permissions: {...formData.metadata.permissions, members_can_add: checked}
                    }
                  })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <UserX className="h-4 w-4" />
                    Members Can Remove Others
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow regular members to remove others from the team
                  </p>
                </div>
                <Switch
                  checked={formData.metadata.permissions.members_can_remove}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      permissions: {...formData.metadata.permissions, members_can_remove: checked}
                    }
                  })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Members Can Edit Resources
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow members to edit knowledge base resources
                  </p>
                </div>
                <Switch
                  checked={formData.metadata.permissions.members_can_edit_resources}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      permissions: {...formData.metadata.permissions, members_can_edit_resources: checked}
                    }
                  })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Members Can Delete Resources
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow members to delete knowledge base resources
                  </p>
                </div>
                <Switch
                  checked={formData.metadata.permissions.members_can_delete_resources}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      permissions: {...formData.metadata.permissions, members_can_delete_resources: checked}
                    }
                  })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Require Approval for New Members
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Team leads must approve all new member requests
                  </p>
                </div>
                <Switch
                  checked={formData.metadata.require_approval}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    metadata: {...formData.metadata, require_approval: checked}
                  })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Auto-Add New Staff
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically add new staff members based on department
                  </p>
                </div>
                <Switch
                  checked={formData.metadata.auto_add_new_staff}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    metadata: {...formData.metadata, auto_add_new_staff: checked}
                  })}
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Permissions
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose which events trigger notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    New Member Joined
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when someone joins the team
                  </p>
                </div>
                <Switch
                  checked={formData.metadata.notification_preferences.new_member}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      notification_preferences: {
                        ...formData.metadata.notification_preferences,
                        new_member: checked
                      }
                    }
                  })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    New Resource Added
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when new knowledge resources are added
                  </p>
                </div>
                <Switch
                  checked={formData.metadata.notification_preferences.new_resource}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      notification_preferences: {
                        ...formData.metadata.notification_preferences,
                        new_resource: checked
                      }
                    }
                  })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <UserX className="h-4 w-4" />
                    Member Left Team
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when someone leaves the team
                  </p>
                </div>
                <Switch
                  checked={formData.metadata.notification_preferences.member_left}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      notification_preferences: {
                        ...formData.metadata.notification_preferences,
                        member_left: checked
                      }
                    }
                  })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Resource Updated
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when knowledge resources are updated
                  </p>
                </div>
                <Switch
                  checked={formData.metadata.notification_preferences.resource_updated}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      notification_preferences: {
                        ...formData.metadata.notification_preferences,
                        resource_updated: checked
                      }
                    }
                  })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Weekly Team Digest
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send a weekly summary of team activity
                  </p>
                </div>
                <Switch
                  checked={formData.metadata.notification_preferences.weekly_digest}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      notification_preferences: {
                        ...formData.metadata.notification_preferences,
                        weekly_digest: checked
                      }
                    }
                  })}
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Notifications
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Channels</CardTitle>
              <CardDescription>
                Connect your team with external communication tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slack" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Slack Channel
                </Label>
                <Input
                  id="slack"
                  value={formData.metadata.slack_channel}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: {...formData.metadata, slack_channel: e.target.value}
                  })}
                  placeholder="#team-channel"
                />
                <p className="text-sm text-muted-foreground">
                  Connect to a Slack channel for real-time updates
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Alias
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.metadata.email_alias}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: {...formData.metadata, email_alias: e.target.value}
                  })}
                  placeholder="team@school.edu"
                />
                <p className="text-sm text-muted-foreground">
                  Team email address for external communication
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Meeting Schedule
                </Label>
                <Input
                  id="schedule"
                  value={formData.metadata.meeting_schedule}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: {...formData.metadata, meeting_schedule: e.target.value}
                  })}
                  placeholder="Every Tuesday at 3pm"
                />
                <p className="text-sm text-muted-foreground">
                  Regular meeting schedule for the team
                </p>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Integrations
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>
                Export team data for backup or migration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Export includes team settings, member list, and knowledge resources metadata (files not included)
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleExportJSON}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as JSON
                </Button>
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-600">Archive Team</CardTitle>
              <CardDescription>
                Temporarily disable this team while preserving all data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Archiving will hide the team from active views but preserve all data. You can restore it later.
                </AlertDescription>
              </Alert>
              <Button 
                variant="outline" 
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
                onClick={handleArchiveTeam}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive Team
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Delete Team</CardTitle>
              <CardDescription>
                Permanently delete this team and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This action cannot be undone. All team data including members, resources, and settings will be permanently deleted.
                </AlertDescription>
              </Alert>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team Permanently
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please type the team name to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You are about to delete <strong>{team.name}</strong> with {team._count.team_members} members and {team._count.team_knowledge} resources.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="confirmDelete">
                Type <strong>{team.name}</strong> to confirm
              </Label>
              <Input
                id="confirmDelete"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Enter team name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
              disabled={deleteConfirmation !== team.name}
            >
              Delete Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
}