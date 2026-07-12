"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Bell, LogOut } from "lucide-react";
import { Popover } from "antd";

export default function TopNavbar() {
  const { data: session, status } = useSession();
  const role = (session?.user?.role ?? "employee") as string;
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnread = useCallback(async () => {
    if (status !== "authenticated") {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();
      setUnreadCount(Number(json?.data?.unreadCount ?? 0));
    } catch {
      // badge is best-effort
    }
  }, [status]);

  useEffect(() => {
    loadUnread();
    const id = window.setInterval(loadUnread, 60_000);
    return () => window.clearInterval(id);
  }, [loadUnread]);

  const popoverContent = (
    <div className="p-4 w-64 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-md shadow-primary/20">
          {session?.user?.name?.[0]?.toUpperCase() ?? "A"}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-gray-100 truncate text-sm leading-snug">
            {session?.user?.name || "User"}
          </h4>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary mt-0.5 block">
            {role.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3 text-xs space-y-1">
        <p className="font-bold text-gray-500 uppercase tracking-wider text-[9px]">Email Address</p>
        <p className="text-gray-200 truncate font-semibold text-xs">{session?.user?.email || "—"}</p>
      </div>

      <div className="border-t border-gray-200 pt-3">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors border-none cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-end border-b border-gray-800 bg-gray-900 px-4 shadow-sm sm:h-20 sm:px-8">
      <div className="ml-4 flex items-center gap-3 sm:gap-4">
        <Link
          href={role === "admin" ? "/dashboard/admin/activity" : "/dashboard/notifications"}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-gray-500 transition-all hover:bg-gray-800 hover:text-primary"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center ring-1 ring-gray-900">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        <Popover content={popoverContent} trigger="hover" placement="bottomRight" arrow>
          <div className="flex items-center gap-3 border-l border-gray-800 pl-3 sm:pl-4 cursor-pointer group py-1.5 px-2.5 rounded-xl hover:bg-gray-950 transition-all duration-150">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-sm shadow-primary/20 group-hover:scale-105 transition-transform">
              {session?.user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="hidden flex-col md:flex">
              <span className="font-bold text-gray-100 text-sm group-hover:text-primary transition-colors">
                {session?.user?.name || "User"}
              </span>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                {role.replace("_", " ")}
              </span>
            </div>
          </div>
        </Popover>
      </div>
    </header>
  );
}
