'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Link,
  Upload,
  BookOpen,
  FileCode,
  FileSpreadsheet,
  Presentation,
  Image,
  Video,
  Loader2,
  Plus,
  X,
  Info,
  Globe,
  File,
  Hash,
  Calendar,
  User,
  FolderOpen,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateKnowledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onKnowledgeCreated: () => void;
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
  OTHER: { label: 'Other', icon: File, color: 'gray' }
} as const;

const CATEGORIES = [
  'Meeting Notes',
  'Policies & Procedures',
  'Training Materials',
  'Project Documents',
  'Templates',
  'Reports',
  'Guidelines',
  'Best Practices',
  'Research',
  'References',
  'Tools & Resources',
  'Communications'
];

export function CreateKnowledgeDialog({
  open,
  onOpenChange,
  teamId,
  onKnowledgeCreated,
}: CreateKnowledgeDialogProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState<keyof typeof RESOURCE_TYPES>('DOCUMENT');
  const [category, setCategory] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [metadata, setMetadata] = useState({
    author: '',
    version: '1.0',
    lastReviewed: new Date().toISOString().split('T')[0],
    expiryDate: '',
    department: '',
    relatedMeetings: '',
    confidentiality: 'internal'
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      
      // Auto-detect resource type based on file extension
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension) {
        if (['doc', 'docx', 'pdf', 'txt'].includes(extension)) {
          setResourceType('DOCUMENT');
        } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
          setResourceType('SPREADSHEET');
        } else if (['ppt', 'pptx'].includes(extension)) {
          setResourceType('PRESENTATION');
        } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
          setResourceType('IMAGE');
        } else if (['mp4', 'avi', 'mov', 'webm'].includes(extension)) {
          setResourceType('VIDEO');
        } else if (['js', 'ts', 'py', 'java', 'cpp', 'html', 'css'].includes(extension)) {
          setResourceType('CODE');
        } else {
          setResourceType('OTHER');
        }
      }
      
      // Auto-fill title if empty
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt.replace(/[-_]/g, ' '));
      }
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error('Title is required');
      setActiveTab('details');
      return false;
    }
    
    if (!category) {
      toast.error('Please select a category');
      setActiveTab('details');
      return false;
    }
    
    if (resourceType === 'LINK' && !url.trim()) {
      toast.error('URL is required for web links');
      setActiveTab('content');
      return false;
    }
    
    if (resourceType === 'NOTE' && !content.trim()) {
      toast.error('Content is required for notes');
      setActiveTab('content');
      return false;
    }
    
    if (!['LINK', 'NOTE'].includes(resourceType) && !file) {
      toast.error('Please select a file to upload');
      setActiveTab('content');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    setUploadProgress(0);
    
    try {
      let uploadedFileUrl = null;
      
      // Upload file if present
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('teamId', teamId);
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);
        
        const uploadResponse = await fetch('/api/teams/upload', {
          method: 'POST',
          body: formData,
        });
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        if (!uploadResponse.ok) throw new Error('Failed to upload file');
        
        const { url: __fileUrl } = await uploadResponse.json();
        uploadedFileUrl = fileUrl;
      }
      
      // Create knowledge entry
      const knowledgeData = {
        title: title.trim(),
        description: description.trim() || null,
        type: resourceType,
        category,
        url: resourceType === 'LINK' ? url.trim() : uploadedFileUrl,
        content: resourceType === 'NOTE' ? content.trim() : null,
        tags: tags.length > 0 ? tags : null,
        is_public: isPublic,
        metadata: {
          ...metadata,
          fileSize: file?.size,
          fileName: file?.name,
          mimeType: file?.type,
        },
      };
      
      const response = await fetch(`/api/teams/${teamId}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(knowledgeData),
      });
      
      if (!response.ok) throw new Error('Failed to create knowledge entry');
      
      toast.success('Knowledge resource added successfully', {
        description: `"${title}" has been added to the team knowledge base`
      });
      
      onKnowledgeCreated();
      onOpenChange(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setResourceType('DOCUMENT');
      setCategory('');
      setUrl('');
      setContent('');
      setTags([]);
      setFile(null);
      setIsPublic(false);
      setActiveTab('details');
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Error creating knowledge:', error);
      toast.error('Failed to create knowledge resource');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const ResourceTypeIcon = RESOURCE_TYPES[resourceType].icon;
  const resourceColor = RESOURCE_TYPES[resourceType].color;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Add Knowledge Resource
          </DialogTitle>
          <DialogDescription>
            Share documents, links, and resources with your team
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[500px] pr-2">
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a brief description of this resource"
                  rows={3}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label>Resource Type *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(RESOURCE_TYPES).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <Card
                        key={key}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          resourceType === key && `ring-2 ring-${config.color}-500 bg-${config.color}-50`
                        )}
                        onClick={() => setResourceType(key as keyof typeof RESOURCE_TYPES)}
                      >
                        <CardContent className="flex flex-col items-center justify-center p-4">
                          <Icon className={cn(
                            "h-6 w-6 mb-1",
                            resourceType === key ? `text-${config.color}-600` : "text-muted-foreground"
                          )} />
                          <span className={cn(
                            "text-xs",
                            resourceType === key ? "font-semibold" : ""
                          )}>
                            {config.label}
                          </span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} disabled={submitting}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          {cat}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tags for better searchability"
                    disabled={submitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={submitting || !tagInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="pl-2">
                        <Hash className="h-3 w-3 mr-1" />
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 hover:text-destructive"
                          disabled={submitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 mt-4">
              {resourceType === 'LINK' ? (
                <div className="space-y-2">
                  <Label htmlFor="url">Web URL *</Label>
                  <div className="flex gap-2">
                    <Globe className="h-5 w-5 text-muted-foreground mt-2" />
                    <Input
                      id="url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/resource"
                      disabled={submitting}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter the full URL including https://
                  </p>
                </div>
              ) : resourceType === 'NOTE' ? (
                <div className="space-y-2">
                  <Label htmlFor="content">Note Content *</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter your note content here..."
                    rows={10}
                    disabled={submitting}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground">
                    Supports markdown formatting
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Upload {RESOURCE_TYPES[resourceType].label.toLowerCase()} files up to 10MB
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label htmlFor="file">Select File *</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileSelect}
                        disabled={submitting}
                        className="flex-1"
                      />
                      {file && (
                        <Badge variant="secondary">
                          <ResourceTypeIcon className="h-3 w-3 mr-1" />
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      )}
                    </div>
                    {file && (
                      <Card className="p-3 mt-2">
                        <div className="flex items-center gap-3">
                          <ResourceTypeIcon className={`h-8 w-8 text-${resourceColor}-500`} />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Type: {file.type || 'Unknown'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFile(null)}
                            disabled={submitting}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Uploading...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <div className="flex gap-2">
                    <User className="h-5 w-5 text-muted-foreground mt-2" />
                    <Input
                      id="author"
                      value={metadata.author}
                      onChange={(e) => setMetadata({...metadata, author: e.target.value})}
                      placeholder="Document author"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={metadata.version}
                    onChange={(e) => setMetadata({...metadata, version: e.target.value})}
                    placeholder="1.0"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastReviewed">Last Reviewed</Label>
                  <div className="flex gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-2" />
                    <Input
                      id="lastReviewed"
                      type="date"
                      value={metadata.lastReviewed}
                      onChange={(e) => setMetadata({...metadata, lastReviewed: e.target.value})}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-2" />
                    <Input
                      id="expiryDate"
                      type="date"
                      value={metadata.expiryDate}
                      onChange={(e) => setMetadata({...metadata, expiryDate: e.target.value})}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={metadata.department}
                    onChange={(e) => setMetadata({...metadata, department: e.target.value})}
                    placeholder="Related department"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confidentiality">Confidentiality</Label>
                  <Select
                    value={metadata.confidentiality}
                    onValueChange={(value) => setMetadata({...metadata, confidentiality: value})}
                    disabled={submitting}
                  >
                    <SelectTrigger id="confidentiality">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="confidential">Confidential</SelectItem>
                      <SelectItem value="restricted">Restricted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relatedMeetings">Related Meetings</Label>
                <Textarea
                  id="relatedMeetings"
                  value={metadata.relatedMeetings}
                  onChange={(e) => setMetadata({...metadata, relatedMeetings: e.target.value})}
                  placeholder="Meeting IDs or titles (comma-separated)"
                  rows={2}
                  disabled={submitting}
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Metadata helps with organization, compliance, and searchability of resources
                </AlertDescription>
              </Alert>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || uploadProgress > 0}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Creating...'}
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Add Resource
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}