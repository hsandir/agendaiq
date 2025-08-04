'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Plus as FiPlus, Edit3 as FiEdit3, Trash2 as FiTrash2, Clock as FiClock, Users as FiUsers, FileText as FiFileText } from 'lucide-react';

interface MeetingTemplate {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  agenda: string | null;
  attendees: string[];
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator: string;
}

interface Role {
  id: number;
  title: string;
  is_leadership: boolean;
}

interface Department {
  id: number;
  name: string;
}

interface MeetingTemplatesClientProps {
  initialTemplates: MeetingTemplate[];
  roles: Role[];
  departments: Department[];
}

export default function MeetingTemplatesClient({ 
  initialTemplates, 
  roles, 
  departments 
}: MeetingTemplatesClientProps) {
  const [templates, setTemplates] = useState<MeetingTemplate[]>(initialTemplates);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MeetingTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    agenda: '',
    attendees: [] as string[],
    is_active: true
  });
  const { toast } = useToast();

  const availableAttendees = [
    ...roles.map(role => ({ type: 'role', value: role.title, label: `${role.title} (Role)` })),
    ...departments.map(dept => ({ type: 'department', value: dept.name, label: `${dept.name} (Department)` }))
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: 60,
      agenda: '',
      attendees: [],
      is_active: true
    });
    setEditingTemplate(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingTemplate 
        ? `/api/meeting-templates/${editingTemplate.id}`
        : '/api/meeting-templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save template');
      }

      const result = await response.json();
      
      if (editingTemplate) {
        setTemplates(prev => prev.map(t => 
          t.id === editingTemplate.id ? result.template : t
        ));
        toast({
          title: "Template Updated",
          description: "Meeting template has been updated successfully.",
        });
      } else {
        setTemplates(prev => [...prev, result.template]);
        toast({
          title: "Template Created",
          description: "New meeting template has been created successfully.",
        });
      }

      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/meeting-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete template');
      }

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast({
        title: "Template Deleted",
        description: "Meeting template has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (template: MeetingTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      duration: template.duration,
      agenda: template.agenda || '',
      attendees: template.attendees,
      is_active: template.is_active
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meeting Templates</h2>
          <p className="text-muted-foreground">
            Manage meeting templates and scheduling rules for the organization.
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          disabled={isLoading}
        >
          <FiPlus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {/* Template Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </CardTitle>
            <CardDescription>
              {editingTemplate ? 'Update the meeting template details.' : 'Create a new meeting template for the organization.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Department Meeting"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    min="15"
                    max="480"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the meeting type"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agenda">Default Agenda</Label>
                <Textarea
                  id="agenda"
                  value={formData.agenda}
                  onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
                  placeholder="Default agenda items for this meeting type"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Default Attendees</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableAttendees.map((attendee) => (
                    <div key={attendee.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={attendee.value}
                        checked={formData.attendees.includes(attendee.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              attendees: [...prev.attendees, attendee.value]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              attendees: prev.attendees.filter(a => a !== attendee.value)
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={attendee.value} className="text-sm">
                        {attendee.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active Template</Label>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : (editingTemplate ? 'Update Template' : 'Create Template')}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FiFileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No meeting templates defined yet.</p>
              <p className="text-sm text-gray-400 mt-2">Create your first template to get started.</p>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {template.name}
                      {!template.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {template.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      disabled={isLoading}
                    >
                      <Edit3 as FiEdit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      disabled={isLoading}
                    >
                      <FiTrash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FiClock className="h-4 w-4" />
                      <span>{template.duration} minutes</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FiUsers className="h-4 w-4" />
                      <span>{template.attendees.length} default attendees</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Created by: {template.creator}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Default Attendees:</div>
                    <div className="flex flex-wrap gap-1">
                      {template.attendees.length > 0 ? (
                        template.attendees.map((attendee) => (
                          <Badge key={attendee} variant="outline" className="text-xs">
                            {attendee}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No default attendees</span>
                      )}
                    </div>
                  </div>
                </div>

                {template.agenda && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm font-medium mb-2">Default Agenda:</div>
                    <div className="text-sm text-gray-600 whitespace-pre-line">
                      {template.agenda}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 