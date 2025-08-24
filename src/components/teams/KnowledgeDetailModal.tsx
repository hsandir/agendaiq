'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FileText,
  Globe,
  BookOpen,
  FileCode,
  FileSpreadsheet,
  Presentation,
  Image,
  Video,
  Download,
  ExternalLink,
  Copy,
  Share2,
  Edit2,
  Trash2,
  Eye,
  Clock,
  Calendar,
  User,
  Shield,
  Hash,
  FolderOpen,
  Link2,
  ChevronRight,
  Info,
  History,
  MessageSquare,
  ThumbsUp,
  Flag,
  Bookmark,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  MoreVertical,
  Printer,
  Mail,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditKnowledgeDialog } from './EditKnowledgeDialog';

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
  created_by: {
    users: {
      id: number;
      name: string | null;
      email: string;
      image?: string | null;
    };
  };
  metadata?: any;
}

interface KnowledgeDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  knowledge: TeamKnowledge;
  onKnowledgeUpdated: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const RESOURCE_TYPES = {
  DOCUMENT: { label: 'Document', icon: FileText, color: 'blue' },
  LINK: { label: 'Web Link', icon: Globe, color: 'green' },
  NOTE: { label: 'Note', icon: BookOpen, color: 'purple' },
  PRESENTATION: { label: 'Presentation', icon: Presentation, color: 'orange' },
  SPREADSHEET: { label: 'Spreadsheet', icon: FileSpreadsheet, color: 'emerald' },
  CODE: { label: 'Code/Script', icon: FileCode, color: 'pink' },
  IMAGE: { label: 'Image', icon: Image, color: 'yellow' },
  VIDEO: { label: 'Video', icon: Video, color: 'red' },
  OTHER: { label: 'Other', icon: FileText, color: 'gray' }
} as const;

export function KnowledgeDetailModal({
  open,
  onOpenChange,
  teamId,
  knowledge,
  onKnowledgeUpdated,
  canEdit = false,
  canDelete = false,
}: KnowledgeDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [relatedResources, setRelatedResources] = useState<TeamKnowledge[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const resourceType = RESOURCE_TYPES[knowledge.type as keyof typeof RESOURCE_TYPES] || RESOURCE_TYPES.OTHER;
  const ResourceIcon = resourceType.icon;

  useEffect(() => {
    if (open) {
      // Track view
      trackView();
      // Load related resources
      loadRelatedResources();
    }
  }, [open, knowledge.id]);

  const trackView = async () => {
    try {
      await fetch(`/api/teams/${teamId}/knowledge/${knowledge.id}/view`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const loadRelatedResources = async () => {
    setLoadingRelated(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/knowledge?category=${knowledge.category}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setRelatedResources(data.knowledge.filter((k: TeamKnowledge) => k.id !== knowledge.id));
      }
    } catch (error) {
      console.error('Error loading related resources:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleDownload = async () => {
    if (knowledge.url) {
      try {
        // Track download
        await fetch(`/api/teams/${teamId}/knowledge/${knowledge.id}/download`, {
          method: 'POST',
        });
        
        // For external links, open in new tab
        if (knowledge.type === 'LINK') {
          window.open(knowledge.url, '_blank');
        } else {
          // For files, trigger download
          const link = document.createElement('a');
          link.href = knowledge.url;
          link.download = knowledge.title;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        toast.success('Download started');
      } catch (error) {
        console.error('Error downloading:', error);
        toast.error('Failed to download resource');
      }
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/dashboard/teams/${teamId}/knowledge/${knowledge.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: knowledge.title,
          text: knowledge.description || '',
          url: `${window.location.origin}/dashboard/teams/${teamId}/knowledge/${knowledge.id}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${knowledge.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/knowledge/${knowledge.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete resource');

      toast.success('Resource deleted successfully');
      onKnowledgeUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Team Resource: ${knowledge.title}`);
    const body = encodeURIComponent(`
Check out this resource from our team knowledge base:

${knowledge.title}
${knowledge.description || ''}

Link: ${window.location.origin}/dashboard/teams/${teamId}/knowledge/${knowledge.id}
    `);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const getConfidentialityBadge = () => {
    const level = knowledge.metadata?.confidentiality || 'internal';
    switch (level) {
      case 'public':
        return <Badge variant="secondary"><Unlock className="h-3 w-3 mr-1" />Public</Badge>;
      case 'internal':
        return <Badge variant="default"><Shield className="h-3 w-3 mr-1" />Internal</Badge>;
      case 'confidential':
        return <Badge variant="outline" className="border-orange-500 text-orange-600"><Lock className="h-3 w-3 mr-1" />Confidential</Badge>;
      case 'restricted':
        return <Badge variant="destructive"><Lock className="h-3 w-3 mr-1" />Restricted</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col p-0">
          {/* Header */}
          <div className="p-6 pb-0">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-${resourceType.color}-100 text-${resourceType.color}-600`}>
                    <ResourceIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-xl mb-2">{knowledge.title}</DialogTitle>
                    {knowledge.description && (
                      <p className="text-sm text-muted-foreground">{knowledge.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <Badge variant="outline">
                        <FolderOpen className="h-3 w-3 mr-1" />
                        {knowledge.category}
                      </Badge>
                      {getConfidentialityBadge()}
                      {knowledge.metadata?.version && (
                        <Badge variant="secondary">v{knowledge.metadata.version}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsBookmarked(!isBookmarked)}
                  >
                    <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      {knowledge.url && (
                        <>
                          <DropdownMenuItem onClick={handleDownload}>
                            {knowledge.type === 'LINK' ? (
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
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={handleCopyLink}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleEmail}>
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </DropdownMenuItem>
                      {canEdit && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </>
                      )}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </>
                            )}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 px-6 pb-6">
              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Views</p>
                          <p className="text-xl font-bold">{knowledge.views_count}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Downloads</p>
                          <p className="text-xl font-bold">{knowledge.downloads_count}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Created</p>
                          <p className="text-sm font-medium">
                            {format(new Date(knowledge.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Updated</p>
                          <p className="text-sm font-medium">
                            {formatDistanceToNow(new Date(knowledge.updated_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Creator Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Created By</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={knowledge.created_by.users.image || undefined} />
                        <AvatarFallback>
                          {knowledge.created_by.users.name?.charAt(0) || knowledge.created_by.users.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {knowledge.created_by.users.name || knowledge.created_by.users.email.split('@')[0]}
                        </p>
                        <p className="text-sm text-muted-foreground">{knowledge.created_by.users.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                {knowledge.tags && knowledge.tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {knowledge.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            <Hash className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Related Resources */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Related Resources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingRelated ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : relatedResources.length > 0 ? (
                      <div className="space-y-3">
                        {relatedResources.map((resource) => {
                          const relatedType = RESOURCE_TYPES[resource.type as keyof typeof RESOURCE_TYPES] || RESOURCE_TYPES.OTHER;
                          const RelatedIcon = relatedType.icon;
                          return (
                            <div
                              key={resource.id}
                              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => {
                                // Open related resource
                                onOpenChange(false);
                                setTimeout(() => {
                                  // Would need to implement navigation to the related resource
                                  toast.info('Opening related resource...');
                                }, 300);
                              }}
                            >
                              <div className={`p-2 rounded bg-${relatedType.color}-100 text-${relatedType.color}-600`}>
                                <RelatedIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{resource.title}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {resource.description || 'No description'}
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No related resources found</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    {knowledge.type === 'NOTE' && knowledge.content ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {knowledge.content}
                        </ReactMarkdown>
                      </div>
                    ) : knowledge.type === 'LINK' && knowledge.url ? (
                      <div className="space-y-4">
                        <Alert>
                          <Globe className="h-4 w-4" />
                          <AlertDescription>
                            This is an external link. Click the button below to open it in a new tab.
                          </AlertDescription>
                        </Alert>
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                          <Link2 className="h-5 w-5 text-muted-foreground" />
                          <code className="flex-1 text-sm">{knowledge.url}</code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(knowledge.url!, '_blank')}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Link
                          </Button>
                        </div>
                      </div>
                    ) : knowledge.type === 'IMAGE' && knowledge.url ? (
                      <div className="space-y-4">
                        <img
                          src={knowledge.url}
                          alt={knowledge.title}
                          className="w-full rounded-lg"
                        />
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleDownload}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Image
                        </Button>
                      </div>
                    ) : knowledge.url ? (
                      <div className="space-y-4">
                        <Alert>
                          <FileText className="h-4 w-4" />
                          <AlertDescription>
                            This file is available for download. Click the button below to download it.
                          </AlertDescription>
                        </Alert>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleDownload}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download {resourceType.label}
                        </Button>
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No content available for this resource.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-6 mt-6">
                {/* Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {knowledge.metadata?.author && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Author:</span>
                        <span className="text-sm font-medium">{knowledge.metadata.author}</span>
                      </div>
                    )}
                    {knowledge.metadata?.lastReviewed && (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Last Reviewed:</span>
                        <span className="text-sm font-medium">
                          {format(new Date(knowledge.metadata.lastReviewed), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    {knowledge.metadata?.expiryDate && (
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Expires:</span>
                        <span className="text-sm font-medium">
                          {format(new Date(knowledge.metadata.expiryDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    {knowledge.metadata?.department && (
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Department:</span>
                        <span className="text-sm font-medium">{knowledge.metadata.department}</span>
                      </div>
                    )}
                    {knowledge.metadata?.relatedMeetings && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">Related Meetings:</span>
                          <p className="text-sm mt-1">{knowledge.metadata.relatedMeetings}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* File Information */}
                {knowledge.metadata?.fileName && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">File Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">File Name:</span>
                          <span className="font-medium">{knowledge.metadata.fileName}</span>
                        </div>
                        {knowledge.metadata?.fileSize && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">File Size:</span>
                            <span className="font-medium">
                              {(knowledge.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        )}
                        {knowledge.metadata?.mimeType && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-medium">{knowledge.metadata.mimeType}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="activity" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activity History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {knowledge.metadata?.editHistory && knowledge.metadata.editHistory.length > 0 ? (
                      <div className="space-y-3">
                        {knowledge.metadata.editHistory.slice().reverse().map((entry: any, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                            <History className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{entry.changes}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>Version {entry.version}</span>
                                <span>{formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No activity history available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Comments Section (placeholder) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Comments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Comments feature coming soon</p>
                      <p className="text-xs mt-2">Team members will be able to discuss this resource</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {showEditDialog && (
        <EditKnowledgeDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          teamId={teamId}
          knowledge={knowledge}
          onKnowledgeUpdated={() => {
            onKnowledgeUpdated();
            setShowEditDialog(false);
          }}
        />
      )}
    </>
  );
}