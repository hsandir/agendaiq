import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { InterfaceSettingsClient } from './InterfaceSettingsClient';

export default async function InterfaceSettingsPage() {
  const user = await requireAuth(AuthPresets.requireAuth);
  
  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Interface & Theme Settings</h1>
        <p className="text-muted-foreground">
          Customize your AgendaIQ experience with themes and layouts that match your workflow and preferences.
        </p>
      </div>

      <InterfaceSettingsClient />
    </div>
  );
}