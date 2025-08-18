"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Settings,
  Bell,
  User,
  Home,
  BarChart3,
  MessageSquare,
  Star,
  Heart,
  Share2,
  Download,
  Edit,
  Trash,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Mic,
  MicOff,
  Camera,
  CameraOff
} from "lucide-react";

// Komple tasarım sistemi konfigürasyonları
const designSystems = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Zoom benzeri temiz ve minimal tasarım',
    config: {
      colors: {
        primary: 'bg-primary hover:bg-primary',
        secondary: 'bg-muted',
        accent: 'bg-primary',
        text: 'text-foreground',
        muted: 'text-muted-foreground',
        border: 'border-border',
        surface: 'bg-card',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-destructive/10 text-destructive'
      },
      typography: {
        heading: 'font-bold text-foreground',
        body: 'text-foreground',
        caption: 'text-sm text-muted-foreground',
        accent: 'font-medium text-primary'
      },
      spacing: {
        container: 'p-6',
        section: 'mb-8',
        card: 'p-6',
        button: 'px-4 py-2'
      },
      borderRadius: 'rounded-lg',
      shadows: 'shadow-sm hover:shadow-md',
      layout: 'max-w-7xl mx-auto',
      sidebar: 'w-64 bg-card border-r border-border',
      header: 'bg-card border-b border-border'
    }
  },
  {
    id: 'professional-dark',
    name: 'Professional Dark',
    description: 'Otter benzeri koyu profesyonel tema',
    config: {
      colors: {
        primary: 'bg-background hover:bg-background',
        secondary: 'bg-background',
        accent: 'bg-primary',
        text: 'text-foreground',
        muted: 'text-muted-foreground',
        border: 'border-border',
        surface: 'bg-background',
        success: 'bg-green-900 text-green-300',
        warning: 'bg-yellow-900 text-yellow-300',
        error: 'bg-destructive/10 text-destructive'
      },
      typography: {
        heading: 'font-bold text-foreground',
        body: 'text-muted-foreground',
        caption: 'text-sm text-muted-foreground',
        accent: 'font-medium text-primary'
      },
      spacing: {
        container: 'p-8',
        section: 'mb-10',
        card: 'p-8',
        button: 'px-6 py-3'
      },
      borderRadius: 'rounded-xl',
      shadows: 'shadow-2xl hover:shadow-3xl',
      layout: 'max-w-6xl mx-auto',
      sidebar: 'w-72 bg-background border-r border-border',
      header: 'bg-background border-b border-border'
    }
  },
  {
    id: 'creative-bright',
    name: 'Creative Bright',
    description: 'Notion benzeri renkli ve yaratıcı',
    config: {
      colors: {
        primary: 'bg-secondary hover:bg-secondary',
        secondary: 'bg-yellow-50',
        accent: 'bg-pink-100',
        text: 'text-foreground',
        muted: 'text-muted-foreground',
        border: 'border-purple-200',
        surface: 'bg-card',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-orange-100 text-orange-800',
        error: 'bg-destructive/10 text-destructive'
      },
      typography: {
        heading: 'font-bold text-foreground',
        body: 'text-foreground',
        caption: 'text-sm text-muted-foreground',
        accent: 'font-medium text-secondary'
      },
      spacing: {
        container: 'p-8',
        section: 'mb-10',
        card: 'p-8',
        button: 'px-6 py-3'
      },
      borderRadius: 'rounded-2xl',
      shadows: 'shadow-lg hover:shadow-xl',
      layout: 'max-w-7xl mx-auto',
      sidebar: 'w-80 bg-gradient-to-b from-purple-50 to-pink-50 border-r border-purple-200',
      header: 'bg-card border-b border-purple-200'
    }
  },
  {
    id: 'corporate-elegant',
    name: 'Corporate Elegant',
    description: 'Kurumsal şık ve zarif tasarım',
    config: {
      colors: {
        primary: 'bg-slate-700 hover:bg-slate-800',
        secondary: 'bg-slate-50',
        accent: 'bg-emerald-600',
        text: 'text-slate-900',
        muted: 'text-slate-600',
        border: 'border-slate-200',
        surface: 'bg-card',
        success: 'bg-emerald-100 text-emerald-800',
        warning: 'bg-amber-100 text-amber-800',
        error: 'bg-destructive/10 text-destructive'
      },
      typography: {
        heading: 'font-semibold text-slate-900',
        body: 'text-slate-700',
        caption: 'text-sm text-slate-500',
        accent: 'font-medium text-emerald-600'
      },
      spacing: {
        container: 'p-8',
        section: 'mb-12',
        card: 'p-8',
        button: 'px-6 py-3'
      },
      borderRadius: 'rounded-lg',
      shadows: 'shadow-md hover:shadow-lg',
      layout: 'max-w-6xl mx-auto',
      sidebar: 'w-64 bg-slate-50 border-r border-slate-200',
      header: 'bg-card border-b border-slate-200'
    }
  },
  {
    id: 'tech-futuristic',
    name: 'Tech Futuristic',
    description: 'Teknolojik gelecekçi tasarım',
    config: {
      colors: {
        primary: 'bg-cyan-600 hover:bg-cyan-700',
        secondary: 'bg-slate-900',
        accent: 'bg-cyan-500',
        text: 'text-foreground',
        muted: 'text-cyan-200',
        border: 'border-cyan-700',
        surface: 'bg-slate-800',
        success: 'bg-green-900 text-green-300',
        warning: 'bg-yellow-900 text-yellow-300',
        error: 'bg-destructive/10 text-destructive'
      },
      typography: {
        heading: 'font-bold text-foreground',
        body: 'text-cyan-100',
        caption: 'text-sm text-cyan-300',
        accent: 'font-medium text-cyan-400'
      },
      spacing: {
        container: 'p-8',
        section: 'mb-10',
        card: 'p-8',
        button: 'px-6 py-3'
      },
      borderRadius: 'rounded-2xl',
      shadows: 'shadow-2xl hover:shadow-3xl shadow-cyan-500/20',
      layout: 'max-w-7xl mx-auto',
      sidebar: 'w-72 bg-slate-900 border-r border-cyan-700',
      header: 'bg-slate-800 border-b border-cyan-700'
    }
  },
  {
    id: 'warm-friendly',
    name: 'Warm Friendly',
    description: 'Sıcak ve dostane tasarım',
    config: {
      colors: {
        primary: 'bg-orange-500 hover:bg-orange-600',
        secondary: 'bg-orange-50',
        accent: 'bg-amber-100',
        text: 'text-foreground',
        muted: 'text-muted-foreground',
        border: 'border-orange-200',
        surface: 'bg-card',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-orange-100 text-orange-800',
        error: 'bg-destructive/10 text-destructive'
      },
      typography: {
        heading: 'font-bold text-foreground',
        body: 'text-foreground',
        caption: 'text-sm text-muted-foreground',
        accent: 'font-medium text-orange-600'
      },
      spacing: {
        container: 'p-6',
        section: 'mb-8',
        card: 'p-6',
        button: 'px-4 py-2'
      },
      borderRadius: 'rounded-xl',
      shadows: 'shadow-md hover:shadow-lg',
      layout: 'max-w-6xl mx-auto',
      sidebar: 'w-64 bg-orange-50 border-r border-orange-200',
      header: 'bg-card border-b border-orange-200'
    }
  },
  {
    id: 'bold-confident',
    name: 'Bold Confident',
    description: 'Cesur ve güvenli tasarım',
    config: {
      colors: {
        primary: 'bg-destructive/10 hover:bg-destructive/10',
        secondary: 'bg-destructive/10',
        accent: 'bg-destructive/10',
        text: 'text-foreground',
        muted: 'text-muted-foreground',
        border: 'border-destructive',
        surface: 'bg-card',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-destructive/10 text-destructive'
      },
      typography: {
        heading: 'font-bold text-foreground',
        body: 'text-foreground',
        caption: 'text-sm text-muted-foreground',
        accent: 'font-medium text-destructive'
      },
      spacing: {
        container: 'p-8',
        section: 'mb-10',
        card: 'p-8',
        button: 'px-6 py-3'
      },
      borderRadius: 'rounded-lg',
      shadows: 'shadow-lg hover:shadow-xl',
      layout: 'max-w-7xl mx-auto',
      sidebar: 'w-64 bg-destructive/10 border-r border-destructive',
      header: 'bg-card border-b border-destructive'
    }
  },
  {
    id: 'soft-subtle',
    name: 'Soft Subtle',
    description: 'Yumuşak ve zarif tasarım',
    config: {
      colors: {
        primary: 'bg-rose-400 hover:bg-rose-500',
        secondary: 'bg-rose-50',
        accent: 'bg-pink-100',
        text: 'text-foreground',
        muted: 'text-muted-foreground',
        border: 'border-rose-200',
        surface: 'bg-card',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-destructive/10 text-destructive'
      },
      typography: {
        heading: 'font-semibold text-foreground',
        body: 'text-foreground',
        caption: 'text-sm text-muted-foreground',
        accent: 'font-medium text-rose-600'
      },
      spacing: {
        container: 'p-6',
        section: 'mb-8',
        card: 'p-6',
        button: 'px-4 py-2'
      },
      borderRadius: 'rounded-2xl',
      shadows: 'shadow-sm hover:shadow-md',
      layout: 'max-w-6xl mx-auto',
      sidebar: 'w-64 bg-rose-50 border-r border-rose-200',
      header: 'bg-card border-b border-rose-200'
    }
  },
  {
    id: 'vibrant-energetic',
    name: 'Vibrant Energetic',
    description: 'Canlı ve enerjik tasarım',
    config: {
      colors: {
        primary: 'bg-green-500 hover:bg-green-600',
        secondary: 'bg-green-50',
        accent: 'bg-lime-100',
        text: 'text-foreground',
        muted: 'text-muted-foreground',
        border: 'border-green-200',
        surface: 'bg-card',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-destructive/10 text-destructive'
      },
      typography: {
        heading: 'font-bold text-foreground',
        body: 'text-foreground',
        caption: 'text-sm text-muted-foreground',
        accent: 'font-medium text-green-600'
      },
      spacing: {
        container: 'p-8',
        section: 'mb-10',
        card: 'p-8',
        button: 'px-6 py-3'
      },
      borderRadius: 'rounded-xl',
      shadows: 'shadow-lg hover:shadow-xl',
      layout: 'max-w-7xl mx-auto',
      sidebar: 'w-64 bg-green-50 border-r border-green-200',
      header: 'bg-card border-b border-green-200'
    }
  },
  {
    id: 'calm-professional',
    name: 'Calm Professional',
    description: 'Sakin ve profesyonel tasarım',
    config: {
      colors: {
        primary: 'bg-teal-600 hover:bg-teal-700',
        secondary: 'bg-teal-50',
        accent: 'bg-teal-100',
        text: 'text-foreground',
        muted: 'text-muted-foreground',
        border: 'border-teal-200',
        surface: 'bg-card',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-destructive/10 text-destructive'
      },
      typography: {
        heading: 'font-semibold text-foreground',
        body: 'text-foreground',
        caption: 'text-sm text-muted-foreground',
        accent: 'font-medium text-teal-600'
      },
      spacing: {
        container: 'p-6',
        section: 'mb-8',
        card: 'p-6',
        button: 'px-4 py-2'
      },
      borderRadius: 'rounded-lg',
      shadows: 'shadow-sm hover:shadow-md',
      layout: 'max-w-6xl mx-auto',
      sidebar: 'w-64 bg-teal-50 border-r border-teal-200',
      header: 'bg-card border-b border-teal-200'
    }
  }
];

export default function DesignSystemDemoPage() {
  const [selectedDesign, setSelectedDesign] = useState(designSystems[0]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("meetings");

  // Örnek veriler
  const meetings = [
    {
      id: 1,
      title: "Haftalık Ekip Toplantısı",
      description: "Bu haftanın görevleri ve hedefleri",
      startTime: "2024-01-15T10:00:00",
      endTime: "2024-01-15T11:00:00",
      status: "scheduled",
      attendees: 8,
      hasRecording: true,
      hasNotes: true,
      organizer: {
        name: "Ahmet Yılmaz",
        avatar: "/avatars/ahmet.jpg"
      }
    },
    {
      id: 2,
      title: "Proje Değerlendirme",
      description: "Q1 projelerinin değerlendirmesi",
      startTime: "2024-01-15T14:00:00",
      endTime: "2024-01-15T15:30:00",
      status: "upcoming",
      attendees: 12,
      hasRecording: false,
      hasNotes: false,
      organizer: {
        name: "Fatma Demir",
        avatar: "/avatars/fatma.jpg"
      }
    },
    {
      id: 3,
      title: "Müşteri Sunumu",
      description: "Yeni ürün özelliklerinin sunumu",
      startTime: "2024-01-16T09:00:00",
      endTime: "2024-01-16T10:00:00",
      status: "completed",
      attendees: 15,
      hasRecording: true,
      hasNotes: true,
      organizer: {
        name: "Mehmet Kaya",
        avatar: "/avatars/mehmet.jpg"
      }
    }
  ];

  const design = selectedDesign.config;

  return (
    <div className={`min-h-screen ${design.colors.secondary}`}>
      {/* Header */}
      <header className={`${design.header} ${design.colors.surface} ${design.colors.border} border-b`}>
        <div className={`${design.layout} ${design.spacing.container}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className={`text-2xl ${design.typography.heading}`}>AgendaIQ</h1>
              <p className={`text-sm ${design.typography.caption}`}>Meeting Management System</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Design System Selector */}
              <div className="relative">
                <Select 
                  value={selectedDesign.id}
                  onValueChange={(value) => {
                    const design = designSystems.find(d => d.id === value);
                    if (design) setSelectedDesign(design);
                  }}
                >
                  <SelectTrigger className={`w-48 ${design.colors.border}`}>
                    <SelectValue placeholder="Select Design" />
                  </SelectTrigger>
                  <SelectContent>
                    {designSystems.map(design => (
                      <SelectItem key={design.id} value={design.id}>
                        {design.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button className={`${design.colors.primary} text-foreground`}>
                <Plus className="w-4 h-4 mr-2" />
                New Meeting
              </Button>
              
              <Button variant="outline" className={design.colors.border}>
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button variant="outline" className={design.colors.border}>
                <Bell className="w-4 h-4" />
              </Button>
              
              <Avatar className="w-8 h-8">
                <AvatarImage src="/avatars/(user as Record<string, unknown>).jpg" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className={`${design.sidebar} min-h-screen ${design.spacing.container}`}>
            <nav className="space-y-4">
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="w-4 h-4 mr-3" />
                  Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-3" />
                  Meetings
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-3" />
                  Team
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-3" />
                  Analytics
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-3" />
                  Messages
                </Button>
              </div>
              
              <div className="pt-4 border-t border-border">
                <h3 className={`text-sm font-medium ${design.typography.caption} mb-2`}>
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    New Meeting
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Invite Team
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Templates
                  </Button>
                </div>
              </div>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 ${design.spacing.container}`}>
          {/* Stats Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${design.spacing.section}`}>
            <Card className={`${design.shadows} ${design.borderRadius} ${design.colors.border} border`}>
              <CardContent className={design.spacing.card}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${design.typography.caption}`}>Total Meetings</p>
                    <p className={`text-2xl font-bold ${design.typography.heading}`}>24</p>
                  </div>
                  <div className={`p-3 ${design.colors.accent} ${design.borderRadius}`}>
                    <Calendar className={`w-6 h-6 ${design.colors.muted}`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${design.shadows} ${design.borderRadius} ${design.colors.border} border`}>
              <CardContent className={design.spacing.card}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${design.typography.caption}`}>This Week</p>
                    <p className={`text-2xl font-bold ${design.typography.heading}`}>8</p>
                  </div>
                  <div className={`p-3 ${design.colors.accent} ${design.borderRadius}`}>
                    <Clock className={`w-6 h-6 ${design.colors.muted}`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${design.shadows} ${design.borderRadius} ${design.colors.border} border`}>
              <CardContent className={design.spacing.card}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${design.typography.caption}`}>Participants</p>
                    <p className={`text-2xl font-bold ${design.typography.heading}`}>156</p>
                  </div>
                  <div className={`p-3 ${design.colors.accent} ${design.borderRadius}`}>
                    <Users className={`w-6 h-6 ${design.colors.muted}`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${design.shadows} ${design.borderRadius} ${design.colors.border} border`}>
              <CardContent className={design.spacing.card}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${design.typography.caption}`}>Recordings</p>
                    <p className={`text-2xl font-bold ${design.typography.heading}`}>12</p>
                  </div>
                  <div className={`p-3 ${design.colors.accent} ${design.borderRadius}`}>
                    <Video className={`w-6 h-6 ${design.colors.muted}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className={`flex items-center justify-between ${design.spacing.section}`}>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search meetings..."
                  className={`pl-10 pr-4 ${design.colors.border} ${design.borderRadius}`}
                />
              </div>
              <Button variant="outline" className={`flex items-center space-x-2 ${design.colors.border}`}>
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className={design.colors.border}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className={design.colors.border}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className={design.spacing.section}>
            <TabsList className={`${design.colors.border} ${design.borderRadius}`}>
              <TabsTrigger value="meetings">Meetings</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="meetings" className="mt-6">
              {/* Meetings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.map((meeting) => (
                  <Card key={meeting.id} className={`${design.shadows} ${design.borderRadius} ${design.colors.border} border hover:shadow-lg transition-all duration-200`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className={`text-lg ${design.typography.heading}`}>
                            {meeting.title}
                          </CardTitle>
                          <p className={`text-sm ${design.typography.caption} mt-1`}>
                            {meeting.description}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Time Info */}
                      <div className="flex items-center space-x-2">
                        <Clock className={`w-4 h-4 ${design.colors.muted}`} />
                        <span className={`text-sm ${design.typography.body}`}>
                          {new Date(meeting.startTime).toLocaleDateString('tr-TR', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Attendees */}
                      <div className="flex items-center space-x-2">
                        <Users className={`w-4 h-4 ${design.colors.muted}`} />
                        <span className={`text-sm ${design.typography.body}`}>
                          {meeting.attendees} participants
                        </span>
                      </div>

                      {/* Organizer */}
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={meeting.organizer.avatar} />
                          <AvatarFallback>
                            {meeting.organizer.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`text-sm ${design.typography.caption}`}>
                          {meeting.organizer.name}
                        </span>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                          {meeting.status === 'completed' && (
                            <Badge className={`${design.colors.success} ${design.borderRadius}`}>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          {meeting.status === 'upcoming' && (
                            <Badge className={`${design.colors.warning} ${design.borderRadius}`}>
                              <Clock className="w-3 h-3 mr-1" />
                              Upcoming
                            </Badge>
                          )}
                          {meeting.status === 'scheduled' && (
                            <Badge className={`${design.colors.accent} ${design.borderRadius}`}>
                              <Calendar className="w-3 h-3 mr-1" />
                              Scheduled
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {meeting.hasRecording && (
                            <Button size="sm" variant="ghost">
                              <Video className="w-4 h-4" />
                            </Button>
                          )}
                          {meeting.hasNotes && (
                            <Button size="sm" variant="ghost">
                              <FileText className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-6">
              <Card className={`${design.shadows} ${design.borderRadius} ${design.colors.border} border`}>
                <CardContent className={design.spacing.card}>
                  <div className="text-center py-12">
                    <Calendar className={`w-16 h-16 mx-auto mb-4 ${design.colors.muted}`} />
                    <h3 className={`text-lg ${design.typography.heading} mb-2`}>Calendar View</h3>
                    <p className={`text-sm ${design.typography.caption}`}>
                      Calendar integration coming soon...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-6">
              <Card className={`${design.shadows} ${design.borderRadius} ${design.colors.border} border`}>
                <CardContent className={design.spacing.card}>
                  <div className="space-y-6">
                    <div>
                      <h3 className={`text-lg ${design.typography.heading} mb-4`}>Meeting Analytics</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className={design.typography.body}>Completion Rate</span>
                            <span className={design.typography.accent}>85%</span>
                          </div>
                          <Progress value={85} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className={design.typography.body}>Attendance Rate</span>
                            <span className={design.typography.accent}>92%</span>
                          </div>
                          <Progress value={92} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className={design.typography.body}>Satisfaction Score</span>
                            <span className={design.typography.accent}>4.2/5</span>
                          </div>
                          <Progress value={84} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className={`mt-8 p-6 ${design.colors.surface} ${design.borderRadius} ${design.shadows} ${design.colors.border} border`}>
            <h3 className={`text-lg font-semibold mb-4 ${design.typography.heading}`}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className={`${design.colors.primary} text-foreground`}>
                <Plus className="w-4 h-4 mr-2" />
                New Meeting
              </Button>
              <Button variant="outline" className={design.colors.border}>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
              <Button variant="outline" className={design.colors.border}>
                <Users className="w-4 h-4 mr-2" />
                Invite
              </Button>
              <Button variant="outline" className={design.colors.border}>
                <FileText className="w-4 h-4 mr-2" />
                Templates
              </Button>
            </div>
          </div>

          {/* Form Example */}
          <div className={`mt-8 p-6 ${design.colors.surface} ${design.borderRadius} ${design.shadows} ${design.colors.border} border`}>
            <h3 className={`text-lg font-semibold mb-4 ${design.typography.heading}`}>
              Form Components
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className={design.typography.body}>Meeting Title</Label>
                  <Input 
                    id="title" 
                    placeholder="Enter meeting title"
                    className={`mt-1 ${design.colors.border} ${design.borderRadius}`}
                  />
                </div>
                <div>
                  <Label htmlFor="description" className={design.typography.body}>Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Enter meeting description"
                    className={`mt-1 ${design.colors.border} ${design.borderRadius}`}
                  />
                </div>
                <div>
                  <Label htmlFor="type" className={design.typography.body}>Meeting Type</Label>
                  <Select>
                    <SelectTrigger className={`mt-1 ${design.colors.border} ${design.borderRadius}`}>
                      <SelectValue placeholder="Select meeting type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular Meeting</SelectItem>
                      <SelectItem value="emergency">Emergency Meeting</SelectItem>
                      <SelectItem value="review">Review Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="date" className={design.typography.body}>Date & Time</Label>
                  <Input 
                    id="date" 
                    type="datetime-local"
                    className={`mt-1 ${design.colors.border} ${design.borderRadius}`}
                  />
                </div>
                <div>
                  <Label htmlFor="duration" className={design.typography.body}>Duration</Label>
                  <Input 
                    id="duration" 
                    type="number"
                    placeholder="60"
                    className={`mt-1 ${design.colors.border} ${design.borderRadius}`}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="recording" />
                  <Label htmlFor="recording" className={design.typography.body}>Record Meeting</Label>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 