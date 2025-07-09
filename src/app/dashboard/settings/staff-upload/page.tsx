'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiDownload, FiAlertCircle, FiCheck, FiEye, FiSave } from 'react-icons/fi';

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
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

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

    const formData = new FormData();
    formData.append('file', file);
    formData.append('preview', 'true');

    try {
      const response = await fetch('/api/staff/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to preview staff data');
      }

      setPreviewData(data.preview || []);
      setShowPreview(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('preview', 'false');

    try {
      const response = await fetch('/api/staff/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload staff data');
      }

      setSuccess(`Successfully processed ${data.count} staff records`);
      setFile(null);
      setPreviewData([]);
      setShowPreview(false);
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    window.location.href = '/templates/staff-upload-template.csv';
  };

  return (
    <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Staff Data Upload
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload staff data using our CSV template. Preview changes before applying them.
          </p>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-8 flex space-x-4">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <FiDownload className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
              Download Template
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Upload CSV File
              </label>
              <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                <div className="space-y-1 text-center">
                  <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept=".csv"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV file up to 10MB</p>
                </div>
              </div>
              {file && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected file: {file.name}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiCheck className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">{success}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handlePreview}
                disabled={!file || isLoading}
                className="flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <FiEye className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
                {isLoading ? 'Loading...' : 'Preview Changes'}
              </button>
              <button
                type="submit"
                disabled={!file || isLoading || (showPreview && previewData.length === 0)}
                className="flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                <FiSave className="-ml-0.5 mr-1.5 h-5 w-5 text-white" />
                {isLoading ? 'Processing...' : 'Apply Changes'}
              </button>
            </div>
          </form>

          {showPreview && previewData.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900">Preview Changes</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Staff ID</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Department</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewData.map((record, index) => (
                      <tr key={index} className={record.status === 'update' ? 'bg-yellow-50' : 'bg-green-50'}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                          {record.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {record.existingData ? (
                            <div>
                              <div className="line-through text-gray-400">{record.existingData.name}</div>
                              <div>{record.name}</div>
                            </div>
                          ) : (
                            record.name
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {record.existingData ? (
                            <div>
                              <div className="line-through text-gray-400">{record.existingData.staffId}</div>
                              <div>{record.staffId}</div>
                            </div>
                          ) : (
                            record.staffId
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {record.existingData ? (
                            <div>
                              <div className="line-through text-gray-400">{record.existingData.role}</div>
                              <div>{record.role}</div>
                            </div>
                          ) : (
                            record.role
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {record.existingData ? (
                            <div>
                              <div className="line-through text-gray-400">{record.existingData.department}</div>
                              <div>{record.department}</div>
                            </div>
                          ) : (
                            record.department
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            record.status === 'update' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {record.status === 'update' ? 'Update' : 'Create'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 