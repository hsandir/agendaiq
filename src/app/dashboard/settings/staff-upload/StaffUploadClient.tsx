'use client';

import { useState } from 'react';
import { Upload as FiUpload, Download as FiDownload, AlertCircle as FiAlertCircle, Check as FiCheck, Eye as FiEye, Save as FiSave, Users as FiUsers, FileText as FiFileText, Edit as FiEdit, Trash2 as FiTrash2, RefreshCw as FiRefreshCw } from 'lucide-react';

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
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
  const [recordActions, setRecordActions] = useState<Map<number, string>>(new Map());
  const [selectedChanges, setSelectedChanges] = useState<Map<number, Set<string>>>(new Map());

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
        let errorMessage = data.error || 'Preview failed';
        if (data.details) {
          errorMessage += `\n\nDetails: ${data.details}`;
        }
        if (data.hint) {
          errorMessage += `\n\nHint: ${data.hint}`;
        }
        throw new Error(errorMessage);
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
      formData.append('selectedChanges', JSON.stringify(Object.fromEntries(selectedChanges.entries())));

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

  const handleSelectChanges = (rowNumber: number, record: ProcessedRecord) => {
    if (record.conflicts.length === 0) return;
    
    // Initialize with all changes selected
    const newSelectedChanges = new Map(selectedChanges);
    const allChanges = new Set(record.conflicts.map(c => c.field));
    newSelectedChanges.set(rowNumber, allChanges);
    setSelectedChanges(newSelectedChanges);
    
    // Show modal or inline editor - for now just set action to partial
    setRecordAction(rowNumber, 'partial');
  };

  const toggleChangeSelection = (rowNumber: number, field: string) => {
    const newSelectedChanges = new Map(selectedChanges);
    const currentChanges = newSelectedChanges.get(rowNumber) || new Set();
    
    if (currentChanges.has(field)) {
      currentChanges.delete(field);
    } else {
      currentChanges.add(field);
    }
    
    newSelectedChanges.set(rowNumber, currentChanges);
    setSelectedChanges(newSelectedChanges);
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
          Update
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
        Unknown
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
            Staff Upload
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload CSV files to bulk import or update staff records with comprehensive validation and conflict resolution
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {/* Instructions Card */}
        <div className="bg-primary border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiFileText className="h-5 w-5 text-primary" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-primary">Upload Instructions</h3>
              <div className="mt-2 text-sm text-primary">
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
        <div className="bg-card shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
              Upload Staff Data
            </h3>

            {/* Download Template */}
            <div className="mb-6">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center px-4 py-2 border border-border shadow-sm text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
              >
                <FiDownload className="mr-2 h-4 w-4" />
                Download CSV Template
              </button>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label htmlFor="file-upload" className="block text-sm font-medium text-foreground mb-2">
                Select CSV File
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary hover:file:bg-primary"
              />
              {file && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handlePreview}
                disabled={!file || isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-foreground bg-primary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
                ) : (
                  <FiEye className="mr-2 h-4 w-4" />
                )}
                Analyze & Preview
              </button>

              <button
                onClick={handleUpload}
                disabled={!showPreview || selectedRecords.size === 0 || isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-foreground bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
                ) : (
                  <FiSave className="mr-2 h-4 w-4" />
                )}
                Upload Selected ({selectedRecords.size})
              </button>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="mt-4 bg-destructive/10 border border-destructive rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-destructive">Error</h3>
                    <div className="mt-2 text-sm text-destructive">{error}</div>
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
          <div className="bg-card shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
                <FiUsers className="inline mr-2 h-5 w-5" />
                Upload Summary
              </h3>
              
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-muted p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-foreground">{previewSummary.total}</div>
                  <div className="text-sm text-muted-foreground">Total Records</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{previewSummary.valid}</div>
                  <div className="text-sm text-green-600">Valid Records</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{previewSummary.conflicts}</div>
                  <div className="text-sm text-yellow-600">With Conflicts</div>
                </div>
                <div className="bg-destructive/10 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-destructive">{previewSummary.errors}</div>
                  <div className="text-sm text-destructive">Errors</div>
                </div>
              </div>

              {/* Selection Controls */}
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={selectAllValid}
                  className="text-sm text-primary hover:text-primary"
                >
                  Select All Valid ({previewSummary.valid})
                </button>
                <button
                  onClick={selectNone}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Select None
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Preview */}
        {showPreview && previewData.length > 0 && (
          <div className="bg-card shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
                Detailed Analysis ({previewData.length} records)
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedRecords.size === previewData.filter(r => r.canUpload).length && previewData.filter(r => r.canUpload).length > 0}
                          onChange={() => selectedRecords.size === previewData.filter(r => r.canUpload).length ? selectNone() : selectAllValid()}
                          className="h-4 w-4 text-primary focus:ring-ring border-border rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Row</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Staff ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Issues/Changes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-gray-200">
                    {previewData.map((record) => (
                      <tr key={record.rowNumber} className={`${
                        record.errors.length > 0 ? 'bg-destructive/10' : 
                        record.status === 'create' ? 'bg-green-50' : 
                        record.conflicts.length > 0 ? 'bg-yellow-50' : 'bg-card'
                      }`}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedRecords.has(record.rowNumber)}
                            onChange={() => toggleRecordSelection(record.rowNumber)}
                            disabled={!record.canUpload}
                            className="h-4 w-4 text-primary focus:ring-ring border-border rounded disabled:opacity-50"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{record.rowNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(record)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{record.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{record.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{record.staffId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{record.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{record.department}</td>
                        <td className="px-6 py-4 text-sm">
                          {/* Errors */}
                          {record.errors.length > 0 && (
                            <div className="text-destructive space-y-1">
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
                            <div className="text-primary space-y-1">
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
                            <div className="space-y-2">
                              <select
                                value={recordActions.get(record.rowNumber) || record.actions[0]?.id || ''}
                                onChange={(e) => {
                                  const action = e.target.value;
                                  if (action === 'partial') {
                                    handleSelectChanges(record.rowNumber, record);
                                  } else {
                                    setRecordAction(record.rowNumber, action);
                                  }
                                }}
                                className="text-xs border border-border rounded px-2 py-1 w-full"
                                disabled={!record.canUpload}
                              >
                                {record.actions.map((action) => (
                                  <option key={action.id} value={action.id}>
                                    {action.label}
                                  </option>
                                ))}
                              </select>
                              
                              {/* Show change selection when partial is selected */}
                              {recordActions.get(record.rowNumber) === 'partial' && record.conflicts.length > 0 && (
                                <div className="bg-muted p-2 rounded text-xs space-y-1">
                                  <div className="font-medium text-foreground">Select changes to apply:</div>
                                  {record.conflicts.map((conflict) => (
                                    <label key={conflict.field} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={selectedChanges.get(record.rowNumber)?.has(conflict.field) || false}
                                        onChange={() => toggleChangeSelection(record.rowNumber, conflict.field)}
                                        className="h-3 w-3 text-primary focus:ring-ring border-border rounded"
                                      />
                                      <span className="text-muted-foreground">
                                        {conflict.field}: {conflict.existing} → {conflict.new}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
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