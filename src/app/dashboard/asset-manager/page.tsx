"use client";

import { Package, GitMerge, ArrowLeftRight, Wrench, ClipboardCheck, RotateCcw, AlertTriangle, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const KPI_CARDS = [
  { label: "Total Assets", value: "342", change: "8 registered today", icon: Package, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10 border-blue-500/20" },
  { label: "Active Allocations", value: "218", change: "12 overdue", icon: GitMerge, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { label: "Pending Transfers", value: "9", change: "3 awaiting approval", icon: ArrowLeftRight, color: "from-violet-500 to-purple-600", bg: "bg-violet-500/10 border-violet-500/20" },
  { label: "Maintenance Requests", value: "14", change: "5 critical priority", icon: Wrench, color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10 border-amber-500/20" },
];

const QUICK_LINKS = [
  { label: "Register Asset", href: "/dashboard/asset-manager/assets", icon: Package, desc: "Add new assets to the registry", badge: null },
  { label: "Allocate Assets", href: "/dashboard/asset-manager/allocations", icon: GitMerge, desc: "Assign assets to employees or departments", badge: null },
  { label: "Approve Transfers", href: "/dashboard/asset-manager/transfers", icon: ArrowLeftRight, desc: "Review and approve transfer requests", badge: "3 pending" },
  { label: "Maintenance Queue", href: "/dashboard/asset-manager/maintenance", icon: Wrench, desc: "Approve & assign technicians", badge: "14 open" },
  { label: "Audit Discrepancies", href: "/dashboard/asset-manager/audit", icon: ClipboardCheck, desc: "Resolve missing or damaged asset reports", badge: "7 open" },
  { label: "Asset Returns", href: "/dashboard/asset-manager/returns", icon: RotateCcw, desc: "Approve returns & log condition notes", badge: "5 pending" },
];

const MAINTENANCE_ITEMS = [
  { asset: "Dell XPS 15 #004", issue: "Screen flickering", priority: "high", status: "pending" },
  { asset: "HP LaserJet Pro #012", issue: "Paper jam recurring", priority: "medium", status: "approved" },
  { asset: "MacBook Pro M3 #007", issue: "Battery not charging", priority: "critical", status: "pending" },
];

const PRIORITY_COLOR: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400",
  high: "bg-orange-500/15 text-orange-400",
  medium: "bg-amber-500/15 text-amber-400",
  low: "bg-green-500/15 text-green-400",
};

export default function AssetManagerDashboard() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Asset Manager Dashboard
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Welcome, {session?.user?.name} · Manage, allocate and approve assets across the organization
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`rounded-2xl border p-5 ${kpi.bg} backdrop-blur-sm`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{kpi.value}</p>
                  <p className="text-gray-500 text-xs mt-1">{kpi.change}</p>
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
        <h2 className="text-gray-200 font-semibold mb-4">Asset Management Modules</h2>
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
                    <p className="text-gray-100 font-medium text-sm">{link.label}</p>
                    {link.badge && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-medium">{link.badge}</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5 truncate">{link.desc}</p>
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
              <Wrench className="w-4 h-4 text-amber-400" />
              <h3 className="text-gray-200 font-semibold text-sm">Maintenance Queue</h3>
            </div>
            <Link href="/dashboard/asset-manager/maintenance" className="text-xs text-blue-400 hover:text-blue-300">View all</Link>
          </div>
          <div className="space-y-3">
            {MAINTENANCE_ITEMS.map((item) => (
              <div key={item.asset} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                <div>
                  <p className="text-gray-200 text-sm font-medium">{item.asset}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{item.issue}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLOR[item.priority]}`}>{item.priority}</span>
                  {item.status === "pending" ? (
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transfer approval preview */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-violet-400" />
              <h3 className="text-gray-200 font-semibold text-sm">Pending Transfers & Returns</h3>
            </div>
            <Link href="/dashboard/asset-manager/transfers" className="text-xs text-blue-400 hover:text-blue-300">View all</Link>
          </div>
          <div className="space-y-3">
            {[
              { from: "Engineering → HR", asset: "iPad Pro 12.9 #021", type: "Transfer" },
              { from: "John D. → Return", asset: "Logitech MX Keys #008", type: "Return" },
              { from: "Finance → Operations", asset: "Projector Epson #003", type: "Transfer" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                <div>
                  <p className="text-gray-200 text-sm font-medium">{item.asset}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{item.from}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.type === "Return" ? "bg-emerald-500/15 text-emerald-400" : "bg-violet-500/15 text-violet-400"}`}>{item.type}</span>
                  <div className="flex gap-1">
                    <button className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/40 transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                    <button className="w-6 h-6 rounded-md bg-red-500/20 flex items-center justify-center hover:bg-red-500/40 transition-colors">
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
