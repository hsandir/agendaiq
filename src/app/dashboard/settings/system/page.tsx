import { Metadata } from "next";
import { requireAuth } from '@/lib/auth/auth-utils';
import { Capability } from '@/lib/auth/policy';
import { prisma } from '@/lib/prisma';
import SystemSettingsClient from './SystemSettingsClient';

export const metadata: Metadata = {
  title: "System Settings | AgendaIQ",
  description: "Configure system-wide settings and preferences",
};

export default async function SystemSettingsPage() {
  // Use capability-based auth - require ops health capability for system settings
  const user = await requireAuth({ requireAuth: true, requireCapability: Capability.OPS_HEALTH });

  // Fetch system settings from database
  const settings = await prisma.system_setting.findMany({
    orderBy: {
      key: 'asc'
    }
  });

  // Convert to a more usable format
  const settingsObject = settings.reduce((acc, setting) => {
    acc[(setting.key)] = setting.value;
    return acc;
  }, {} as Record<string, any>);

  return <SystemSettingsClient initialSettings={settingsObject} />;
} 