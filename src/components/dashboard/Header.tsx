"use client";

import { signOut, useSession } from "next-auth/react";
import { Plus, Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Header() {
  const { data: __session  } = useSession();

  return 
    <header className="bg-card text-card-foreground border-b border-border">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/meetings/new"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Meeting
          </Link>
        </div>

        <div className="flex items-center space-x-6">
          <button className="text-muted-foreground hover:text-foreground">
            <Bell className="h-6 w-6" />
          </button>

          <div className="relative">
            <button className="flex items-center space-x-3 focus:outline-none">
              {session?.user?.image ? (
                <Image
                  src={session.(user.image}
                  alt={session.user.name || "User"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">
                    {session?.user?.name?.[0] || "U"}
                  </span>
                </div>
              )}
            <span className="text-sm font-medium text-foreground">
                {session?.user?.name}
              </span>
            </button>
          </div>

          <button
            onClick={async () => {
              try {
                await signOut({ 
                  callbackUrl: '/auth/signin',
                  redirect: true 
                });
              } catch (error: unknown) {
                // Fallback to direct navigation if signOut fails
                window.location.href = '/auth/signin';
              }
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
} 