"use client";

import { Package, Calendar, Wrench, RotateCcw, Bell, ArrowRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const QUICK_LINKS = [
  { label: "My Assets", href: "/dashboard/employee/assets", icon: Package, desc: "View assets currently allocated to you", color: "blue" },
  { label: "Book Resources", href: "/dashboard/employee/bookings", icon: Calendar, desc: "Reserve shared equipment or rooms", color: "emerald" },
  { label: "Raise Maintenance", href: "/dashboard/employee/maintenance", icon: Wrench, desc: "Report an issue with an asset", color: "amber" },
  { label: "Return / Transfer", href: "/dashboard/employee/requests", icon: RotateCcw, desc: "Initiate a return or transfer request", color: "violet" },
];

const COLOR_MAP: Record<string, { border: string; icon: string; bg: string; link: string }> = {
  blue: { border: "border-blue-500/20", icon: "text-blue-400", bg: "bg-blue-500/10 group-hover:bg-blue-500/20", link: "group-hover:text-blue-400" },
  emerald: { border: "border-emerald-500/20", icon: "text-emerald-400", bg: "bg-emerald-500/10 group-hover:bg-emerald-500/20", link: "group-hover:text-emerald-400" },
  amber: { border: "border-amber-500/20", icon: "text-amber-400", bg: "bg-amber-500/10 group-hover:bg-amber-500/20", link: "group-hover:text-amber-400" },
  violet: { border: "border-violet-500/20", icon: "text-violet-400", bg: "bg-violet-500/10 group-hover:bg-violet-500/20", link: "group-hover:text-violet-400" },
};

const MY_ASSETS = [
  { name: "Dell XPS 15 Laptop", tag: "AST-007", since: "Mar 2025", due: "No return date", status: "active" },
  { name: "Logitech MX Keys", tag: "AST-031", since: "Jan 2025", due: "No return date", status: "active" },
  { name: "iPhone 15 Work Phone", tag: "AST-059", since: "Apr 2025", due: "Jun 30, 2026", status: "active" },
];

const NOTIFICATIONS = [
  { msg: "Your maintenance request for Dell XPS has been approved", time: "2h ago", type: "success" },
  { msg: "Asset return due in 3 days: iPhone 15 Work Phone", time: "1d ago", type: "warn" },
  { msg: "Booking confirmed: Conference Room Projector on Jul 14", time: "2d ago", type: "info" },
];

export default function EmployeeDashboard() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hello, {session?.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Employee · Here's what's on your plate today
          </p>
        </div>
        <Link
          href="/dashboard/employee/notifications"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm transition-all shadow-sm"
        >
          <Bell className="w-4 h-4 text-orange-400" />
          Notifications
          <span className="bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">3</span>
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-gray-200 font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            const c = COLOR_MAP[link.color];
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group flex items-center gap-4 p-5 rounded-2xl bg-gray-900 border border-gray-800 hover:${c.border} hover:bg-gray-800/80 transition-all duration-200`}
              >
                <div className={`w-12 h-12 rounded-xl border ${c.border} ${c.bg} flex items-center justify-center shrink-0 transition-colors`}>
                  <Icon className={`w-6 h-6 ${c.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-100 font-semibold text-sm">{link.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{link.desc}</p>
                </div>
                <ArrowRight className={`w-4 h-4 text-gray-600 ${c.link} group-hover:translate-x-0.5 transition-all shrink-0`} />
              </Link>
            );
          })}
        </div>
      </div>

      {/* My Assets + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Assets */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              <h3 className="text-gray-200 font-semibold text-sm">My Allocated Assets</h3>
            </div>
            <Link href="/dashboard/employee/assets" className="text-xs text-blue-400 hover:text-blue-300">View all</Link>
          </div>
          <div className="space-y-3">
            {MY_ASSETS.map((asset) => (
              <div key={asset.tag} className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-200 text-sm font-medium">{asset.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{asset.tag} · Since {asset.since}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-500 text-xs">{asset.due}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-orange-400" />
            <h3 className="text-gray-200 font-semibold text-sm">Recent Notifications</h3>
          </div>
          <div className="space-y-3">
            {NOTIFICATIONS.map((n, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                <div className="shrink-0 mt-0.5">
                  {n.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : n.type === "warn" ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Bell className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-xs leading-relaxed">{n.msg}</p>
                  <p className="text-gray-600 text-xs mt-1">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/dashboard/employee/notifications" className="flex items-center justify-center gap-1 mt-4 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            View all notifications <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Upcoming bookings */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-gray-200 font-semibold text-sm">My Upcoming Bookings</h3>
          </div>
          <Link href="/dashboard/employee/bookings" className="text-xs text-emerald-400 hover:text-emerald-300">Manage bookings</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { resource: "Conference Room Projector", date: "Jul 14, 2026", time: "10:00 – 11:30 AM", status: "upcoming" },
            { resource: "Video Camera Kit", date: "Jul 16, 2026", time: "2:00 – 4:00 PM", status: "upcoming" },
            { resource: "iPad Pro 12.9\"", date: "Jul 18, 2026", time: "All day", status: "upcoming" },
          ].map((b, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
              <p className="text-gray-200 text-sm font-medium">{b.resource}</p>
              <p className="text-gray-400 text-xs mt-1">{b.date}</p>
              <p className="text-gray-500 text-xs">{b.time}</p>
              <span className="inline-block mt-2 text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">Confirmed</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
