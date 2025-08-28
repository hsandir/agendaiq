import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { prisma } from '@/lib/prisma';
import MeetingTemplatesClient from './MeetingTemplatesClient';

export const metadata: Metadata = {
  title: "Meeting Templates | AgendaIQ",
  description: "Manage meeting templates and scheduling rules for the organization",
};

export default async function MeetingTemplatesPage() {
  // Use capability-based auth - require meeting management capability
  const user = await requireAuth(AuthPresets.requireMeetingCreate);

  // Fetch meeting templates from database
  const templates = await prisma.meeting_templates.findMany({
    include: {
      staff: {
        include: {
          users: true
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
  const transformedTemplates = (templates.map(template => ({
    ...template,
    created_at: template.created_at.toISOString(),
    updated_at: template.updated_at.toISOString(),
    creator: template.staff.users.name ?? template.staff.users.email ?? 'Unknown'
  })));

  return (
    <MeetingTemplatesClient 
      initialTemplates={transformedTemplates}
      roles={roles}
      departments={departments}
    />
  );
}