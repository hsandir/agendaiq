'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Users, User, UserCheck, Crown, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface Staff {
  id: string;
  users: {
    id: number;
    name: string | null;
    email: string;
    image?: string | null;
  };
  role_id: number;
  department?: {
    id: number;
    name: string;
  } | null;
}

interface Role {
  id: string;
  title: string;
  level: number;
  is_leadership: boolean;
  category: string;
  priority: number;
  department?: {
    id: string;
    name: string;
  };
  children?: Role[];
  staff?: Staff[];
}

interface RoleHierarchyVisualizationProps {
  onRoleSelect?: (role: Role) => void;
}

export default function RoleHierarchyVisualization({ onRoleSelect }: RoleHierarchyVisualizationProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoleHierarchy();
  }, []);

  const fetchRoleHierarchy = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/roles/hierarchy');
      if (!response.ok) {
        throw new Error('Failed to fetch role hierarchy');
      }
      const data = await response.json();
      setRoles(data.roles ?? []);
      
      // Auto-expand leadership roles
      const leadershipIds = data.roles?.filter((r: Role) => r.is_leadership).map((r: Role) => r.id) || [];
      setExpandedRoles(new Set(leadershipIds));
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to load hierarchy');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (roleId: string) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedRoles(newExpanded);
  };

  const renderRole = (role: Role, depth = 0): React.ReactNode => {
    const hasChildren = role.children && role.children.length > 0;
    const hasStaff = role.staff && role.staff.length > 0;
    const isExpanded = expandedRoles.has(role.id);
    const staffCount = role.staff?.length ?? 0;
    
    return (
      <div key={role.id} className="role-container">
        {/* Role Header */}
        <div 
          className={`
            relative flex items-center p-4 rounded-lg border transition-all duration-200 cursor-pointer group
            ${role.is_leadership 
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100' 
              : 'bg-card hover:bg-muted border-border'
            }
          `}
          style={{ marginLeft: `${depth * 24}px` }}
          onClick={() => onRoleSelect?.(role)}
        >
          {/* Expand/Collapse Button */}
          <div className="flex items-center mr-3">
            {(hasChildren || hasStaff) ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(role.id);
                }}
                className="p-1 h-8 w-8"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-8 h-8" />
            )}
          </div>
          
          {/* Role Icon */}
          <div className="mr-3">
            {role.is_leadership ? (
              <div className="p-2 rounded-full bg-blue-100">
                <Crown className="h-4 w-4 text-blue-600" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-gray-100">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            )}
          </div>
          
          {/* Role Information */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-foreground flex-1">{role.title}</h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                {role.is_leadership && (
                  <Badge variant="default" className="text-xs whitespace-nowrap">
                    <Shield className="h-3 w-3 mr-1" />
                    Leadership
                  </Badge>
                )}
                
                {staffCount > 0 && (
                  <Badge variant="secondary" className="text-xs whitespace-nowrap">
                    <Users className="h-3 w-3 mr-1" />
                    {staffCount}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                Level {role.level}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Priority {role.priority}
              </Badge>
            </div>
            
            {/* Show role holder name for leadership roles */}
            {role.is_leadership && hasStaff && (
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    {role.staff![0].users.name || role.staff![0].users.email.split('@')[0]}
                  </span>
                </div>
              </div>
            )}
            
            {/* Show staff names for non-leadership roles without children */}
            {!role.is_leadership && !hasChildren && hasStaff && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-1">
                  {role.staff!.slice(0, 3).map((staff, index) => (
                    <span key={staff.id} className="text-sm text-foreground">
                      {staff.users.name || staff.users.email.split('@')[0]}
                      {index < Math.min(role.staff!.length, 3) - 1 && ', '}
                    </span>
                  ))}
                  {staffCount > 3 && (
                    <span className="text-sm text-muted-foreground">
                      +{staffCount - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center text-sm text-muted-foreground">
              <span>{role.department?.name || 'No Department'}</span>
              <span className="mx-2">•</span>
              <span>{role.category}</span>
            </div>
          </div>
          
          {/* Leadership Staff Preview */}
          {role.is_leadership && hasStaff && staffCount > 0 && (
            <div className="flex items-center gap-2 ml-4">
              <div className="flex -space-x-2">
                {role.staff!.slice(0, 3).map((staff) => (
                  <Avatar key={staff.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={staff.users.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {staff.users.name?.charAt(0) || staff.users.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {staffCount > 3 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted">
                    <span className="text-xs">+{staffCount - 3}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-2" style={{ marginLeft: `${depth * 24 + 20}px` }}>
            {/* Children Roles */}
            {hasChildren && (
              <div className="space-y-2 mb-4">
                {role.children!.map(childRole => renderRole(childRole, depth + 1))}
              </div>
            )}
            
            {/* Staff Members */}
            {hasStaff && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Staff Members ({staffCount})
                  </span>
                </div>
                
                <div className="grid gap-2 md:grid-cols-2">
                  {role.staff!.map((staff) => (
                    <div
                      key={staff.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={staff.users.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {staff.users.name?.charAt(0) || staff.users.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {staff.users.name || staff.users.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {staff.users.email}
                        </p>
                        {staff.department && (
                          <p className="text-xs text-muted-foreground">
                            {staff.department.name}
                          </p>
                        )}
                      </div>
                      
                      <UserCheck className="h-4 w-4 text-green-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Hierarchy</CardTitle>
          <CardDescription>Loading role hierarchy...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Hierarchy</CardTitle>
          <CardDescription>Error loading hierarchy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-destructive mb-4">{error}</div>
            <Button onClick={fetchRoleHierarchy} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Organization Hierarchy
            </CardTitle>
            <CardDescription>
              Interactive view of roles and staff assignments
            </CardDescription>
          </div>
          
          <Button
            onClick={fetchRoleHierarchy}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {roles.length > 0 ? (
          <div className="space-y-3">
            {roles
              .sort((a, b) => a.level - b.level || a.priority - b.priority)
              .map(role => renderRole(role))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Roles Found</h3>
            <p className="text-muted-foreground">
              Please set up the organization hierarchy first.
            </p>
          </div>
        )}
        
        {/* Legend */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="text-sm font-medium text-foreground mb-4">Legend:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-blue-100">
                <Crown className="h-3 w-3 text-blue-600" />
              </div>
              <span>Leadership Roles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-gray-100">
                <User className="h-3 w-3 text-gray-600" />
              </div>
              <span>Staff Roles</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="h-3 w-3 text-green-500" />
              <span>Active Staff</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <span>Expandable</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}