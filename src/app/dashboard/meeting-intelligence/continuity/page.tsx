'use client';

import { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Calendar,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Target,
  TrendingUp,
  Link2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { BackLink } from '@/components/ui/back-link';

interface MeetingChain {
  id: number;
  rootmeeting: {
    id: number;
    title: string;
    date: string;
    status: string
  };
  totalMeetings: number;
  totalAgendaItems: number;
  totalActionItems: number;
  resolvedItems: number;
  unresolvedItems: number;
  efficiency: number;
  meetings: MeetingNode[];
}

interface MeetingNode {
  id: number;
  title: string;
  date: string;
  status: string;
  parentId?: number;
  children: MeetingNode[];
  agendaItems: {
    total: number;
    resolved: number;
    carriedForward: number
  };
  actionItems: {
    total: number;
    completed: number;
    pending: number;
    overdue: number
  };
  attendeeCount: number;
  duration: number
}

interface ContinuityStats {
  totalChains: number;
  averageChainLength: number;
  longestChain: number;
  totalCarriedItems: number;
  resolutionRate: number;
  averageResolutionTime: number
}

export default function MeetingContinuityPage() {
  const [chains, setChains] = useState<MeetingChain[]>([]);
  const [stats, setStats] = useState<ContinuityStats | null>(null);
  const [expandedChains, setExpandedChains] = useState<Set<number>>(new Set());
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [selectedChain, setSelectedChain] = useState<MeetingChain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'timeline'>('tree');

  useEffect(() => {
    fetchContinuityData();
  }, []);

  const fetchContinuityData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/meeting-intelligence/continuity');
      const data = await response.json();
      
      setChains(data.chains ?? []);
      setStats(data.stats ?? null);
      
      // Auto-expand first chain
      if (data.chains && data.chains.length > 0) {
        setExpandedChains(new Set([data.chains[0].id]));
      }
    } catch (error: unknown) {
      console.error('Failed to fetch continuity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChain = (chainId: number) => {
    const newExpanded = new Set(expandedChains);
    if (newExpanded.has(chainId)) {
      newExpanded.delete(chainId);
    } else {
      newExpanded.add(chainId);
    }
    setExpandedChains(newExpanded);
  };

  const toggleNode = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'scheduled': return <Calendar className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  };

  const renderMeetingNode = (node: MeetingNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    
    return (
      <div key={node.id} className={`${depth > 0 ? 'ml-8' : ''}`}>
        <div className="flex items-start gap-3 p-4 border border-border rounded-lg mb-2 hover:bg-muted/50 transition-colors">
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="mt-1 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(node.status)}
              <Link 
                href={`/dashboard/meetings/${node.id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {node.title}
              </Link>
              <span className="text-sm text-muted-foreground">
                {new Date(node.date).toLocaleDateString()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Agenda Items:</span>
                <div className="font-medium">
                  {node.agendaItems.resolved}/{node.agendaItems.total} resolved
                  {node.agendaItems.carriedForward > 0 && (
                    <span className="text-orange-600 ml-1">
                      ({node.agendaItems.carriedForward} carried)
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground">Action Items:</span>
                <div className="font-medium">
                  {node.actionItems.completed}/{node.actionItems.total} completed
                  {node.actionItems.overdue > 0 && (
                    <span className="text-red-600 ml-1">
                      ({node.actionItems.overdue} overdue)
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground">Attendees:</span>
                <div className="font-medium flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {node.attendeeCount}
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <div className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {node.duration} min
                </div>
              </div>
            </div>
            
            {node.parentId && (
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                Continuation meeting
              </div>
            )}
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            {node.children.map(child => renderMeetingNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderTimelineView = (chain: MeetingChain) => {
    const flattenMeetings = (node: MeetingNode): MeetingNode[] => {
      return [node, ...node.children.flatMap(flattenMeetings)];
    };
    
    const allMeetings = chain.meetings.flatMap(flattenMeetings);
    allMeetings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return (
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />
        {allMeetings.map((meeting, index) => (
          <div key={meeting.id} className="flex gap-4 mb-6">
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-background" />
              {index < allMeetings.length - 1 && (
                <ArrowRight className="absolute top-8 left-0 h-4 w-4 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 pb-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(meeting.status)}
                  <Link 
                    href={`/dashboard/meetings/${meeting.id}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {meeting.title}
                  </Link>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {new Date(meeting.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {meeting.agendaItems.total} agenda items
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {meeting.actionItems.total} action items
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {meeting.attendeeCount} attendees
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <GitBranch className="h-8 w-8 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading meeting chains...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackLink href="/dashboard/meeting-intelligence" label="Return to Meeting Intelligence" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Meeting Continuity
        </h1>
        <p className="text-muted-foreground">
          Visualize meeting chains and track agenda progression
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">{stats.totalChains}</div>
            <p className="text-sm text-muted-foreground">Meeting Chains</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">
              {stats.averageChainLength.toFixed(1)}
            </div>
            <p className="text-sm text-muted-foreground">Avg Chain Length</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">{stats.longestChain}</div>
            <p className="text-sm text-muted-foreground">Longest Chain</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">{stats.totalCarriedItems}</div>
            <p className="text-sm text-muted-foreground">Carried Items</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">{stats.resolutionRate}%</div>
            <p className="text-sm text-muted-foreground">Resolution Rate</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">
              {stats.averageResolutionTime} days
            </div>
            <p className="text-sm text-muted-foreground">Avg Resolution</p>
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">View Mode:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                viewMode === 'tree' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Tree View
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                viewMode === 'timeline' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Timeline View
            </button>
          </div>
        </div>
      </div>

      {/* Meeting Chains */}
      <div className="space-y-6">
        {chains.map((chain) => {
          const isExpanded = expandedChains.has(chain.id);
          const efficiencyColor = chain.efficiency >= 80 ? 'text-green-600' :
                                 chain.efficiency >= 60 ? 'text-yellow-600' : 'text-red-600';
          
          return (
            <div key={chain.id} className="bg-card border border-border rounded-lg">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleChain(chain.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>
                    
                    <GitBranch className="h-5 w-5 text-primary" />
                    
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {chain.rootmeeting.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Started {new Date(chain.rootmeeting.date).toLocaleDateString()}
                        {' • '}{chain.totalMeetings} meetings in chain
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-foreground">{chain.totalAgendaItems}</div>
                      <div className="text-muted-foreground">Agenda Items</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground">{chain.totalActionItems}</div>
                      <div className="text-muted-foreground">Action Items</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{chain.resolvedItems}</div>
                      <div className="text-muted-foreground">Resolved</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-orange-600">{chain.unresolvedItems}</div>
                      <div className="text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-semibold ${efficiencyColor}`}>
                        {chain.efficiency}%
                      </div>
                      <div className="text-muted-foreground">Efficiency</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {isExpanded && (
                <div className="p-6">
                  {viewMode === 'tree' ? (
                    <div className="space-y-2">
                      {chain.meetings.map(meeting => renderMeetingNode(meeting))}
                    </div>
                  ) : (
                    renderTimelineView(chain)
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {chains.length === 0 && (
          <div className="text-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No meeting chains found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Meeting chains are created when meetings have continuation relationships
            </p>
          </div>
        )}
      </div>
    </div>
  );
}