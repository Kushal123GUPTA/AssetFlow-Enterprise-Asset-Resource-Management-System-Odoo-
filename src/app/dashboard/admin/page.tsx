"use client";

import { Building2, Tag, ClipboardList, Users, BarChart3, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const KPI_CARDS = [
  { label: "Total Departments", value: "12", change: "+2 this month", icon: Building2, color: "from-violet-500 to-purple-600", bg: "bg-violet-500/10 border-violet-500/20" },
  { label: "Asset Categories", value: "24", change: "6 newly added", icon: Tag, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10 border-blue-500/20" },
  { label: "Active Audit Cycles", value: "3", change: "1 closing soon", icon: ClipboardList, color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10 border-amber-500/20" },
  { label: "Total Employees", value: "148", change: "4 pending role setup", icon: Users, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
];

const QUICK_LINKS = [
  { label: "Manage Departments", href: "/dashboard/admin/departments", icon: Building2, desc: "Add, edit, or restructure departments" },
  { label: "Asset Categories", href: "/dashboard/admin/categories", icon: Tag, desc: "Configure category hierarchies & fields" },
  { label: "Audit Cycles", href: "/dashboard/admin/audit-cycles", icon: ClipboardList, desc: "Plan and manage audit cycles" },
  { label: "Employee & Role Setup", href: "/dashboard/admin/employees", icon: Users, desc: "Assign roles and manage the directory" },
  { label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3, desc: "Org-wide asset utilization reports" },
];

export default function AdminDashboard() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Administrator · Organization Overview
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
        <h2 className="text-gray-200 font-semibold mb-4">Organization Setup Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-violet-500/50 hover:bg-gray-800/80 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0 group-hover:bg-violet-500/25 transition-colors">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-100 font-medium text-sm">{link.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5 truncate">{link.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Analytics preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-gray-200 font-semibold text-sm">Asset Utilization by Department</h3>
          </div>
          {["Engineering", "Operations", "HR", "Finance"].map((dept, i) => {
            const pct = [87, 64, 42, 78][i];
            return (
              <div key={dept} className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{dept}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-800">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-gray-200 font-semibold text-sm">Pending Actions</h3>
          </div>
          {[
            { label: "Employees missing role assignment", count: 4, type: "warn" },
            { label: "Audit cycles ending this week", count: 1, type: "warn" },
            { label: "New department requests", count: 2, type: "info" },
            { label: "Discrepancy reports unresolved", count: 7, type: "error" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
              <div className="flex items-center gap-2">
                {item.type === "error" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                ) : item.type === "warn" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                )}
                <span className="text-gray-400 text-xs">{item.label}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                item.type === "error" ? "bg-red-500/15 text-red-400" :
                item.type === "warn" ? "bg-amber-500/15 text-amber-400" :
                "bg-blue-500/15 text-blue-400"
              }`}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
