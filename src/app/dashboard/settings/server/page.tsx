import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FiCpu, FiActivity, FiHardDrive, FiClock } from "react-icons/fi";

export const metadata: Metadata = {
  title: "Server Status",
  description: "Monitor server health and performance",
};

export default async function ServerPage() {
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

  // Mock server metrics
  const serverMetrics = {
    cpu: {
      usage: 45,
      cores: 8,
      temperature: 65,
    },
    memory: {
      total: 32,
      used: 18.5,
      free: 13.5,
    },
    disk: {
      total: 500,
      used: 285,
      free: 215,
    },
    uptime: "45 days 12 hours",
    lastRestart: "2024-04-18T10:00:00Z",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Server Status</h2>
        <p className="text-muted-foreground">
          Monitor server health and performance metrics.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <FiCpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serverMetrics.cpu.usage}%</div>
            <p className="text-xs text-muted-foreground">
              {serverMetrics.cpu.cores} Cores | {serverMetrics.cpu.temperature}°C
            </p>
            <div className="mt-4 h-2 w-full bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{ width: `${serverMetrics.cpu.usage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <FiActivity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serverMetrics.memory.used}GB / {serverMetrics.memory.total}GB
            </div>
            <p className="text-xs text-muted-foreground">
              {serverMetrics.memory.free}GB Available
            </p>
            <div className="mt-4 h-2 w-full bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{ width: `${(serverMetrics.memory.used / serverMetrics.memory.total) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Space</CardTitle>
            <FiHardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serverMetrics.disk.used}GB / {serverMetrics.disk.total}GB
            </div>
            <p className="text-xs text-muted-foreground">
              {serverMetrics.disk.free}GB Free
            </p>
            <div className="mt-4 h-2 w-full bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{ width: `${(serverMetrics.disk.used / serverMetrics.disk.total) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <FiClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serverMetrics.uptime}</div>
            <p className="text-xs text-muted-foreground">
              Last restart: {new Date(serverMetrics.lastRestart).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Server specifications and details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Operating System</h4>
                  <p className="text-sm text-muted-foreground">Ubuntu 22.04 LTS</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Architecture</h4>
                  <p className="text-sm text-muted-foreground">x86_64</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Processor</h4>
                  <p className="text-sm text-muted-foreground">Intel Xeon E5-2680 v4</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Memory Type</h4>
                  <p className="text-sm text-muted-foreground">DDR4 ECC</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Network Interface</h4>
                  <p className="text-sm text-muted-foreground">1 Gbps Ethernet</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Storage Type</h4>
                  <p className="text-sm text-muted-foreground">NVMe SSD</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Services</CardTitle>
            <CardDescription>Status of running system services.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "nginx", status: "running", uptime: "45 days" },
                { name: "postgresql", status: "running", uptime: "45 days" },
                { name: "redis", status: "running", uptime: "45 days" },
                { name: "node", status: "running", uptime: "2 days" },
              ].map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <h4 className="text-sm font-medium">{service.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Uptime: {service.uptime}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 