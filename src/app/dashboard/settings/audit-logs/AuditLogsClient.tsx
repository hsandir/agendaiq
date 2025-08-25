'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download as FiDownload, Eye as FiEye, Trash2 as FiTrash2, Edit as FiEdit, RefreshCw as FiRefreshCw, users as Fiusers, Database as FiDatabase, Activity as FiActivity, Shield as FiShield, AlertTriangle as FiAlertTriangle } from 'lucide-react';
import { isrole, RoleKey } from '@/lib/auth/policy';
import type { UserWithstaff, SessionUser } from '@/types/auth';

// User interface for authentication context
interface AuthUser {
  id: number;
  email: string;
  name?: string;
  is_school_admin?: boolean;
  staff?: {
    id: number;
    role: {
      id: number;  // Role ID from database
      key?: string;  // Legacy RoleKey - optional
      label: string;
      priority: number;
      is_leadership: boolean;
    };
    department: {
      name: string;
    };
  };
}

// Component props interface
interface AuditLogsClientProps {
  user: AuthUser;
}

// Enhanced error handling types
enum ErrorCategory {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION', 
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT'
}

interface AuditError {
  category: ErrorCategory;
  message: string;
  code?: string;
  details?: string;
}

// Error categorization helper
const categorizeError = (error: unknown, context: string): AuditError => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
      return {
        category: ErrorCategory.NETWORK,
        message: `Network error while ${context}`,
        details: error.message
      };
    }
    
    // Authentication errors
    if (message.includes('unauthorized') || message.includes('token')) {
      return {
        category: ErrorCategory.AUTHENTICATION,
        message: `Authentication required for ${context}`,
        details: error.message
      };
    }
    
    // Authorization errors
    if (message.includes('forbidden') || message.includes('access denied')) {
      return {
        category: ErrorCategory.AUTHORIZATION,
        message: `Access denied for ${context}`,
        details: error.message
      };
    }
    
    // Server errors
    if (message.includes('500') || message.includes('internal server')) {
      return {
        category: ErrorCategory.SERVER,
        message: `Server error while ${context}`,
        details: error.message
      };
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return {
        category: ErrorCategory.VALIDATION,
        message: `Invalid data for ${context}`,
        details: error.message
      };
    }
    
    // Default to client error
    return {
      category: ErrorCategory.CLIENT,
      message: `Error ${context}`,
      details: error.message
    };
  }
  
  return {
    category: ErrorCategory.CLIENT,
    message: `Unknown error ${context}`,
    details: String(error)
  };
};

// Define safe types for audit data
type AuditFieldValue = string | number | boolean | null | undefined;
type AuditRecord = Record<string, AuditFieldValue>;
type FieldChange = { old: AuditFieldValue; new: AuditFieldValue };

// Legacy audit log interface
interface LegacyAuditLog {
  id: number;
  table_name: string;
  record_id: string;
  operation: string;
  field_changes: Record<string, FieldChange> | null;
  old_values: AuditRecord | null;
  new_values: AuditRecord | null;
  description: string | null;
  source: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  users: { id: number; email: string; name: string | null } | null;
  staff: { 
    id: number; 
    role: { label: string }; 
    department: { name: string } 
  } | null;
}

// Critical audit log interface
interface CriticalAuditLog {
  id: number;
  category: string;
  action: string;
  user_id: number | null;
  staff_id: number | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: AuditRecord | null;
  risk_score: number;
  success: boolean;
  error_message: string | null;
  description: string | null;
  timestamp: string;
  users: { id: number; email: string; name: string | null } | null;
  staff: { 
    id: number; 
    role: { label: string }; 
    department: { name: string } 
  } | null;
}

type AuditLog = LegacyAuditLog | CriticalAuditLog;

// Type guards
function isCriticalLog(log: AuditLog): log is CriticalAuditLog {
  return 'category' in log && 'risk_score' in log;
}

function isLegacyLog(log: AuditLog): log is LegacyAuditLog {
  return 'table_name' in log && 'operation' in log;
}

interface AuditSummary {
  totalLogs: number;
  operationStats: { operation: string; count: number }[];
  tableStats: { table: string; count: number }[];
  topUsers: { userId: number; count: number }[];
}

interface HighRiskStats {
  total: number;
  riskScoreDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  userDistribution: Record<string, number>;
  ipDistribution: Record<string, number>;
  timeRange: {
    from: string;
    to: string;
  };
}

interface Filters {
  logType: 'critical' | 'legacy' | 'both';
  table: string;
  operation: string;
  category: string;
  action: string;
  userId: string;
  staffId: string;
  startDate: string;
  endDate: string;
  minRiskScore: string;
  success: string;
  search: string;
}

export default function AuditLogsClient({ user }: AuditLogsClientProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    logType: 'both',
    table: '',
    operation: '',
    category: '',
    action: '',
    userId: '',
    staffId: '',
    startDate: '',
    endDate: '',
    minRiskScore: '',
    success: '',
    search: ''
  });
  const [highRiskStats, setHighRiskStats] = useState<HighRiskStats | null>(null);
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    hasMore: true
  });

  // Load audit logs
  const loadAuditLogs = useCallback(async (reset: boolean = false) => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      queryParams.set('type', filters.logType);
      if (filters.table) queryParams.set('table', filters.table);
      if (filters.operation) queryParams.set('operation', filters.operation);
      if (filters.category) queryParams.set('category', filters.category);
      if (filters.action) queryParams.set('action', filters.action);
      if (filters.userId) queryParams.set('userId', filters.userId);
      if (filters.staffId) queryParams.set('staffId', filters.staffId);
      if (filters.startDate) queryParams.set('startDate', filters.startDate);
      if (filters.endDate) queryParams.set('endDate', filters.endDate);
      if (filters.minRiskScore) queryParams.set('minRiskScore', filters.minRiskScore);
      if (filters.success) queryParams.set('success', filters.success);
      
      queryParams.set('limit', pagination.limit.toString());
      queryParams.set('page', reset ? '1' : Math.floor(pagination.offset / pagination.limit + 1).toString());

      const response = await fetch(`/api/admin/audit-logs?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      
      const data = await response.json();
      
      let logs: AuditLog[] = [];
      if (data.type === 'both') {
        logs = [...data.data.critical, ...data.data.legacy];
        // Sort by timestamp/created_at
        logs.sort((a, b) => {
          const timeA = new Date(isCriticalLog(a) ? a.timestamp : a.created_at).getTime();
          const timeB = new Date(isCriticalLog(b) ? b.timestamp : b.created_at).getTime();
          return timeB - timeA;
        });
      } else {
        logs = data.data;
      }
      
      if (reset) {
        setAuditLogs(logs);
        setPagination({ ...pagination, offset: 0, hasMore: data.pagination.hasMore });
      } else {
        setAuditLogs(prev => [...prev, ...logs]);
        setPagination(prev => ({ 
          ...prev, 
          offset: prev.offset + prev.limit, 
          hasMore: data.pagination.hasMore 
        }));
      }
      
    } catch (err: unknown) {
      const auditError = categorizeError(err, 'loading audit logs');
      console.error(`[${auditError.category}] ${auditError.message}:`, auditError.details);
      setError(`${auditError.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, pagination.offset]);

  // Load high-risk stats
  const loadHighRiskStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/audit-logs/high-risk?limit=10');
      if (response.ok) {
        const data = await response.json();
        setHighRiskStats(data.stats);
      }
    } catch (err: unknown) {
      const auditError = categorizeError(err, 'loading high-risk statistics');
      console.error(`[${auditError.category}] ${auditError.message}:`, auditError.details);
    }
  }, []);

  // Load summary
  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/audit-logs/summary');
      if (!response.ok) throw new Error('Failed to fetch summary');
      
      const data = await response.json();
      setSummary(data.data);
    } catch (err: unknown) {
      const auditError = categorizeError(err, 'loading audit summary');
      console.error(`[${auditError.category}] ${auditError.message}:`, auditError.details);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs(true);
    loadSummary();
    loadHighRiskStats();
  }, [filters, loadAuditLogs, loadSummary, loadHighRiskStats]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const resetFilters = () => {
    setFilters({
      logType: 'both',
      table: '',
      operation: '',
      category: '',
      action: '',
      userId: '',
      staffId: '',
      startDate: '',
      endDate: '',
      minRiskScore: '',
      success: '',
      search: ''
    });
  };

  const getOperationBadge = (operation: string) => {
    const colors = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-primary text-primary-foreground',
      DELETE: 'bg-destructive/10 text-destructive',
      BULK_CREATE: 'bg-secondary text-secondary',
      BULK_UPDATE: 'bg-primary text-primary-foreground',
      BULK_DELETE: 'bg-pink-100 text-pink-800'
    };
    return colors[operation as keyof typeof colors] || 'bg-muted text-foreground';
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      AUTH: 'bg-primary text-primary-foreground',
      SECURITY: 'bg-destructive/10 text-destructive',
      DATA_CRITICAL: 'bg-secondary text-secondary',
      PERMISSION: 'bg-yellow-100 text-yellow-800',
      SYSTEM: 'bg-muted text-foreground'
    };
    return colors[category as keyof typeof colors] || 'bg-muted text-foreground';
  };

  const getRiskBadge = (riskScore: number) => {
    if (riskScore >= 80) return 'bg-destructive/10 text-destructive';
    if (riskScore >= 60) return 'bg-orange-100 text-orange-800';
    if (riskScore >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getSourceBadge = (source: string) => {
    const colors = {
      WEB_UI: 'bg-primary text-primary-foreground',
      API: 'bg-green-100 text-green-800',
      BULK_UPLOAD: 'bg-secondary text-secondary',
      SYSTEM: 'bg-muted text-foreground'
    };
    return colors[source as keyof typeof colors] || 'bg-muted text-foreground';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US');
  };

  // Permission validation helper
  const canViewAuditDetails = useCallback((log: AuditLog): boolean => {
    // Ops Admin can view all logs
    if ((user as Record<string, unknown>).is_school_admin || isRole(user as any, RoleKey.OPS_ADMIN)) {
      return true;
    }

    // Leadership can view logs from their own organization
    if (user.staff?.role?.is_leadership) {
      // Can view logs from same user or their own staff actions
      if (isCriticalLog(log)) {
        return log.user_id === user.id ?? log.staff_id === user.staff.id;
      } else {
        // For legacy logs, check the User/Staff relations
        return log.users?.id === user.id ?? log.staff?.id === user.staff.id;
      }
    }

    // Regular staff can only view their own audit logs
    if (isCriticalLog(log)) {
      return log.user_id === user.id ?? log.staff_id === user.staff?.id;
    } else {
      // For legacy logs, check the User/Staff relations
      return log.users?.id === user.id ?? log.staff?.id === user.staff?.id;
    }
  }, [user]);

  const handleViewDetails = (log: AuditLog) => {
    // Security validation: Check permissions before viewing details
    if (!canViewAuditDetails(log)) {
      setError('Access denied: You do not have permission to view this audit log.');
      return;
    }

    setSelectedLog(log);
    setShowDetails(true);
    setError(''); // Clear any previous errors
  };

  const exportLogs = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('format', format);
      queryParams.set('type', filters.logType);
      if (filters.table) queryParams.set('table', filters.table);
      if (filters.operation) queryParams.set('operation', filters.operation);
      if (filters.category) queryParams.set('category', filters.category);
      if (filters.userId) queryParams.set('userId', filters.userId);
      if (filters.staffId) queryParams.set('staffId', filters.staffId);
      if (filters.startDate) queryParams.set('startDate', filters.startDate);
      if (filters.endDate) queryParams.set('endDate', filters.endDate);
      queryParams.set('maxRecords', '10000');

      const response = await fetch(`/api/admin/audit-logs/export?${queryParams}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 
                      `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const auditError = categorizeError(err, 'exporting audit logs');
      console.error(`[${auditError.category}] ${auditError.message}:`, auditError.details);
      setError(`Export failed: ${auditError.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {summary && (
          <>
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <FiActivity className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-foreground">{summary.totalLogs}</p>
                  <p className="text-muted-foreground">Total Logs</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <FiDatabase className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-foreground">{summary.tableStats.length}</p>
                  <p className="text-muted-foreground">Affected Tables</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <FiUser className="h-8 w-8 text-secondary" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-foreground">{summary.topUsers.length}</p>
                  <p className="text-muted-foreground">Active Users</p>
                </div>
              </div>
            </div>
          </>
        )}
        
        {highRiskStats && (
          <>
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <FiShield className="h-8 w-8 text-destructive" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-foreground">{highRiskStats.total}</p>
                  <p className="text-muted-foreground">High Risk Events</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <FiAlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-foreground">24h</p>
                  <p className="text-muted-foreground">Time Range</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">Filters</h3>
          <div className="flex space-x-2">
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted"
            >
              <FiRefreshCw className="h-4 w-4 mr-1 inline" />
              Reset
            </button>
            <div className="flex space-x-2">
              <button
                onClick={() => exportLogs('csv')}
                className="px-3 py-2 text-sm font-medium text-foreground bg-primary border border-transparent rounded-md hover:bg-primary"
              >
                <FiDownload className="h-4 w-4 mr-1 inline" />
                Export CSV
              </button>
              <button
                onClick={() => exportLogs('json')}
                className="px-3 py-2 text-sm font-medium text-foreground bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                <FiDownload className="h-4 w-4 mr-1 inline" />
                Export JSON
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Log Type</label>
            <select
              value={filters.logType}
              onChange={(e) => handleFilterChange('logType', e.target.value as 'critical' | 'legacy' | 'both')}
              className="w-full border border-border rounded-md px-3 py-2"
            >
              <option value="both">Both Types</option>
              <option value="critical">Critical Events</option>
              <option value="legacy">Legacy Audit</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2"
              disabled={filters.logType === 'legacy'}
            >
              <option value="">All Categories</option>
              <option value="AUTH">Authentication</option>
              <option value="SECURITY">Security</option>
              <option value="DATA_CRITICAL">Data Critical</option>
              <option value="PERMISSION">Permission</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Table</label>
            <select
              value={filters.table}
              onChange={(e) => handleFilterChange('table', e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2"
              disabled={filters.logType === 'critical'}
            >
              <option value="">All Tables</option>
              <option value="users">Users</option>
              <option value="staff">Staff</option>
              <option value="roles">Roles</option>
              <option value="meetings">Meetings</option>
              <option value="departments">Departments</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Risk Score</label>
            <select
              value={filters.minRiskScore}
              onChange={(e) => handleFilterChange('minRiskScore', e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2"
              disabled={filters.logType === 'legacy'}
            >
              <option value="">Any Risk</option>
              <option value="80">High Risk (80+)</option>
              <option value="60">Medium Risk (60+)</option>
              <option value="40">Low Risk (40+)</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Operation</label>
            <select
              value={filters.operation}
              onChange={(e) => handleFilterChange('operation', e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2"
              disabled={filters.logType === 'critical'}
            >
              <option value="">All Operations</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="BULK_CREATE">Bulk Create</option>
              <option value="BULK_UPDATE">Bulk Update</option>
              <option value="BULK_DELETE">Bulk Delete</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Action</label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              placeholder="Action name..."
              className="w-full border border-border rounded-md px-3 py-2"
              disabled={filters.logType === 'legacy'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">User ID</label>
            <input
              type="number"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="User ID"
              className="w-full border border-border rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Staff ID</label>
            <input
              type="number"
              value={filters.staffId}
              onChange={(e) => handleFilterChange('staffId', e.target.value)}
              placeholder="Staff ID"
              className="w-full border border-border rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-card shadow-sm border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-foreground">
              {filters.logType === 'critical' ? 'Critical Security Events' : 
               filters.logType === 'legacy' ? 'Legacy Database Audit Logs' : 
               'Hybrid Audit System - All Events'}
            </h3>
            <div className="text-sm text-muted-foreground">
              Showing {auditLogs.length} events
            </div>
          </div>
        </div>
        
        {error && (
          <div className="p-4 bg-destructive/10 border-l-4 border-destructive">
            <p className="text-destructive">{error}</p>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category/Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Action/Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Risk/Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {auditLogs.map((log) => {
                const isCritical = isCriticalLog(log);
                const timestamp = isCritical ? log.timestamp : log.created_at;
                return (
                  <tr key={`${isCritical ? 'critical' : 'legacy'}-${log.id}`} className="hover:bg-muted">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {formatDate(timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isCritical ? 'bg-destructive/10 text-destructive' : 'bg-primary text-primary-foreground'
                      }`}>
                        {isCritical ? 'CRITICAL' : 'LEGACY'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isCritical ? getCategoryBadge(log.category) : 'bg-muted text-foreground'
                      }`}>
                        {isCritical ? log.category : log.table_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isCritical ? 'bg-muted text-foreground' : getOperationBadge(log.operation)
                      }`}>
                        {isCritical ? log.action : log.operation}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {log.users ? (
                        <div>
                          <div className="font-medium">{log.users.name ?? log.users.email}</div>
                          {log.staff && (
                            <div className="text-muted-foreground text-xs">
                              {log.staff.role.title} - {log.staff.department.name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isCritical ? (
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskBadge(log.risk_score)}`}>
                            Risk: {log.risk_score}
                          </span>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            log.success ? 'bg-green-100 text-green-800' : 'bg-destructive/10 text-destructive'
                          }`}>
                            {log.success ? 'SUCCESS' : 'FAILED'}
                          </span>
                        </div>
                      ) : (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSourceBadge(log.source)}`}>
                          {log.source}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="max-w-xs truncate">
                        {isCritical ? (
                          log.error_message ?? (log.description || 'No description')
                        ) : (
                          log.description || 'No description'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {canViewAuditDetails(log) ? (
                        <button
                          onClick={() => handleViewDetails(log)}
                          className="text-primary hover:text-primary mr-3"
                          title="View Details"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="text-muted-foreground mr-3 cursor-not-allowed"
                          title="Access Denied: Insufficient permissions"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                      )}
                      {!isCritical && log.operation !== 'DELETE' && (
                        <>
                          <button className="text-green-600 hover:text-green-900 mr-3" title="Edit">
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button className="text-destructive hover:text-destructive" title="Delete">
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {loading && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center">
              <FiRefreshCw className="animate-spin h-5 w-5 mr-2" />
              Loading...
            </div>
          </div>
        )}
        
        {pagination.hasMore && !loading && (
          <div className="p-4 text-center border-t">
            <button
              onClick={() => loadAuditLogs(false)}
              className="px-4 py-2 text-sm font-medium text-primary bg-card border border-blue-600 rounded-md hover:bg-primary"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-background bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-foreground">
                {isCriticalLog(selectedLog) ? 'Critical Event Details' : 'Legacy Audit Log Details'}
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-muted-foreground hover:text-muted-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {isCriticalLog(selectedLog) ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground">Category</label>
                      <p className="text-sm text-foreground">{selectedLog.category}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Action</label>
                      <p className="text-sm text-foreground">{selectedLog.action}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Risk Score</label>
                      <p className="text-sm text-foreground">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadge(selectedLog.risk_score)}`}>
                          {selectedLog.risk_score}/100
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Success</label>
                      <p className="text-sm text-foreground">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedLog.success ? 'bg-green-100 text-green-800' : 'bg-destructive/10 text-destructive'
                        }`}>
                          {selectedLog.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Date</label>
                      <p className="text-sm text-foreground">{formatDate(selectedLog.timestamp)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">User/Staff ID</label>
                      <p className="text-sm text-foreground">
                        users: {selectedLog.user_id || 'N/A'}, staff: {selectedLog.staff_id || 'N/A'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground">Table</label>
                      <p className="text-sm text-foreground">{selectedLog.table_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Operation</label>
                      <p className="text-sm text-foreground">{selectedLog.operation}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Record ID</label>
                      <p className="text-sm text-foreground">{selectedLog.record_id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Date</label>
                      <p className="text-sm text-foreground">{formatDate(selectedLog.created_at)}</p>
                    </div>
                  </>
                )}
              </div>
              
              {isCriticalLog(selectedLog) ? (
                <>
                  {selectedLog.error_message && (
                    <div>
                      <label className="text-sm font-medium text-foreground">Error Message</label>
                      <p className="text-sm text-destructive bg-destructive/10 p-3 rounded">{selectedLog.error_message}</p>
                    </div>
                  )}
                  
                  {selectedLog.metadata && (
                    <div>
                      <label className="text-sm font-medium text-foreground">Metadata</label>
                      <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {selectedLog.field_changes && (
                    <div>
                      <label className="text-sm font-medium text-foreground">Field Changes</label>
                      <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto">
                        {JSON.stringify(selectedLog.field_changes, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {selectedLog.old_values && (
                    <div>
                      <label className="text-sm font-medium text-foreground">Old Values</label>
                      <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto">
                        {JSON.stringify(selectedLog.old_values, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {selectedLog.new_values && (
                    <div>
                      <label className="text-sm font-medium text-foreground">New Values</label>
                      <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto">
                        {JSON.stringify(selectedLog.new_values, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">IP Address</label>
                  <p className="text-sm text-foreground">{selectedLog.ip_address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">User Agent</label>
                  <p className="text-sm text-foreground truncate">{selectedLog.user_agent || 'N/A'}</p>
                </div>
              </div>
              
              {selectedLog.description && (
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <p className="text-sm text-foreground bg-muted p-3 rounded">{selectedLog.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}