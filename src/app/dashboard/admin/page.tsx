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
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { message } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Card from "@/app/shared/components/Card";
import { PageShell } from "@/app/shared/components/PageHeader";

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
    label: "Audit cycles",
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
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
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
    fetchDashboard();
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] ?? "Admin";

  const kpis = [
    {
      label: "Available",
      value: metrics?.availableCount ?? "—",
      icon: Package,
      hint: "Ready to allocate",
    },
    {
      label: "Allocated",
      value: metrics?.allocatedCount ?? "—",
      icon: Users,
      hint: "In use",
    },
    {
      label: "Maintenance",
      value: metrics?.maintenanceCount ?? "—",
      icon: AlertTriangle,
      hint: "Open tickets",
    },
    {
      label: "Bookings",
      value: metrics?.activeBookingsCount ?? "—",
      icon: CalendarCheck,
      hint: "Active now",
    },
    {
      label: "Transfers",
      value: metrics?.pendingTransfersCount ?? "—",
      icon: ArrowLeftRight,
      hint: "Pending approval",
    },
    {
      label: "Returns due",
      value: metrics?.upcomingReturnsCount ?? "—",
      icon: RotateCcw,
      hint: "Coming up",
    },
  ];

  return (
    <PageShell className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary-light via-gray-900 to-gray-900 p-6 sm:p-7">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Administrator workspace
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-100">
              Hello, {firstName}
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              {todayLabel || "Organization overview"}
            </p>
          </div>
          <Link
            href="/dashboard/admin/analytics"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-800 bg-gray-900 px-3.5 py-2 text-sm font-semibold text-gray-200 shadow-sm transition-colors hover:border-primary/40 hover:text-primary sm:self-auto"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Link>
        </div>
      </section>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading organization overview…
        </div>
      )}

      {!loading && metrics?.overdueReturnsCount > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-950">
                {metrics.overdueReturnsCount} assets overdue for return
              </p>
              <p className="mt-0.5 text-xs text-amber-900/80">
                Flagged for follow-up with the assigned employees.
              </p>
            </div>
          </div>
        </section>
      )}

      {!loading && (
        <>
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-100">At a glance</h2>
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                <Sparkles className="h-3 w-3 text-primary" />
                Live organization metrics
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={kpi.label}
                    className="rounded-2xl border border-gray-800 bg-gray-900 p-4 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {kpi.label}
                      </p>
                      <span className="rounded-lg bg-primary-light p-1.5 text-primary">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className="mt-2 text-3xl font-black tracking-tight text-gray-100">
                      {kpi.value}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{kpi.hint}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold text-gray-100">Quick links</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {QUICK_LINKS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-3.5 rounded-2xl border border-gray-800 bg-gray-900 p-4 transition-all hover:border-primary/30 hover:bg-primary-light/50"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary-light text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-100 transition-colors group-hover:text-primary">
                        {action.label}
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-gray-500">
                        {action.desc}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-500 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                );
              })}
            </div>
          </section>

          <Card>
            <h2 className="mb-4 text-sm font-bold text-gray-100">Recent activity</h2>
            {metrics?.recentActivity?.length > 0 ? (
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
                      <p className="text-sm font-medium text-gray-100">
                        {log.details?.assetName ? (
                          <span className="font-bold">{log.details.assetName}</span>
                        ) : (
                          "Asset"
                        )}{" "}
                        — {String(log.action ?? "").replace(/_/g, " ")}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                        {log.details?.reason ||
                          log.details?.notes ||
                          `Entity: ${log.entityType}`}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-gray-500">
                      {dayjs(log.createdAt).fromNow()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-700 bg-gray-950 px-4 py-8 text-center text-sm text-gray-500">
                No recent activity recorded today.
              </div>
            )}
          </Card>
        </>
      )}
    </PageShell>
  );
}
