'use client';

import { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  Calendar,
  User,
  Filter,
  ChevronRight,
  Target,
  TrendingUp,
  X,
  Edit2,
  CheckCircle,
  XCircle,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

interface ActionItem {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  assignedRole: {
    id: number;
    title: string;
  };
  assignedStaff?: {
    id: number;
    name: string;
    email: string;
  };
  meeting: {
    id: number;
    title: string;
    date: string;
  };
  carriedForwardCount: number;
  parentItemId?: number;
  childItems?: ActionItem[];
}

interface ActionItemStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  completionRate: number;
  avgCompletionTime: number;
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
}

export default function ActionItemsTrackingPage() {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [stats, setStats] = useState<ActionItemStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'my' | 'team' | 'overdue'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ActionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActionItems();
  }, [filter, statusFilter, priorityFilter]);

  const fetchActionItems = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        filter,
        status: statusFilter,
        priority: priorityFilter
      });
      
      const response = await fetch(`/api/meeting-intelligence/action-items?${params}`);
      const data = await response.json();
      
      setActionItems(data.items || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Failed to fetch action items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemStatus = async (itemId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/meeting-intelligence/action-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchActionItems();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CheckSquare className="h-8 w-8 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading action items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Action Items Tracking
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage action items across all meetings
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{stats.total}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Items</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold text-foreground">{stats.pending}</span>
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-foreground">{stats.inProgress}</span>
            </div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-foreground">{stats.completed}</span>
            </div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-foreground">{stats.overdue}</span>
            </div>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilter('my')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'my' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              My Items
            </button>
            <button
              onClick={() => setFilter('team')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'team' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Team Items
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'overdue' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Overdue
            </button>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-4">
        {actionItems.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  {getStatusIcon(item.status)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg mb-1">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-muted-foreground text-sm mb-3">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-3 mb-3">
                      <span className={`px-2 py-1 rounded text-xs border ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {item.carriedForwardCount > 0 && (
                        <span className="px-2 py-1 rounded text-xs bg-orange-50 text-orange-600 flex items-center gap-1">
                          <RotateCcw className="h-3 w-3" />
                          Carried forward {item.carriedForwardCount}x
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Role: {item.assignedRole.title}</span>
                        {item.assignedStaff && (
                          <span className="ml-1">({item.assignedStaff.name})</span>
                        )}
                      </div>
                      
                      {item.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      <Link 
                        href={`/dashboard/meetings/${item.meeting.id}`}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <span>From: {item.meeting.title}</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                {item.status === 'pending' && (
                  <button
                    onClick={() => updateItemStatus(item.id, 'in_progress')}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Start
                  </button>
                )}
                {item.status === 'in_progress' && (
                  <button
                    onClick={() => updateItemStatus(item.id, 'completed')}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Complete
                  </button>
                )}
                <button
                  onClick={() => setSelectedItem(item)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Child Items */}
            {item.childItems && item.childItems.length > 0 && (
              <div className="mt-4 pl-8 border-l-2 border-border">
                <p className="text-xs text-muted-foreground mb-2">Sub-tasks:</p>
                <div className="space-y-2">
                  {item.childItems.map((child) => (
                    <div key={child.id} className="flex items-center gap-2 text-sm">
                      {getStatusIcon(child.status)}
                      <span className="text-foreground">{child.title}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(child.status)}`}>
                        {child.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {actionItems.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No action items found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your filters or create new action items in meetings
            </p>
          </div>
        )}
      </div>

      {/* Priority Distribution */}
      {stats && stats.total > 0 && (
        <div className="mt-8 bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Priority Distribution
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.byPriority.urgent}</div>
              <p className="text-sm text-muted-foreground">Urgent</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.byPriority.high}</div>
              <p className="text-sm text-muted-foreground">High</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.byPriority.medium}</div>
              <p className="text-sm text-muted-foreground">Medium</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">{stats.byPriority.low}</div>
              <p className="text-sm text-muted-foreground">Low</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}