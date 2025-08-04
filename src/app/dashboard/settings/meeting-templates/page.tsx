import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { prisma } from '@/lib/prisma';
import MeetingTemplatesClient from './MeetingTemplatesClient';

export const metadata: Metadata = {
  title: "Meeting Templates | AgendaIQ",
  description: "Manage meeting templates and scheduling rules for the organization",
};

export default async function MeetingTemplatesPage() {
  // Use standardized auth system - require admin for meeting templates
  const user = await requireAuth(AuthPresets.requireAdmin);

  // Fetch meeting templates from database
  const templates = await prisma.meetingTemplate.findMany({
    include: {
      Staff: {
        include: {
          User: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Fetch roles for attendee selection
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      title: true,
      is_leadership: true
    },
    orderBy: {
      title: 'asc'
    }
  });

  // Fetch departments for attendee selection
  const departments = await prisma.department.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Transform templates to match the expected interface
  const transformedTemplates = templates.map(template => ({
    ...template,
    created_at: template.created_at.toISOString(),
    updated_at: template.updated_at.toISOString(),
    creator: template.Staff.User.name || template.Staff.User.email || 'Unknown'
  }));

  return (
    <MeetingTemplatesClient 
      initialTemplates={transformedTemplates}
      roles={roles}
      departments={departments}
    />
  );
}