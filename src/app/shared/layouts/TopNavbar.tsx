"use client";

import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";

export default function TopNavbar() {
  const { data: session } = useSession();

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-[#f3f4f6] shrink-0 sticky top-0 z-30 shadow-sm shadow-gray-800/10">
      {/* Search Bar (Rounded pill, light background) */}
      <div className="flex items-center gap-2 bg-gray-50 border border-transparent hover:bg-gray-100/80 focus-within:bg-white focus-within:border-gray-200 focus-within:shadow-sm transition-all rounded-full px-4 py-2 w-96">
        <Search className="w-4 h-4 text-[#6b7280] shrink-0" />
        <input
          type="text"
          placeholder="Search assets, employees..."
          className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1"
        />
      </div>

      {/* Right side widgets */}
      <div className="flex items-center gap-4">
        {/* Notifications Icon Button */}
        <button className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 text-[#6b7280] hover:text-primary transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-1 ring-white" />
        </button>

        {/* Profile Info Widget */}
        <div className="flex items-center gap-2 text-sm text-[#374151] border-l border-[#f3f4f6] pl-4">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
            {session?.user?.name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <span className="hidden md:inline font-semibold">{session?.user?.name || "test"}</span>
        </div>
      </div>
    </header>
  );
}
