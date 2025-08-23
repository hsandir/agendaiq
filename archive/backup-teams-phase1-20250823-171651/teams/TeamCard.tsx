'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MoreVertical, 
  Users, 
  Settings, 
  BookOpen,
  Calendar,
  Award,
  Trash2,
  Edit,
  UserPlus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface TeamMember {
  id: number;
  staff_id: number;
  role: 'LEAD' | 'MEMBER';
  joined_at: string;
  staff: {
    users: {
      id: number;
      name: string | null;
      email: string;
      image?: string | null;
    };
    role: {
      title: string;
    };
  };
}

interface Team {
  id: number;
  name: string;
  description?: string | null;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  team_members: TeamMember[];
  _count: {
    team_members: number;
    team_knowledge: number;
  };
}

interface TeamCardProps {
  team: Team;
  onUpdate?: () => void;
}

export function TeamCard({ team, onUpdate }: TeamCardProps) {
  const router = useRouter();

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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/teams/${team.id}/settings`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this team?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teams?id=${team.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete team');
      }

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const handleAddMember = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/teams/${team.id}/members`);
  };

  const teamLeads = team.team_members.filter(m => m.role === 'LEAD');

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push(`/dashboard/teams/${team.id}`)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${getTeamTypeColor(team.type)}`}>
              {getTeamTypeIcon(team.type)}
            </div>
            <div>
              <CardTitle className="text-lg">{team.name}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {team.type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Team Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddMember}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {team.description && (
          <CardDescription className="mt-2">
            {team.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Team Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {team._count.team_members} members
              </span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {team._count.team_knowledge} resources
              </span>
            </div>
          </div>

          {/* Team Leads */}
          {teamLeads.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Team Leads</p>
              <div className="flex items-center gap-2">
                {teamLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={lead.staff.users.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {lead.staff.users.name?.charAt(0) || lead.staff.users.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">
                      {lead.staff.users.name || lead.staff.users.email.split('@')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Members Preview */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Members</p>
            <div className="flex -space-x-2">
              {team.team_members.slice(0, 5).map((member) => (
                <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={member.staff.users.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {member.staff.users.name?.charAt(0) || member.staff.users.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {team._count.team_members > 5 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted">
                  <span className="text-xs">+{team._count.team_members - 5}</span>
                </div>
              )}
            </div>
          </div>

          {/* Created Date */}
          <div className="text-xs text-muted-foreground">
            Created {formatDistanceToNow(new Date(team.created_at), { addSuffix: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}