"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";

export default function TopNavbar() {
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "employee") as string;
  const notificationsHref =
    role === "employee"
      ? "/dashboard/employee/notifications"
      : "/dashboard/admin";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-4 shadow-sm sm:h-20 sm:px-8">
      <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-transparent bg-gray-950 px-4 py-2 transition-all hover:bg-gray-800 focus-within:border-gray-700 focus-within:bg-gray-900 focus-within:shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-gray-500" />
        <input
          type="text"
          placeholder="Search assets, employees..."
          className="flex-1 bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-500"
        />
      </div>

      <div className="ml-4 flex items-center gap-3 sm:gap-4">
        <Link
          href={notificationsHref}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-gray-500 transition-all hover:bg-gray-800 hover:text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-1 ring-gray-900" />
        </Link>

        <div className="flex items-center gap-2 border-l border-gray-800 pl-3 text-sm text-gray-300 sm:pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {session?.user?.name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <span className="hidden font-semibold text-gray-100 md:inline">
            {session?.user?.name || "User"}
          </span>
        </div>
      </div>
    </header>
  );
}
