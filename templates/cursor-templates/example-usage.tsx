// ÖRNEK: Server component template kullanımı
// templates/cursor-templates/server-page-template.tsx'ten kopyalandı

import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Backup Management | AgendaIQ",
  description: "System backup management and restore operations",
};

export default async function BackupManagementPage() {
  // REQUIRED: Auth check - Sadece admin'ler erişebilsin
  const user = await requireAuth(AuthPresets.requireAdmin);
  
  // OPTIONAL: Additional user data if needed (renamed to avoid conflicts)
  const userDetails = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      Staff: {
        include: {
          Role: true,
          Department: true,
          School: true,
          District: true
        }
      }
    },
  });

  // OPTIONAL: Admin check already done by AuthPresets.requireAdmin
  const isAdmin = userDetails?.Staff?.[0]?.Role?.title === 'Administrator';
  if (!isAdmin) {
    redirect('/dashboard');
  }

  // REQUIRED: Your page JSX here
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Backup Management</h1>
        <p className="text-muted-foreground">System backup management and restore operations</p>
      </div>

      {/* Your page content here */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Recent Backups</h2>
          {/* Backup list component */}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Create New Backup</h2>
          {/* Backup creation form */}
        </div>
      </div>
    </div>
  );
} 