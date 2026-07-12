"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Package,
  Calendar,
  Wrench,
  RotateCcw,
  ArrowRightLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Bell,
  Sparkles,
} from "lucide-react";
import { fetchJson, ApiError } from "@/lib/fetchJson";
import { PageShell } from "@/app/shared/components/PageHeader";
import Card from "@/app/shared/components/Card";

/**
 * Theme note: AssetFlow remaps Tailwind gray-* (gray-900 = white card, gray-100 = near-black text).
 * Prefer text-gray-100/200 for headings, text-gray-400/500 for muted, never text-gray-900 for copy.
 */

type EmployeeSummary = {
  allocatedAssetsCount: number;
  upcomingReturnCount: number;
  overdueCount: number;
  upcomingBookingsCount: number;
  activeMaintenanceCount: number;
  pendingReturnRequestCount: number;
  pendingTransferRequestCount: number;
  recentAssets: Array<{
    allocationId: string;
    assetName: string;
    assetTag: string;
    allocatedAt: string;
    expectedReturnDate: string | null;
    isOverdue: boolean;
  }>;
  upcomingBookings: Array<{
    id: string;
    assetName: string;
    startTime: string;
    endTime: string;
    status: string;
  }>;
};

const QUICK_ACTIONS = [
  {
    label: "My Assets",
    href: "/dashboard/employee/assets",
    icon: Package,
    desc: "View what’s allocated to you",
    accent: "bg-primary-light text-primary border-primary/20",
  },
  {
    label: "Book a resource",
    href: "/dashboard/employee/bookings",
    icon: Calendar,
    desc: "Reserve shared rooms or equipment",
    accent: "bg-primary-active text-primary border-primary/15",
  },
  {
    label: "Raise maintenance",
    href: "/dashboard/employee/maintenance",
    icon: Wrench,
    desc: "Report an issue on your assets",
    accent: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    label: "Request return",
    href: "/dashboard/employee/requests?tab=return",
    icon: RotateCcw,
    desc: "Start a return for an allocated asset",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    label: "Request transfer",
    href: "/dashboard/employee/requests?tab=transfer",
    icon: ArrowRightLeft,
    desc: "Transfer an asset to someone else",
    accent: "bg-gray-800 text-gray-300 border-gray-700",
  },
] as const;

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} · ${s.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })} – ${e.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[88px] rounded-2xl border border-gray-800 bg-gray-900 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function EmployeeDashboardPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<EmployeeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchJson<{ data: EmployeeSummary }>(
          "/api/dashboard/employee/summary"
        );
        if (!cancelled) setSummary(res.data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
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

  const kpis = [
    {
      label: "My assets",
      value: summary?.allocatedAssetsCount ?? "—",
      href: "/dashboard/employee/assets",
      hint: "Currently allocated",
      icon: Package,
    },
    {
      label: "Bookings",
      value: summary?.upcomingBookingsCount ?? "—",
      href: "/dashboard/employee/bookings",
      hint: "Upcoming & ongoing",
      icon: Calendar,
    },
    {
      label: "Maintenance",
      value: summary?.activeMaintenanceCount ?? "—",
      href: "/dashboard/employee/maintenance",
      hint: "Active requests",
      icon: Wrench,
    },
    {
      label: "Open requests",
      value:
        summary == null
          ? "—"
          : summary.pendingReturnRequestCount + summary.pendingTransferRequestCount,
      href: "/dashboard/employee/requests?tab=history",
      hint: "Returns & transfers",
      icon: RotateCcw,
    },
  ];

  const needsAttention =
    (summary?.overdueCount ?? 0) > 0 ||
    (summary?.upcomingReturnCount ?? 0) > 0 ||
    (summary?.pendingReturnRequestCount ?? 0) > 0;

  return (
    <PageShell className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary-light via-gray-900 to-gray-900 p-6 sm:p-7">
        <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Employee workspace
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-100">
              Hello, {firstName}
            </h1>
            {todayLabel ? (
              <p className="mt-1.5 text-sm text-gray-500">{todayLabel}</p>
            ) : (
              <p className="mt-1.5 text-sm text-gray-500">&nbsp;</p>
            )}
          </div>
          <Link
            href="/dashboard/notifications"
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-gray-800 bg-gray-900 px-3.5 py-2 text-sm font-semibold text-gray-200 shadow-sm hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Bell className="w-4 h-4" />
            Notifications
          </Link>
        </div>
      </section>

      {loading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            Loading your workspace…
          </div>
          <KpiSkeleton />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm p-4">
          {error}
        </div>
      )}

      {!loading && summary && needsAttention && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-950">Needs your attention</p>
              <p className="text-xs text-amber-900/80 mt-0.5">
                {summary.overdueCount > 0 && (
                  <span>
                    {summary.overdueCount} overdue allocation
                    {summary.overdueCount === 1 ? "" : "s"}
                  </span>
                )}
                {summary.overdueCount > 0 && summary.upcomingReturnCount > 0 && " · "}
                {summary.upcomingReturnCount > 0 && (
                  <span>
                    {summary.upcomingReturnCount} return
                    {summary.upcomingReturnCount === 1 ? "" : "s"} due soon
                  </span>
                )}
                {(summary.overdueCount > 0 || summary.upcomingReturnCount > 0) &&
                  summary.pendingReturnRequestCount > 0 &&
                  " · "}
                {summary.pendingReturnRequestCount > 0 && (
                  <span>
                    {summary.pendingReturnRequestCount} pending return request
                    {summary.pendingReturnRequestCount === 1 ? "" : "s"}
                  </span>
                )}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/employee/assets"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-3 py-2 text-xs font-bold text-white hover:bg-amber-800 transition-colors shrink-0"
          >
            Review assets
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      )}

      {!loading && !error && summary && (
        <>
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-100">At a glance</h2>
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Live from your account
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <Link
                    key={kpi.label}
                    href={kpi.href}
                    className="group rounded-2xl border border-gray-800 bg-gray-900 p-4 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {kpi.label}
                      </p>
                      <span className="rounded-lg bg-primary-light p-1.5 text-primary group-hover:scale-105 transition-transform">
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <p className="mt-2 text-3xl font-black tracking-tight text-gray-100">
                      {kpi.value}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{kpi.hint}</p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-gray-100 mb-3">Quick actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-3.5 rounded-2xl border border-gray-800 bg-gray-900 p-4 hover:bg-primary-light/50 hover:border-primary/30 transition-all"
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border shrink-0 ${action.accent}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-100 group-hover:text-primary transition-colors">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                        {action.desc}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card padding={false} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <Package className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-gray-100">Allocated assets</h3>
                </div>
                <Link
                  href="/dashboard/employee/assets"
                  className="text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  View all
                </Link>
              </div>

              {!summary.recentAssets.length ? (
                <div className="rounded-xl border border-dashed border-gray-700 bg-gray-950 px-4 py-8 text-center">
                  <Package className="mx-auto mb-2 h-6 w-6 text-gray-500" />
                  <p className="text-sm font-medium text-gray-200">No assets yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Allocations assigned to you will show up here.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {summary.recentAssets.map((asset) => (
                    <li key={asset.allocationId}>
                      <Link
                        href={`/dashboard/employee/assets/${asset.allocationId}`}
                        className="block rounded-xl border border-gray-800 bg-gray-950 p-3.5 hover:border-primary/35 hover:bg-primary-light/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-100 truncate">
                              {asset.assetName}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {asset.assetTag} · since {formatShortDate(asset.allocatedAt)}
                            </p>
                          </div>
                          {asset.isOverdue ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 shrink-0">
                              <AlertTriangle className="w-3 h-3" />
                              Overdue
                            </span>
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {asset.expectedReturnDate
                            ? `Due ${asset.expectedReturnDate}`
                            : "No return date"}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card padding={false} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-active text-primary">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-gray-100">Upcoming bookings</h3>
                </div>
                <Link
                  href="/dashboard/employee/bookings"
                  className="text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  Manage
                </Link>
              </div>

              {!summary.upcomingBookings.length ? (
                <div className="rounded-xl border border-dashed border-gray-700 bg-gray-950 px-4 py-8 text-center">
                  <Calendar className="mx-auto mb-2 h-6 w-6 text-gray-500" />
                  <p className="text-sm font-medium text-gray-200">No upcoming bookings</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Book a shared resource when you need one.
                  </p>
                  <Link
                    href="/dashboard/employee/bookings"
                    className="inline-flex mt-3 text-xs font-bold text-primary hover:text-primary-hover"
                  >
                    Book a resource →
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {summary.upcomingBookings.map((b) => (
                    <li
                      key={b.id}
                      className="rounded-xl border border-gray-800 bg-gray-950 p-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-100">{b.assetName}</p>
                        <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary shrink-0">
                          {b.status}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-gray-500">
                        {formatRange(b.startTime, b.endTime)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        </>
      )}
    </PageShell>
  );
}
