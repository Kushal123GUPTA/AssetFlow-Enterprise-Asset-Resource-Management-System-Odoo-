"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Tag,
  ClipboardList,
  Users,
  BarChart3,
  Package,
  AlertTriangle,
  ArrowLeftRight,
  CalendarCheck,
  RotateCcw,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { message } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const QUICK_LINKS = [
  {
    label: "Departments",
    href: "/dashboard/admin/departments",
    icon: Building2,
    desc: "Org structure & heads",
  },
  {
    label: "Categories",
    href: "/dashboard/admin/categories",
    icon: Tag,
    desc: "Asset category tree",
  },
  {
    label: "Employees",
    href: "/dashboard/admin/employees",
    icon: Users,
    desc: "Directory & roles",
  },
  {
    label: "Audit Cycles",
    href: "/dashboard/admin/audit-cycles",
    icon: ClipboardList,
    desc: "Plan and close audits",
  },
  {
    label: "Analytics",
    href: "/dashboard/admin/analytics",
    icon: BarChart3,
    desc: "Utilization insights",
  },
] as const;

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/modules/dashboard/routes/admin");
      if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
      const json = await res.json();
      setMetrics(json.data);
    } catch (error) {
      console.error(error);
      message.error("Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const kpis = [
    {
      label: "Available",
      value: metrics?.availableCount ?? 0,
      icon: Package,
      hint: "Ready to allocate",
      color: "from-blue-500 to-cyan-500",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Allocated",
      value: metrics?.allocatedCount ?? 0,
      icon: Users,
      hint: "In use",
      color: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Maintenance",
      value: metrics?.maintenanceCount ?? 0,
      icon: AlertTriangle,
      hint: "Open tickets",
      color: "from-amber-500 to-orange-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Bookings",
      value: metrics?.activeBookingsCount ?? 0,
      icon: CalendarCheck,
      hint: "Active now",
      color: "from-rose-500 to-pink-600",
      bg: "bg-rose-500/10 border-rose-500/20",
    },
    {
      label: "Transfers",
      value: metrics?.pendingTransfersCount ?? 0,
      icon: ArrowLeftRight,
      hint: "Pending approval",
      color: "from-violet-500 to-purple-600",
      bg: "bg-violet-500/10 border-violet-500/20",
    },
    {
      label: "Returns due",
      value: metrics?.upcomingReturnsCount ?? 0,
      icon: RotateCcw,
      hint: "Coming up",
      color: "from-teal-500 to-cyan-500",
      bg: "bg-teal-500/10 border-teal-500/20",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">
            Administrator Dashboard
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Welcome, {session?.user?.name} · Manage departments, categories, employee accounts, and audit cycles
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDashboard}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-none text-sm font-semibold transition-all disabled:opacity-50 !bg-gray-800/80 !text-gray-200 hover:!bg-gray-700/80 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Overdue Alerts Box */}
      {!loading && metrics?.overdueReturnsCount > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-950">
                {metrics.overdueReturnsCount} assets overdue for return
              </p>
              <p className="mt-0.5 text-xs text-amber-900/80 font-medium">
                Flagged for follow-up with the assigned employees.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`rounded-2xl border p-5 ${kpi.bg} backdrop-blur-sm transition-all hover:scale-[1.01]`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-[10px] font-bold uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-3xl font-extrabold text-gray-100 mt-1.5">{loading ? "..." : kpi.value}</p>
                  <p className="text-gray-500 text-xs mt-1 font-semibold">{kpi.hint}</p>
                </div>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Module Quick Links */}
      <div>
        <h2 className="text-gray-100 font-bold mb-4 text-base">Administrative Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-blue-500/50 hover:bg-gray-800/80 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/25 transition-colors">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 font-semibold text-sm group-hover:text-primary transition-colors">{link.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5 truncate font-medium">{link.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Panel */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <h2 className="text-gray-200 font-bold text-sm mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Recent Activity Logs
        </h2>
        {loading ? (
          <div className="text-center text-xs text-gray-500 py-6">Loading activity logs...</div>
        ) : metrics?.recentActivity?.length > 0 ? (
          <div className="space-y-2.5">
            {metrics.recentActivity.map((log: any) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-950 p-3.5 transition-colors hover:border-primary/25"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                  {log.action?.includes("allocated") ? (
                    <Users className="h-4 w-4" />
                  ) : log.action?.includes("transfer") ? (
                    <ArrowLeftRight className="h-4 w-4" />
                  ) : log.action?.includes("maintenance") ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-100">
                    {log.details?.assetName ? (
                      <span className="font-bold text-gray-100">{log.details.assetName}</span>
                    ) : (
                      "Asset"
                    )}{" "}
                    — {String(log.action ?? "").replace(/_/g, " ")}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 font-medium">
                    {log.details?.reason ||
                      log.details?.notes ||
                      `Entity: ${log.entityType}`}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-gray-500 font-medium">
                  {dayjs(log.createdAt).fromNow()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-700 bg-gray-950 px-4 py-8 text-center text-sm text-gray-500 font-medium">
            No recent activity recorded today.
          </div>
        )}
      </div>
    </div>
  );
}
