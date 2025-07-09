import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FiDatabase, FiClock, FiUsers, FiHardDrive } from "react-icons/fi";

export const metadata: Metadata = {
  title: "Database Status",
  description: "Monitor database health and performance",
};

export default async function DatabasePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { 
      staff: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user?.staff?.[0]?.role || user.staff[0].role.title !== "Administrator") {
    redirect("/dashboard?error=access_denied");
  }

  // Mock database metrics
  const dbMetrics = {
    size: {
      total: 10,
      used: 4.2,
      free: 5.8,
    },
    connections: {
      active: 12,
      idle: 8,
      max: 100,
    },
    performance: {
      queries: 1250,
      avgResponseTime: 45,
      slowQueries: 2,
    },
    uptime: "45 days 12 hours",
    lastBackup: "2024-06-01T23:00:00Z",
  };

  // Mock table statistics
  const tableStats = [
    { name: "users", rows: 1250, size: "128 MB", lastVacuum: "2024-06-01" },
    { name: "roles", rows: 15, size: "16 KB", lastVacuum: "2024-06-01" },
    { name: "departments", rows: 25, size: "32 KB", lastVacuum: "2024-06-01" },
    { name: "meetings", rows: 5680, size: "512 MB", lastVacuum: "2024-06-01" },
    { name: "notes", rows: 12500, size: "1.2 GB", lastVacuum: "2024-06-01" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Database Status</h2>
        <p className="text-muted-foreground">
          Monitor database health and performance metrics.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <FiHardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dbMetrics.size.used}GB / {dbMetrics.size.total}GB
            </div>
            <p className="text-xs text-muted-foreground">
              {dbMetrics.size.free}GB Available
            </p>
            <div className="mt-4 h-2 w-full bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{ width: `${(dbMetrics.size.used / dbMetrics.size.total) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <FiUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dbMetrics.connections.active} / {dbMetrics.connections.max}
            </div>
            <p className="text-xs text-muted-foreground">
              {dbMetrics.connections.idle} Idle Connections
            </p>
            <div className="mt-4 h-2 w-full bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{ width: `${(dbMetrics.connections.active / dbMetrics.connections.max) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Query Performance</CardTitle>
            <FiDatabase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbMetrics.performance.queries}</div>
            <p className="text-xs text-muted-foreground">
              Avg. Response Time: {dbMetrics.performance.avgResponseTime}ms
            </p>
            <p className="text-xs text-muted-foreground">
              Slow Queries: {dbMetrics.performance.slowQueries}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <FiClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(dbMetrics.lastBackup).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(dbMetrics.lastBackup).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Table Statistics</CardTitle>
          <CardDescription>Size and performance metrics for database tables.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Table Name</th>
                  <th className="px-6 py-3">Rows</th>
                  <th className="px-6 py-3">Size</th>
                  <th className="px-6 py-3">Last Vacuum</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableStats.map((table) => (
                  <tr key={table.name} className="bg-white border-b">
                    <td className="px-6 py-4 font-medium">{table.name}</td>
                    <td className="px-6 py-4">{table.rows.toLocaleString()}</td>
                    <td className="px-6 py-4">{table.size}</td>
                    <td className="px-6 py-4">{table.lastVacuum}</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm">
                        Analyze
                      </Button>
                      <Button variant="ghost" size="sm" className="ml-2">
                        Vacuum
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
            <CardDescription>Database maintenance operations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full">
                    Vacuum Full
                  </Button>
                  <Button variant="outline" className="w-full">
                    Reindex
                  </Button>
                  <Button variant="outline" className="w-full">
                    Analyze
                  </Button>
                  <Button variant="outline" className="w-full">
                    Reset Stats
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connection Pool</CardTitle>
            <CardDescription>Active database connections and pool status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Pool Size</h4>
                  <p className="text-2xl font-bold">20</p>
                  <p className="text-xs text-muted-foreground">Maximum connections</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Wait Queue</h4>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Pending connections</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Active Time</h4>
                  <p className="text-2xl font-bold">125ms</p>
                  <p className="text-xs text-muted-foreground">Average</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Idle Time</h4>
                  <p className="text-2xl font-bold">15s</p>
                  <p className="text-xs text-muted-foreground">Average</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 