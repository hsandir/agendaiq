import { getServerSession } from "next-auth";
import { requireAuth, getCurrentUser, AuthPresets } from '@/lib/auth/auth-utils';
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";

export default async function SettingsPage() {
  const user = await requireAuth(AuthPresets.requireAuth);

  return (
    <div className="space-y-6 p-6">
      <div className="text-center py-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">Settings & System Management</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Access settings and system management tools through the sidebar menu.
        </p>
        <div className="bg-primary border border-primary-dark rounded-lg p-6 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">AQ</span>
            </div>
          </div>
          <p className="text-primary-foreground font-medium mb-2">How to access settings:</p>
          <p className="text-primary-foreground text-sm">
            Click or hover over the menu icon (☰) in the top-left corner to open the settings sidebar.
          </p>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          <div className="bg-card rounded-lg shadow p-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 font-bold">👤</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Account Settings</h3>
            <p className="text-muted-foreground text-sm">
              Manage your profile, security settings, and notification preferences.
            </p>
          </div>
          
          <div className="bg-card rounded-lg shadow p-6">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-secondary-foreground font-bold">⚙️</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Administration</h3>
            <p className="text-muted-foreground text-sm">
              Configure district setup, role hierarchy, permissions, and administrative tools.
            </p>
          </div>
          
          <div className="bg-card rounded-lg shadow p-6">
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-destructive font-bold">🖥️</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">System Management</h3>
            <p className="text-muted-foreground text-sm">
              Monitor system health, database status, server metrics, and backups.
            </p>
          </div>
          
          <div className="bg-card rounded-lg shadow p-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-bold">🎨</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Theme Settings</h3>
            <p className="text-muted-foreground text-sm">
              Customize your experience with beautiful themes optimized for all devices.
            </p>
            <a 
              href="/dashboard/settings/theme"
              className="inline-flex items-center mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Choose Theme →
            </a>
          </div>
          
          <div className="bg-card rounded-lg shadow p-6">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-accent-foreground font-bold">📐</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Layout Settings</h3>
            <p className="text-muted-foreground text-sm">
              Switch between different dashboard layouts to match your workflow preferences.
            </p>
            <a 
              href="/dashboard/settings/layout"
              className="inline-flex items-center mt-4 px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors text-sm font-medium"
            >
              Change Layout →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 