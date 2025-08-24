'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  FileText,
  Link,
  StickyNote,
  FileCode,
  BookOpen,
  Shield,
  Plus,
  Search,
  Filter,
  Pin,
  Edit,
  Trash2,
  ExternalLink,
  Download,
  Eye,
  Clock,
  Tag,
  MoreVertical,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface KnowledgeResource {
  id: number;
  title: string;
  content: string;
  type: string;
  tags: string[];
  url?: string | null;
  is_pinned: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
  created_by_user: {
    id: number;
    name: string | null;
    email: string;
    image?: string | null;
  };
  _count: {
    views: number;
  };
}

interface TeamKnowledgeProps {
  teamId: number;
  canEdit?: boolean;
}

const KNOWLEDGE_TYPES = [
  { value: 'DOCUMENT', label: 'Document', icon: FileText },
  { value: 'LINK', label: 'Link', icon: Link },
  { value: 'NOTE', label: 'Note', icon: StickyNote },
  { value: 'TEMPLATE', label: 'Template', icon: FileCode },
  { value: 'GUIDE', label: 'Guide', icon: BookOpen },
  { value: 'POLICY', label: 'Policy', icon: Shield },
];

export function TeamKnowledge({ teamId, canEdit = false }: TeamKnowledgeProps) {
  const { _toast } = useToast();
  const [knowledge, setKnowledge] = useState<KnowledgeResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingResource, setEditingResource] = useState<KnowledgeResource | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'NOTE',
    tags: '',
    url: '',
  });

  useEffect(() => {
    fetchKnowledge();
  }, [teamId, searchQuery, selectedType]);

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedType) params.append('type', selectedType);

      const response = await fetch(`/api/teams/${teamId}/knowledge?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch knowledge resources');
      }

      const data = await response.json();
      setKnowledge(data.knowledge);
    } catch (err) {
    if (err instanceof Error) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Error',
        description: 'Title and content are required',
        variant: 'destructive',
      });
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
          url: formData.url || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create knowledge resource');
      }

      toast({
        title: 'Success',
        description: 'Knowledge resource created successfully',
      });

      setShowCreateDialog(false);
      resetForm();
      fetchKnowledge();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create knowledge resource',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingResource) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/knowledge?knowledge_id=${editingResource.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
          url: formData.url || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update knowledge resource');
      }

      toast({
        title: 'Success',
        description: 'Knowledge resource updated successfully',
      });

      setEditingResource(null);
      resetForm();
      fetchKnowledge();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update knowledge resource',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/knowledge?knowledge_id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete knowledge resource');
      }

      toast({
        title: 'Success',
        description: 'Knowledge resource deleted successfully',
      });

      fetchKnowledge();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete knowledge resource',
        variant: 'destructive',
      });
    }
  };

  const handlePin = async (resource: KnowledgeResource) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/knowledge?knowledge_id=${resource.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_pinned: !resource.is_pinned,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pin status');
      }

      fetchKnowledge();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update pin status',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'NOTE',
      tags: '',
      url: '',
    });
  };

  const startEdit = (resource: KnowledgeResource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      content: resource.content,
      type: resource.type,
      tags: resource.tags.join(', '),
      url: resource.url || '',
    });
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = KNOWLEDGE_TYPES.find(t => t.value === type);
    const Icon = typeConfig?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DOCUMENT':
        return 'bg-blue-100 text-blue-800';
      case 'LINK':
        return 'bg-green-100 text-green-800';
      case 'NOTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'TEMPLATE':
        return 'bg-purple-100 text-purple-800';
      case 'GUIDE':
        return 'bg-orange-100 text-orange-800';
      case 'POLICY':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const pinnedResources = knowledge.filter(k => k.is_pinned);
  const regularResources = knowledge.filter(k => !k.is_pinned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              {KNOWLEDGE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canEdit && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        )}
      </div>

      {/* Pinned Resources */}
      {pinnedResources.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            <Pin className="inline h-3 w-3 mr-1" />
            Pinned
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pinnedResources.map((resource) => (
              <KnowledgeCard
                key={resource.id}
                resource={resource}
                canEdit={canEdit}
                onEdit={() => startEdit(resource)}
                onDelete={() => handleDelete(resource.id)}
                onPin={() => handlePin(resource)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Resources */}
      {regularResources.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {regularResources.map((resource) => (
            <KnowledgeCard
              key={resource.id}
              resource={resource}
              canEdit={canEdit}
              onEdit={() => startEdit(resource)}
              onDelete={() => handleDelete(resource.id)}
              onPin={() => handlePin(resource)}
            />
          ))}
        </div>
      ) : (
        knowledge.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No resources yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start building your team's knowledge base
              </p>
              {canEdit && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Resource
                </Button>
              )}
            </CardContent>
          </Card>
        )
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || !!editingResource} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingResource(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? 'Edit Resource' : 'Add Knowledge Resource'}
            </DialogTitle>
            <DialogDescription>
              Share valuable information with your team
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={formLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                disabled={formLoading}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KNOWLEDGE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                disabled={formLoading}
                rows={5}
              />
            </div>
            {formData.type === 'LINK' && (
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  disabled={formLoading}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., onboarding, best-practices, guidelines"
                disabled={formLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingResource(null);
                resetForm();
              }}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={editingResource ? handleUpdate : handleCreate}
              disabled={formLoading}
            >
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingResource ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Knowledge Card Component
function KnowledgeCard({
  resource,
  canEdit,
  onEdit,
  onDelete,
  onPin,
}: {
  resource: KnowledgeResource;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
}) {
  const getTypeIcon = (type: string) => {
    const typeConfig = KNOWLEDGE_TYPES.find(t => t.value === type);
    const Icon = typeConfig?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DOCUMENT':
        return 'bg-blue-100 text-blue-800';
      case 'LINK':
        return 'bg-green-100 text-green-800';
      case 'NOTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'TEMPLATE':
        return 'bg-purple-100 text-purple-800';
      case 'GUIDE':
        return 'bg-orange-100 text-orange-800';
      case 'POLICY':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${getTypeColor(resource.type)}`}>
              {getTypeIcon(resource.type)}
            </div>
            <Badge variant="outline" className="text-xs">
              {resource.type}
            </Badge>
            {resource.is_pinned && (
              <Pin className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onPin}>
                  <Pin className="mr-2 h-4 w-4" />
                  {resource.is_pinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <CardTitle className="text-base mt-2">{resource.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {resource.content}
        </p>
        
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-3"
          >
            <ExternalLink className="h-3 w-3" />
            View Link
          </a>
        )}

        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{resource.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={resource.created_by_(user as Record<string, unknown>).image || undefined} />
              <AvatarFallback className="text-xs">
                {resource.created_by_user.name?.charAt(0) || resource.created_by_user.email.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span>
              {resource.created_by_user.name || resource.created_by_user.email.split('@')[0]}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {resource._count.views}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}