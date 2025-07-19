import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";

export default async function SettingsPage() {
  const user = await requireAuth(AuthPresets.requireAuth);

  return (
    <div className="space-y-6 p-6">
      <div className="text-center py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Settings & System Management</h2>
        <p className="text-lg text-gray-600 mb-8">
          Access settings and system management tools through the sidebar menu.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">AQ</span>
            </div>
          </div>
          <p className="text-blue-800 font-medium mb-2">How to access settings:</p>
          <p className="text-blue-700 text-sm">
            Click or hover over the menu icon (☰) in the top-left corner to open the settings sidebar.
          </p>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 font-bold">👤</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Settings</h3>
            <p className="text-gray-600 text-sm">
              Manage your profile, security settings, and notification preferences.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-600 font-bold">⚙️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Administration</h3>
            <p className="text-gray-600 text-sm">
              Configure district setup, role hierarchy, permissions, and administrative tools.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 font-bold">🖥️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">System Management</h3>
            <p className="text-gray-600 text-sm">
              Monitor system health, database status, server metrics, and backups.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 