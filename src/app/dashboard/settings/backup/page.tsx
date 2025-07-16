import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FiDownload, FiUpload, FiHardDrive, FiClock } from "react-icons/fi";

export const metadata: Metadata = {
  title: "Backup & Restore",
  description: "Manage system backups and restore points",
};

export default async function BackupPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { 
      Staff: {
        include: {
          Role: true
        }
      }
    }
  });

  if (!user?.Staff?.[0]?.Role || user.Staff[0].Role.title !== "Administrator") {
    redirect("/dashboard?error=access_denied");
  }

  // Mock backup history data
  const backupHistory = [
    {
      id: 1,
      type: "Automatic",
      status: "Completed",
      size: "256 MB",
      timestamp: "2024-06-02T04:00:00Z",
    },
    {
      id: 2,
      type: "Manual",
      status: "Completed",
      size: "255 MB",
      timestamp: "2024-06-01T16:30:00Z",
    },
    {
      id: 3,
      type: "Automatic",
      status: "Completed",
      size: "254 MB",
      timestamp: "2024-06-01T04:00:00Z",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Backup & Restore</h2>
        <p className="text-muted-foreground">
          Manage system backups and restore points.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Perform backup and restore operations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="w-full flex items-center justify-center gap-2">
                <FiDownload className="h-4 w-4" />
                Create Backup Now
              </Button>
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <FiUpload className="h-4 w-4" />
                Restore from Backup
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Information</CardTitle>
            <CardDescription>Backup storage usage and limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4">
                <FiHardDrive className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium">Storage Used</h3>
                  <p className="text-2xl font-bold">765 MB</p>
                  <p className="text-sm text-muted-foreground">of 1 GB limit</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <FiClock className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium">Next Scheduled Backup</h3>
                  <p className="text-2xl font-bold">4h 30m</p>
                  <p className="text-sm text-muted-foreground">2024-06-03 04:00 UTC</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup History</CardTitle>
            <CardDescription>Recent backup operations and their status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Date & Time</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Size</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backupHistory.map((backup) => (
                    <tr key={backup.id} className="bg-white border-b">
                      <td className="px-6 py-4">
                        {new Date(backup.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">{backup.type}</td>
                      <td className="px-6 py-4">{backup.size}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {backup.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" size="sm">
                          Download
                        </Button>
                        <Button variant="ghost" size="sm" className="ml-2">
                          Restore
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 