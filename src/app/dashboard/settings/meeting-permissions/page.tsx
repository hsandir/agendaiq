import React from 'react';
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

export default async function MeetingPermissionsSettings() {
  const user = await requireAuth(AuthPresets.requireAuth);

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: user.email },
    include: { 
      staff: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user || user.staff?.[0]?.role?.title !== "Administrator") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Meeting Permissions & Roles</h1>
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Admin Only:</strong> These settings control meeting permissions across the entire organization.
        </p>
      </div>
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Role-based Access</h2>
        <label className="block mb-2">Who can create meetings:
          <select className="input input-bordered w-full">
            <option>All Staff</option>
            <option>Admins Only</option>
            <option>Department Heads</option>
          </select>
        </label>
        <label className="block mb-2">Who can edit meetings:
          <select className="input input-bordered w-full">
            <option>All Staff</option>
            <option>Admins Only</option>
            <option>Department Heads</option>
          </select>
        </label>
        <label className="block mb-2">Who can join meetings:
          <select className="input input-bordered w-full">
            <option>All Staff</option>
            <option>Admins Only</option>
            <option>Department Heads</option>
          </select>
        </label>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-2">Department-based Restrictions</h2>
        <label className="block mb-2">Restrict scheduling to department:
          <select className="input input-bordered w-full">
            <option>None</option>
            <option>STEM</option>
            <option>Mathematics</option>
            <option>Science</option>
            <option>Administration</option>
            {/* Add more departments as needed */}
          </select>
        </label>
        <button className="px-4 py-2 bg-green-600 text-white rounded mt-2">Save Permissions</button>
      </section>
    </div>
  );
} 