import React from 'react';
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

export default async function MeetingTemplatesSettings() {
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

  if (!user || user.staff?.[0]?.role?.title !== "Administrator") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Meeting Templates & Scheduling Rules</h1>
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Admin Only:</strong> These settings control meeting templates and scheduling rules for the entire organization.
        </p>
      </div>
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Meeting Templates</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded mb-2">Add Template</button>
        <div className="border p-4 rounded bg-gray-50 mb-2">No templates defined yet.</div>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-2">Scheduling Rules</h2>
        <label className="block mb-2">Who can schedule meetings:
          <select className="input input-bordered w-full">
            <option>All Staff</option>
            <option>Admins Only</option>
            <option>Department Heads</option>
          </select>
        </label>
        <label className="block mb-2">Minimum Meeting Duration (minutes):
          <input type="number" className="input input-bordered w-full" defaultValue={15} />
        </label>
        <label className="block mb-2">Maximum Meeting Duration (minutes):
          <input type="number" className="input input-bordered w-full" defaultValue={120} />
        </label>
        <label className="block mb-2">Buffer Time Between Meetings (minutes):
          <input type="number" className="input input-bordered w-full" defaultValue={10} />
        </label>
        <button className="px-4 py-2 bg-green-600 text-white rounded mt-2">Save Rules</button>
      </section>
    </div>
  );
} 