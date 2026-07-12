"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Package,
  GitMerge,
  ArrowLeftRight,
  Wrench,
  ClipboardCheck,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { message } from "antd";

interface DashboardStats {
  totalAssets: number;
  activeAllocations: number;
  overdueAllocations: number;
  pendingTransfers: number;
  maintenanceRequests: number;
  recentMaintenance: Array<{
    id: string;
    issueDescription: string;
    priority: "low" | "medium" | "high" | "critical";
    status: string;
    assetName: string;
    assetTag: string;
  }>;
  recentTransfers: Array<{
    id: string;
    asset: string;
    from: string;
    type: "Transfer";
  }>;
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: "bg-red-500/15 text-red-500",
  high: "bg-orange-500/15 text-orange-500",
  medium: "bg-amber-500/15 text-amber-600",
  low: "bg-green-500/15 text-green-600",
};

export default function AssetManagerDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/assets/dashboard-stats");
      setStats(res.data.data);
    } catch (err: any) {
      console.error(err);
      message.error("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleApproveTransfer = async (transferId: string) => {
    try {
      await axios.post("/api/assets/transfer-approve", { transferRequestId: transferId });
      message.success("Transfer request approved");
      fetchDashboardStats();
    } catch (err: any) {
      message.error(err.response?.data?.error ?? "Failed to approve transfer");
    }
  };

  const handleRejectTransfer = async (transferId: string) => {
    const reason = window.prompt("Reason for rejection:");
    if (reason === null) return;
    try {
      await axios.post("/api/assets/transfer-reject", { transferRequestId: transferId, reason });
      message.success("Transfer request rejected");
      fetchDashboardStats();
    } catch (err: any) {
      message.error(err.response?.data?.error ?? "Failed to reject transfer");
    }
  };

  const KPI_CARDS = [
    {
      label: "Total Assets",
      value: stats?.totalAssets ?? 0,
      change: "In catalog",
      icon: Package,
      color: "from-blue-500 to-cyan-500",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Active Allocations",
      value: stats?.activeAllocations ?? 0,
      change: `${stats?.overdueAllocations ?? 0} overdue`,
      icon: GitMerge,
      color: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Pending Transfers",
      value: stats?.pendingTransfers ?? 0,
      change: "Awaiting approval",
      icon: ArrowLeftRight,
      color: "from-violet-500 to-purple-600",
      bg: "bg-violet-500/10 border-violet-500/20",
    },
    {
      label: "Maintenance Requests",
      value: stats?.maintenanceRequests ?? 0,
      change: "Open tickets",
      icon: Wrench,
      color: "from-amber-500 to-orange-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
  ];

  const QUICK_LINKS = [
    { label: "Register Asset", href: "/dashboard/asset-manager/assets", icon: Package, desc: "Add new assets to the registry", badge: null },
    { label: "Allocate Assets", href: "/dashboard/asset-manager/allocations", icon: GitMerge, desc: "Assign assets to employees or departments", badge: null },
    {
      label: "Approve Transfers",
      href: "/dashboard/asset-manager/transfers",
      icon: ArrowLeftRight,
      desc: "Review and approve transfer requests",
      badge: stats && stats.pendingTransfers > 0 ? `${stats.pendingTransfers} pending` : null,
    },
    {
      label: "Maintenance Queue",
      href: "/dashboard/asset-manager/maintenance",
      icon: Wrench,
      desc: "Approve & assign technicians",
      badge: stats && stats.maintenanceRequests > 0 ? `${stats.maintenanceRequests} open` : null,
    },
    { label: "Audit Discrepancies", href: "/dashboard/asset-manager/audit", icon: ClipboardCheck, desc: "Resolve missing or damaged asset reports", badge: null },
    { label: "Asset Returns", href: "/dashboard/asset-manager/returns", icon: RotateCcw, desc: "Approve returns & log condition notes", badge: null },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">
            Asset Manager Dashboard
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Welcome, {session?.user?.name} · Manage, allocate and approve assets across the organization
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDashboardStats}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-none bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold transition-all disabled:opacity-50 !bg-gray-800/80 !text-gray-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`rounded-2xl border p-5 ${kpi.bg} backdrop-blur-sm`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-3xl font-extrabold text-gray-100 mt-1">{loading ? "..." : kpi.value}</p>
                  <p className="text-gray-500 text-xs mt-1 font-medium">{kpi.change}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Module Quick Links */}
      <div>
        <h2 className="text-gray-100 font-bold mb-4 text-base">Asset Management Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="flex items-center gap-2">
                    <p className="text-gray-200 font-semibold text-sm">{link.label}</p>
                    {link.badge && (
                      <span className="text-[10px] bg-red-500/25 text-red-500 px-1.5 py-0.5 rounded-full font-bold">{link.badge}</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5 truncate font-medium">{link.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance queue preview */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-500" />
              <h3 className="text-gray-200 font-bold text-sm">Maintenance Queue</h3>
            </div>
            <Link href="/dashboard/asset-manager/maintenance" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">View all</Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-xs text-gray-500 py-6">Loading maintenance queue...</div>
            ) : !stats || stats.recentMaintenance.length === 0 ? (
              <div className="text-center text-xs text-gray-500 py-6 border border-dashed border-gray-800 rounded-xl">No active maintenance requests</div>
            ) : (
              stats.recentMaintenance.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                  <div>
                    <p className="text-gray-200 text-sm font-semibold">{item.assetName} ({item.assetTag})</p>
                    <p className="text-gray-500 text-xs mt-0.5 font-medium">{item.issueDescription}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLOR[item.priority] || "bg-gray-500/15 text-gray-500"}`}>
                      {item.priority}
                    </span>
                    {item.status === "pending" ? (
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transfer approval preview */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-violet-500" />
              <h3 className="text-gray-200 font-bold text-sm">Pending Transfers</h3>
            </div>
            <Link href="/dashboard/asset-manager/transfers" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">View all</Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-xs text-gray-500 py-6">Loading pending transfers...</div>
            ) : !stats || stats.recentTransfers.length === 0 ? (
              <div className="text-center text-xs text-gray-500 py-6 border border-dashed border-gray-800 rounded-xl">No pending transfer requests</div>
            ) : (
              stats.recentTransfers.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                  <div>
                    <p className="text-gray-200 text-sm font-semibold">{item.asset}</p>
                    <p className="text-gray-500 text-xs mt-0.5 font-medium">{item.from}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-500">
                      {item.type}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApproveTransfer(item.id)}
                        className="w-6 h-6 rounded-md !bg-emerald-500/20 flex items-center justify-center hover:!bg-emerald-500/40 transition-colors !border-none !outline-none"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectTransfer(item.id)}
                        className="w-6 h-6 rounded-md !bg-red-500/20 flex items-center justify-center hover:!bg-red-500/40 transition-colors !border-none !outline-none"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
