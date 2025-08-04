'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiEye, FiTrash2, FiEdit, FiRefreshCw, FiCalendar, FiUser, FiDatabase, FiActivity, FiShield, FiAlertTriangle } from 'react-icons/fi';

// Legacy audit log interface
interface LegacyAuditLog {
  id: number;
  table_name: string;
  record_id: string;
  operation: string;
  field_changes: Record<string, { old: any; new: any }> | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  description: string | null;
  source: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  User: { id: number; email: string; name: string | null } | null;
  Staff: { 
    id: number; 
    Role: { title: string }; 
    Department: { name: string } 
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
  metadata: Record<string, any> | null;
  risk_score: number;
  success: boolean;
  error_message: string | null;
  description: string | null;
  timestamp: string;
  User: { id: number; email: string; name: string | null } | null;
  Staff: { 
    id: number; 
    Role: { title: string }; 
    Department: { name: string } 
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

export default function AuditLogsClient() {
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
  const [highRiskStats, setHighRiskStats] = useState<any>(null);
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    hasMore: true
  });

  // Load audit logs
  const loadAuditLogs = async (reset: boolean = false) => {
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
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Load high-risk stats
  const loadHighRiskStats = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs/high-risk?limit=10');
      if (response.ok) {
        const data = await response.json();
        setHighRiskStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading high-risk stats:', err);
    }
  };

  // Load summary
  const loadSummary = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs/summary');
      if (!response.ok) throw new Error('Failed to fetch summary');
      
      const data = await response.json();
      setSummary(data.data);
    } catch (err) {
      console.error('Error loading summary:', err);
    }
  };

  useEffect(() => {
    loadAuditLogs(true);
    loadSummary();
    loadHighRiskStats();
  }, [filters]);

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
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      BULK_CREATE: 'bg-purple-100 text-purple-800',
      BULK_UPDATE: 'bg-indigo-100 text-indigo-800',
      BULK_DELETE: 'bg-pink-100 text-pink-800'
    };
    return colors[operation as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      AUTH: 'bg-blue-100 text-blue-800',
      SECURITY: 'bg-red-100 text-red-800',
      DATA_CRITICAL: 'bg-purple-100 text-purple-800',
      PERMISSION: 'bg-yellow-100 text-yellow-800',
      SYSTEM: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRiskBadge = (riskScore: number) => {
    if (riskScore >= 80) return 'bg-red-100 text-red-800';
    if (riskScore >= 60) return 'bg-orange-100 text-orange-800';
    if (riskScore >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getSourceBadge = (source: string) => {
    const colors = {
      WEB_UI: 'bg-blue-100 text-blue-800',
      API: 'bg-green-100 text-green-800',
      BULK_UPLOAD: 'bg-purple-100 text-purple-800',
      SYSTEM: 'bg-gray-100 text-gray-800'
    };
    return colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US');
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
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
    } catch (err) {
      setError('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {summary && (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <FiActivity className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{summary.totalLogs}</p>
                  <p className="text-gray-600">Total Logs</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <FiDatabase className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{summary.tableStats.length}</p>
                  <p className="text-gray-600">Affected Tables</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <FiUser className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{summary.topUsers.length}</p>
                  <p className="text-gray-600">Active Users</p>
                </div>
              </div>
            </div>
          </>
        )}
        
        {highRiskStats && (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <FiShield className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{highRiskStats.total}</p>
                  <p className="text-gray-600">High Risk Events</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <FiAlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">24h</p>
                  <p className="text-gray-600">Time Range</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          <div className="flex space-x-2">
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <FiRefreshCw className="h-4 w-4 mr-1 inline" />
              Reset
            </button>
            <div className="flex space-x-2">
              <button
                onClick={() => exportLogs('csv')}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                <FiDownload className="h-4 w-4 mr-1 inline" />
                Export CSV
              </button>
              <button
                onClick={() => exportLogs('json')}
                className="px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                <FiDownload className="h-4 w-4 mr-1 inline" />
                Export JSON
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Log Type</label>
            <select
              value={filters.logType}
              onChange={(e) => handleFilterChange('logType', e.target.value as 'critical' | 'legacy' | 'both')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="both">Both Types</option>
              <option value="critical">Critical Events</option>
              <option value="legacy">Legacy Audit</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
            <select
              value={filters.table}
              onChange={(e) => handleFilterChange('table', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Score</label>
            <select
              value={filters.minRiskScore}
              onChange={(e) => handleFilterChange('minRiskScore', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
            <select
              value={filters.operation}
              onChange={(e) => handleFilterChange('operation', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              placeholder="Action name..."
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              disabled={filters.logType === 'legacy'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="number"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="User ID"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
            <input
              type="number"
              value={filters.staffId}
              onChange={(e) => handleFilterChange('staffId', e.target.value)}
              placeholder="Staff ID"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              {filters.logType === 'critical' ? 'Critical Security Events' : 
               filters.logType === 'legacy' ? 'Legacy Database Audit Logs' : 
               'Hybrid Audit System - All Events'}
            </h3>
            <div className="text-sm text-gray-500">
              Showing {auditLogs.length} events
            </div>
          </div>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category/Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action/Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk/Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => {
                const isCritical = isCriticalLog(log);
                const timestamp = isCritical ? log.timestamp : log.created_at;
                return (
                  <tr key={`${isCritical ? 'critical' : 'legacy'}-${log.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isCritical ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isCritical ? 'CRITICAL' : 'LEGACY'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isCritical ? getCategoryBadge(log.category) : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isCritical ? log.category : log.table_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isCritical ? 'bg-gray-100 text-gray-800' : getOperationBadge(log.operation)
                      }`}>
                        {isCritical ? log.action : log.operation}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.User ? (
                        <div>
                          <div className="font-medium">{log.User.name || log.User.email}</div>
                          {log.Staff && (
                            <div className="text-gray-500 text-xs">
                              {log.Staff.Role.title} - {log.Staff.Department.name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isCritical ? (
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskBadge(log.risk_score)}`}>
                            Risk: {log.risk_score}
                          </span>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {isCritical ? (
                          log.error_message || log.description || 'No description'
                        ) : (
                          log.description || 'No description'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(log)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="View Details"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                      {!isCritical && log.operation !== 'DELETE' && (
                        <>
                          <button className="text-green-600 hover:text-green-900 mr-3" title="Edit">
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900" title="Delete">
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
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isCriticalLog(selectedLog) ? 'Critical Event Details' : 'Legacy Audit Log Details'}
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {isCriticalLog(selectedLog) ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <p className="text-sm text-gray-900">{selectedLog.category}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Action</label>
                      <p className="text-sm text-gray-900">{selectedLog.action}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Risk Score</label>
                      <p className="text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadge(selectedLog.risk_score)}`}>
                          {selectedLog.risk_score}/100
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Success</label>
                      <p className="text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedLog.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedLog.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedLog.timestamp)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">User/Staff ID</label>
                      <p className="text-sm text-gray-900">
                        User: {selectedLog.user_id || 'N/A'}, Staff: {selectedLog.staff_id || 'N/A'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Table</label>
                      <p className="text-sm text-gray-900">{selectedLog.table_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Operation</label>
                      <p className="text-sm text-gray-900">{selectedLog.operation}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Record ID</label>
                      <p className="text-sm text-gray-900">{selectedLog.record_id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedLog.created_at)}</p>
                    </div>
                  </>
                )}
              </div>
              
              {isCriticalLog(selectedLog) ? (
                <>
                  {selectedLog.error_message && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Error Message</label>
                      <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{selectedLog.error_message}</p>
                    </div>
                  )}
                  
                  {selectedLog.metadata && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Metadata</label>
                      <pre className="text-xs bg-gray-100 p-3 rounded mt-1 overflow-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {selectedLog.field_changes && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Field Changes</label>
                      <pre className="text-xs bg-gray-100 p-3 rounded mt-1 overflow-auto">
                        {JSON.stringify(selectedLog.field_changes, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {selectedLog.old_values && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Old Values</label>
                      <pre className="text-xs bg-gray-100 p-3 rounded mt-1 overflow-auto">
                        {JSON.stringify(selectedLog.old_values, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {selectedLog.new_values && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">New Values</label>
                      <pre className="text-xs bg-gray-100 p-3 rounded mt-1 overflow-auto">
                        {JSON.stringify(selectedLog.new_values, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">IP Address</label>
                  <p className="text-sm text-gray-900">{selectedLog.ip_address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">User Agent</label>
                  <p className="text-sm text-gray-900 truncate">{selectedLog.user_agent || 'N/A'}</p>
                </div>
              </div>
              
              {selectedLog.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedLog.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}