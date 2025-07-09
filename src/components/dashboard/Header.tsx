"use client";

import { signOut, useSession } from "next-auth/react";
import { RiAddLine, RiBellLine } from "react-icons/ri";
import Image from "next/image";
import Link from "next/link";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/meetings/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RiAddLine className="mr-2 h-5 w-5" />
            New Meeting
          </Link>
        </div>

        <div className="flex items-center space-x-6">
          <button className="text-gray-500 hover:text-gray-600">
            <RiBellLine className="h-6 w-6" />
          </button>

          <div className="relative">
            <button className="flex items-center space-x-3 focus:outline-none">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">
                    {session?.user?.name?.[0] || "U"}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">
                {session?.user?.name}
              </span>
            </button>
          </div>

          <button
            onClick={() => signOut()}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
} 