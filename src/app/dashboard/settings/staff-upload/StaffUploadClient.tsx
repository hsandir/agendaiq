'use client';

import { useState } from 'react';
import { FiUpload, FiDownload, FiAlertCircle, FiCheck, FiEye, FiSave, FiUsers, FiFileText, FiEdit, FiTrash2, FiRefreshCw } from 'react-icons/fi';

interface ConflictItem {
  field: string;
  existing: any;
  new: any;
  action: string;
}

interface ActionItem {
  id: string;
  label: string;
  type: string;
}

interface ExistingData {
  name: string;
  staffId: string;
  role: string;
  department: string;
}

interface ProcessedRecord {
  rowNumber: number;
  email: string;
  name: string;
  staffId: string;
  role: string;
  department: string;
  errors: string[];
  warnings: string[];
  status: 'create' | 'update' | 'unknown';
  existingData: ExistingData | null;
  conflicts: ConflictItem[];
  canUpload: boolean;
  actions: ActionItem[];
}

interface PreviewSummary {
  total: number;
  valid: number;
  conflicts: number;
  errors: number;
}

export default function StaffUploadClient() {
  // State variables
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewData, setPreviewData] = useState<ProcessedRecord[]>([]);
  const [previewSummary, setPreviewSummary] = useState<PreviewSummary | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedRecords, setSelectedRecords] = new Set());
  const [recordActions, setRecordActions] = useState<Map<number, string>>(new Map());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.type === 'application/vnd.ms-excel')) {
      setFile(selectedFile);
      setError('');
      setPreviewData([]);
      setPreviewSummary(null);
      setValidationErrors([]);
      setShowPreview(false);
      setSelectedRecords(new Set());
      setRecordActions(new Map());
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'preview');

      const response = await fetch('/api/staff/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Preview failed');
      }

      setPreviewData(data.preview || []);
      setPreviewSummary(data.summary || null);
      setValidationErrors(data.validationErrors || []);
      setShowPreview(true);
      
      // Auto-select all valid records
      const validRowNumbers = data.preview.filter((r: ProcessedRecord) => r.canUpload).map((r: ProcessedRecord) => r.rowNumber);
      setSelectedRecords(new Set(validRowNumbers));

      setSuccess(`Preview completed! Found ${data.summary?.total || 0} records - ${data.summary?.valid || 0} valid, ${data.summary?.conflicts || 0} with issues.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Preview failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file || previewData.length === 0) {
      setError('Please preview the file first');
      return;
    }

    if (selectedRecords.size === 0) {
      setError('Please select at least one record to upload');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'upload');
      formData.append('selectedRows', JSON.stringify(Array.from(selectedRecords)));
      formData.append('actions', JSON.stringify(Object.fromEntries(recordActions)));

      const response = await fetch('/api/staff/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess(`Upload completed successfully! ${data.created || 0} staff created, ${data.updated || 0} staff updated.`);
      setFile(null);
      setPreviewData([]);
      setPreviewSummary(null);
      setValidationErrors([]);
      setShowPreview(false);
      setSelectedRecords(new Set());
      setRecordActions(new Map());
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecordSelection = (rowNumber: number) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(rowNumber)) {
      newSelected.delete(rowNumber);
    } else {
      newSelected.add(rowNumber);
    }
    setSelectedRecords(newSelected);
  };

  const selectAllValid = () => {
    const validRowNumbers = previewData.filter(r => r.canUpload).map(r => r.rowNumber);
    setSelectedRecords(new Set(validRowNumbers));
  };

  const selectNone = () => {
    setSelectedRecords(new Set());
  };

  const setRecordAction = (rowNumber: number, action: string) => {
    const newActions = new Map(recordActions);
    newActions.set(rowNumber, action);
    setRecordActions(newActions);
  };

  const downloadTemplate = () => {
    const csvContent = `Email,Name,StaffId,Role,Department
new.teacher1@school.edu,John Smith,STAFF001,Mathematics Teacher,Mathematics Department
new.teacher2@school.edu,Jane Doe,STAFF002,Science Teacher,Science Department
update.existing@school.edu,Updated Name,STAFF003,English/Language Arts Teacher,Language Arts Department
new.admin@school.edu,New Administrator,ADMIN001,Administrator,Administration
conflicting.role@school.edu,Role Conflict Test,CONF001,Department Head – Mathematics,Mathematics Department`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (record: ProcessedRecord) => {
    if (record.errors.length > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Error
        </span>
      );
    }
    if (record.status === 'create') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          New
        </span>
      );
    }
    if (record.status === 'update') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Update
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Unknown
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Staff Upload
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload CSV files to bulk import or update staff records with comprehensive validation and conflict resolution
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {/* Instructions Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiFileText className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Upload Instructions</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Use CSV format with columns: Email, Name, StaffId, Role, Department</li>
                  <li>Email addresses must be unique and valid</li>
                  <li>Staff IDs must be 3-15 characters and unique</li>
                  <li>Roles and Departments must exist in the system</li>
                  <li>System will detect conflicts and provide resolution options</li>
                  <li>Preview shows detailed analysis before upload</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Upload Staff Data
            </h3>

            {/* Download Template */}
            <div className="mb-6">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiDownload className="mr-2 h-4 w-4" />
                Download CSV Template
              </button>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handlePreview}
                disabled={!file || isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <FiEye className="mr-2 h-4 w-4" />
                )}
                Analyze & Preview
              </button>

              <button
                onClick={handleUpload}
                disabled={!showPreview || selectedRecords.size === 0 || isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <FiSave className="mr-2 h-4 w-4" />
                )}
                Upload Selected ({selectedRecords.size})
              </button>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiCheck className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <div className="mt-2 text-sm text-green-700">{success}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Processing Warnings</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Summary */}
        {showPreview && previewSummary && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <FiUsers className="inline mr-2 h-5 w-5" />
                Upload Summary
              </h3>
              
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900">{previewSummary.total}</div>
                  <div className="text-sm text-gray-500">Total Records</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{previewSummary.valid}</div>
                  <div className="text-sm text-green-600">Valid Records</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{previewSummary.conflicts}</div>
                  <div className="text-sm text-yellow-600">With Conflicts</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{previewSummary.errors}</div>
                  <div className="text-sm text-red-600">Errors</div>
                </div>
              </div>

              {/* Selection Controls */}
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={selectAllValid}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Select All Valid ({previewSummary.valid})
                </button>
                <button
                  onClick={selectNone}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Select None
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Preview */}
        {showPreview && previewData.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Detailed Analysis ({previewData.length} records)
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedRecords.size === previewData.filter(r => r.canUpload).length && previewData.filter(r => r.canUpload).length > 0}
                          onChange={() => selectedRecords.size === previewData.filter(r => r.canUpload).length ? selectNone() : selectAllValid()}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issues/Changes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((record) => (
                      <tr key={record.rowNumber} className={`${
                        record.errors.length > 0 ? 'bg-red-50' : 
                        record.status === 'create' ? 'bg-green-50' : 
                        record.conflicts.length > 0 ? 'bg-yellow-50' : 'bg-white'
                      }`}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedRecords.has(record.rowNumber)}
                            onChange={() => toggleRecordSelection(record.rowNumber)}
                            disabled={!record.canUpload}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.rowNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(record)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.staffId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.department}</td>
                        <td className="px-6 py-4 text-sm">
                          {/* Errors */}
                          {record.errors.length > 0 && (
                            <div className="text-red-600 space-y-1">
                              {record.errors.map((error, index) => (
                                <div key={index} className="flex items-center">
                                  <FiAlertCircle className="h-3 w-3 mr-1" />
                                  {error}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Conflicts */}
                          {record.conflicts.length > 0 && (
                            <div className="text-yellow-600 space-y-1">
                              {record.conflicts.map((conflict, index) => (
                                <div key={index} className="flex items-center">
                                  <FiRefreshCw className="h-3 w-3 mr-1" />
                                  {conflict.field}: {conflict.existing} → {conflict.new}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Warnings */}
                          {record.warnings.length > 0 && (
                            <div className="text-blue-600 space-y-1">
                              {record.warnings.map((warning, index) => (
                                <div key={index}>{warning}</div>
                              ))}
                            </div>
                          )}
                          
                          {record.errors.length === 0 && record.conflicts.length === 0 && record.warnings.length === 0 && (
                            <span className="text-green-600">Ready to upload</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {record.actions.length > 0 && (
                            <select
                              value={recordActions.get(record.rowNumber) || record.actions[0]?.id || ''}
                              onChange={(e) => setRecordAction(record.rowNumber, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                              disabled={!record.canUpload}
                            >
                              {record.actions.map((action) => (
                                <option key={action.id} value={action.id}>
                                  {action.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 