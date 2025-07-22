import { Metadata } from "next";
import UserManagement from "@/components/settings/UserManagement";

export const metadata: Metadata = {
  title: "User Management | Settings",
  description: "Manage users, their roles, and departments",
};

export default function UsersPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
      </div>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <UserManagement />
      </div>
    </div>
  );
} 