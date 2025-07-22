'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiDownload, FiAlertCircle, FiCheck, FiEye, FiSave, FiUsers, FiFileText } from 'react-icons/fi';

interface PreviewData {
  email: string;
  name: string;
  staffId: string;
  role: string;
  department: string;
  status: 'create' | 'update';
  existingData: {
    name: string;
    staffId: string;
    role: string;
    department: string;
  } | null;
}

export default function StaffUploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // REQUIRED: Auth check for client components
  useEffect(() => {
    if (session === null) {
      router.push('/auth/signin');
      return;
    }
    
    // OPTIONAL: Admin check - Only leadership can upload staff
    if (session && session.user?.staff?.role?.is_leadership !== true) {
      router.push('/dashboard');
      return;
    }
    
    setLoading(false);
  }, [session, router]);

  // Original state variables
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // REQUIRED: Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.type === 'application/vnd.ms-excel')) {
      setFile(selectedFile);
      setError('');
      setPreviewData([]);
      setShowPreview(false);
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

      setPreviewData(data.preview);
      setShowPreview(true);
      setSuccess(`Preview completed successfully. Found ${data.preview.length} records.`);
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

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'upload');

      const response = await fetch('/api/staff/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess(`Upload completed successfully! ${data.created} staff created, ${data.updated} staff updated.`);
      setFile(null);
      setPreviewData([]);
      setShowPreview(false);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'Email,Name,StaffId,Role,Department\nexample@school.edu,John Doe,STAFF001,Teacher,Mathematics Department\nexample2@school.edu,Jane Smith,STAFF002,Principal,Administration';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Staff Upload
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload CSV files to bulk import or update staff records with comprehensive validation
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
                  <li>Existing staff will be updated, new staff will be created</li>
                  <li>Preview your data before uploading to check for conflicts</li>
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
                Preview Data
              </button>

              <button
                onClick={handleUpload}
                disabled={!showPreview || previewData.length === 0 || isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <FiSave className="mr-2 h-4 w-4" />
                )}
                Upload Staff Data
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
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && previewData.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <FiUsers className="inline mr-2 h-5 w-5" />
                Data Preview ({previewData.length} records)
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((record, index) => (
                      <tr key={index} className={record.status === 'create' ? 'bg-green-50' : 'bg-blue-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.status === 'create' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {record.status === 'create' ? 'New' : 'Update'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.staffId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.department}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {record.status === 'update' && record.existingData && (
                            <div className="space-y-1">
                              {record.name !== record.existingData.name && (
                                <div>Name: {record.existingData.name} → {record.name}</div>
                              )}
                              {record.staffId !== record.existingData.staffId && (
                                <div>Staff ID: {record.existingData.staffId} → {record.staffId}</div>
                              )}
                              {record.role !== record.existingData.role && (
                                <div>Role: {record.existingData.role} → {record.role}</div>
                              )}
                              {record.department !== record.existingData.department && (
                                <div>Dept: {record.existingData.department} → {record.department}</div>
                              )}
                            </div>
                          )}
                          {record.status === 'create' && (
                            <span className="text-green-600">New staff member</span>
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