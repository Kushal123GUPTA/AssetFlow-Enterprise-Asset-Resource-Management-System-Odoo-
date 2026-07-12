"use client";

import { Package, GitMerge, ArrowLeftRight, Calendar, CheckCircle2, Clock, XCircle, ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const KPI_CARDS = [
  { label: "Dept Assets", value: "43", change: "All accounted for", icon: Package, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { label: "Allocated to Members", value: "38", change: "5 unallocated", icon: Users, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10 border-blue-500/20" },
  { label: "Pending Requests", value: "5", change: "2 allocation, 3 transfer", icon: GitMerge, color: "from-violet-500 to-purple-600", bg: "bg-violet-500/10 border-violet-500/20" },
  { label: "Active Bookings", value: "7", change: "3 upcoming today", icon: Calendar, color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10 border-amber-500/20" },
];

const QUICK_LINKS = [
  { label: "Department Assets", href: "/dashboard/department-head/assets", icon: Package, desc: "View all assets assigned to your department" },
  { label: "Allocation Requests", href: "/dashboard/department-head/allocations", icon: GitMerge, desc: "Approve allocation requests within your dept" },
  { label: "Transfer Requests", href: "/dashboard/department-head/transfers", icon: ArrowLeftRight, desc: "Approve intra-department transfer requests" },
  { label: "Book Resources", href: "/dashboard/department-head/bookings", icon: Calendar, desc: "Book shared resources on behalf of the dept" },
];

const DEPT_ASSETS = [
  { name: "MacBook Pro M3", tag: "AST-007", status: "allocated", employee: "Sarah K." },
  { name: "Dell Monitor 27\"", tag: "AST-022", status: "available", employee: "—" },
  { name: "iPhone 15 Pro", tag: "AST-041", status: "allocated", employee: "James T." },
  { name: "Epson Projector", tag: "AST-003", status: "allocated", employee: "Dept Pool" },
];

const STATUS_STYLE: Record<string, string> = {
  allocated: "bg-blue-500/15 text-blue-400",
  available: "bg-emerald-500/15 text-emerald-400",
  maintenance: "bg-amber-500/15 text-amber-400",
};

export default function DepartmentHeadDashboard() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Department Overview</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Welcome, {session?.user?.name} · Department Head · Engineering
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`rounded-2xl border p-5 ${kpi.bg}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{kpi.value}</p>
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

      {/* Modules */}
      <div>
        <h2 className="text-gray-200 font-semibold mb-4">Department Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-emerald-500/50 hover:bg-gray-800/80 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/25 transition-colors">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-100 font-medium text-sm">{link.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{link.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dept asset list */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <h3 className="text-gray-200 font-semibold text-sm">Department Assets</h3>
            </div>
            <Link href="/dashboard/department-head/assets" className="text-xs text-emerald-400 hover:text-emerald-300">View all</Link>
          </div>
          <div className="space-y-2">
            {DEPT_ASSETS.map((asset) => (
              <div key={asset.tag} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                <div>
                  <p className="text-gray-200 text-sm font-medium">{asset.name}</p>
                  <p className="text-gray-500 text-xs">{asset.tag} · {asset.employee}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[asset.status]}`}>
                  {asset.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending approvals */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-gray-200 font-semibold text-sm">Pending Approval Requests</h3>
          </div>
          <div className="space-y-3">
            {[
              { name: "Alice M.", request: "Allocate MacBook Air", type: "Allocation" },
              { name: "Bob R.", request: "Transfer Monitor to HR", type: "Transfer" },
              { name: "Carol S.", request: "Allocate iPad for design work", type: "Allocation" },
            ].map((req, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                <div>
                  <p className="text-gray-200 text-sm font-medium">{req.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{req.request}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${req.type === "Allocation" ? "bg-blue-500/15 text-blue-400" : "bg-violet-500/15 text-violet-400"}`}>
                    {req.type}
                  </span>
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
