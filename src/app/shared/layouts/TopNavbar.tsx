"use client";

import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";

export default function TopNavbar() {
  const { data: session } = useSession();

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/60 shrink-0 sticky top-0 z-30">
      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-1.5 w-72">
        <Search className="w-4 h-4 text-gray-500 shrink-0" />
        <input
          type="text"
          placeholder="Search assets, employees..."
          className="bg-transparent text-sm text-gray-300 placeholder-gray-500 outline-none flex-1"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-gray-200 hover:bg-gray-700/60 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-1 ring-gray-950" />
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="hidden md:inline">{session?.user?.name}</span>
        </div>
      </div>
    </header>
  );
}
