import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Meeting Audit Log | AgendaIQ",
  description: "View meeting audit logs and activity tracking",
};

export default async function MeetingAuditPage() {
  // REQUIRED: Auth check - Basic auth required
  const user = await requireAuth(AuthPresets.requireAuth);
  
  // REQUIRED: Your page JSX here
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Meeting Audit Log</h1>
        <p className="text-muted-foreground">View meeting audit logs and activity tracking</p>
      </div>

      {/* Your page content here */}
      <div className="space-y-6">
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-muted-foreground">Meeting audit functionality will be implemented here.</p>
        </div>
      </div>
    </div>
  );
} 