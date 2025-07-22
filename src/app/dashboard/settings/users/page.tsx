import { Metadata } from "next";
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage system users and their access",
};

export default async function UsersPage() {
  const user = await requireAuth(AuthPresets.requireAuth);

  // Get user details with staff info
  const userDetails = await prisma.user.findUnique({
    where: { email: user.email! },
    include: { 
      Staff: {
        include: {
          Role: true,
          Department: true,
          School: {
            include: {
              District: true
            }
          }
        }
      }
    },
  });

  if (!userDetails || !userDetails.Staff?.[0] || userDetails.Staff[0].Role?.title !== "Administrator") {
    redirect("/dashboard");
  }

  // Get all users with their staff information
  const allUsers = await prisma.user.findMany({
    include: {
      Staff: {
        include: {
          Role: true,
          Department: true,
          School: {
            include: {
              District: true
            }
          }
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-gray-500">Manage system users, their roles, and access permissions.</p>
      </div>

      <div className="grid gap-6">
        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allUsers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allUsers.filter((u: any) => u.Staff && u.Staff.length > 0).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allUsers.filter((u: any) => u.Staff?.[0]?.Role?.title === "Administrator").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Leadership</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allUsers.filter((u: any) => u.Staff?.[0]?.Role?.is_leadership).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Directory */}
        <Card>
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>
              View and manage all system users, assign roles, and control access permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Role</th>
                    <th className="text-left p-4">Department</th>
                    <th className="text-left p-4">School</th>
                    <th className="text-left p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user: any) => (
                    <tr key={user.id} className="border-b">
                      <td className="p-4">{user.name || "No Name"}</td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">
                        {user.Staff?.[0]?.Role ? (
                          <Badge variant={user.Staff[0].Role.is_leadership ? "default" : "secondary"}>
                            {user.Staff[0].Role.title}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No Role</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        {user.Staff?.[0]?.Department?.name || "No Department"}
                      </td>
                      <td className="p-4">
                        {user.Staff?.[0]?.School?.name || "No School"}
                      </td>
                      <td className="p-4">
                        <Badge variant={user.Staff?.[0] ? "default" : "destructive"}>
                          {user.Staff?.[0] ? "Active" : "Inactive"}
                        </Badge>
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