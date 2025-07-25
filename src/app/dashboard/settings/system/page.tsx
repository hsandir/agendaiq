import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { prisma } from '@/lib/prisma';
import SystemSettingsClient from './SystemSettingsClient';

export const metadata: Metadata = {
  title: "System Settings | AgendaIQ",
  description: "Configure system-wide settings and preferences",
};

export default async function SystemSettingsPage() {
  // Use standardized auth system - require admin for system settings
  const user = await requireAuth(AuthPresets.requireAdmin);

  // Fetch system settings from database
  const settings = await prisma.systemSetting.findMany({
    orderBy: {
      key: 'asc'
    }
  });

  // Convert to a more usable format
  const settingsObject = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, any>);

  return <SystemSettingsClient initialSettings={settingsObject} />;
} 