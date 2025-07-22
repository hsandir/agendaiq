'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiEye, FiTrash2, FiEdit, FiRefreshCw, FiCalendar, FiUser, FiDatabase, FiActivity } from 'react-icons/fi';

interface AuditLog {
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

interface AuditSummary {
  totalLogs: number;
  operationStats: { operation: string; count: number }[];
  tableStats: { table: string; count: number }[];
  topUsers: { userId: number; count: number }[];
}

interface Filters {
  table: string;
  operation: string;
  userId: string;
  startDate: string;
  endDate: string;
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
    table: '',
    operation: '',
    userId: '',
    startDate: '',
    endDate: '',
    search: ''
  });
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
      if (filters.table) queryParams.set('table', filters.table);
      if (filters.operation) queryParams.set('operation', filters.operation);
      if (filters.userId) queryParams.set('userId', filters.userId);
      if (filters.startDate) queryParams.set('startDate', filters.startDate);
      if (filters.endDate) queryParams.set('endDate', filters.endDate);
      
      queryParams.set('limit', pagination.limit.toString());
      queryParams.set('offset', reset ? '0' : pagination.offset.toString());

      const response = await fetch(`/api/admin/audit-logs?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      
      const data = await response.json();
      
      if (reset) {
        setAuditLogs(data.data);
        setPagination({ ...pagination, offset: 0, hasMore: data.pagination.hasMore });
      } else {
        setAuditLogs(prev => [...prev, ...data.data]);
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
  }, [filters]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const resetFilters = () => {
    setFilters({
      table: '',
      operation: '',
      userId: '',
      startDate: '',
      endDate: '',
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
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const exportLogs = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.table) queryParams.set('table', filters.table);
      if (filters.operation) queryParams.set('operation', filters.operation);
      if (filters.startDate) queryParams.set('startDate', filters.startDate);
      if (filters.endDate) queryParams.set('endDate', filters.endDate);
      queryParams.set('limit', '10000'); // Export all

      const response = await fetch(`/api/admin/audit-logs?${queryParams}`);
      const data = await response.json();
      
      // Convert to CSV
      const csv = [
        ['Date', 'Table', 'Operation', 'User', 'Description', 'IP Address'].join(','),
        ...data.data.map((log: AuditLog) => [
          formatDate(log.created_at),
          log.table_name,
          log.operation,
          log.User?.email || 'System',
          log.description || '',
          log.ip_address || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <FiCalendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">30</p>
                <p className="text-gray-600">Day Report</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <button
              onClick={exportLogs}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              <FiDownload className="h-4 w-4 mr-1 inline" />
              Export
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
            <select
              value={filters.table}
              onChange={(e) => handleFilterChange('table', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All</option>
              <option value="users">Users</option>
              <option value="staff">Staff</option>
              <option value="roles">Roles</option>
              <option value="meetings">Meetings</option>
              <option value="departments">Departments</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
            <select
              value={filters.operation}
              onChange={(e) => handleFilterChange('operation', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="BULK_CREATE">Bulk Create</option>
              <option value="BULK_UPDATE">Bulk Update</option>
              <option value="BULK_DELETE">Bulk Delete</option>
            </select>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search description..."
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Database Audit Logs</h3>
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
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {log.table_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOperationBadge(log.operation)}`}>
                      {log.operation}
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
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {log.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSourceBadge(log.source)}`}>
                      {log.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(log)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <FiEye className="h-4 w-4" />
                    </button>
                    {log.operation !== 'DELETE' && (
                      <>
                        <button className="text-green-600 hover:text-green-900 mr-3">
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
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
              <h3 className="text-lg font-medium text-gray-900">Audit Log Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 