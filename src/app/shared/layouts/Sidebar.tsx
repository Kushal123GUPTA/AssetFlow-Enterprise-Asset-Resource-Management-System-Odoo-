"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Tag,
  ClipboardList,
  Users,
  BarChart3,
  Package,
  GitMerge,
  Wrench,
  ClipboardCheck,
  Calendar,
  ArrowLeftRight,
  RotateCcw,
  Bell,
  LogOut,
  ChevronRight,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Departments", href: "/dashboard/admin/departments", icon: Building2 },
    { label: "Asset Categories", href: "/dashboard/admin/categories", icon: Tag },
    { label: "Audit Cycles", href: "/dashboard/admin/audit-cycles", icon: ClipboardList },
    { label: "Employees & Roles", href: "/dashboard/admin/employees", icon: Users },
    { label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
  ],
  asset_manager: [
    { label: "Dashboard", href: "/dashboard/asset-manager", icon: LayoutDashboard },
    { label: "Assets", href: "/dashboard/asset-manager/assets", icon: Package },
    { label: "Allocations", href: "/dashboard/asset-manager/allocations", icon: GitMerge },
    { label: "Transfer Requests", href: "/dashboard/asset-manager/transfers", icon: ArrowLeftRight },
    { label: "Maintenance", href: "/dashboard/asset-manager/maintenance", icon: Wrench },
    { label: "Audit & Discrepancies", href: "/dashboard/asset-manager/audit", icon: ClipboardCheck },
    { label: "Asset Returns", href: "/dashboard/asset-manager/returns", icon: RotateCcw },
  ],
  department_head: [
    { label: "Dashboard", href: "/dashboard/department-head", icon: LayoutDashboard },
    { label: "Department Assets", href: "/dashboard/department-head/assets", icon: Package },
    { label: "Allocation Requests", href: "/dashboard/department-head/allocations", icon: GitMerge },
    { label: "Transfer Requests", href: "/dashboard/department-head/transfers", icon: ArrowLeftRight },
    { label: "Resource Bookings", href: "/dashboard/department-head/bookings", icon: Calendar },
  ],
  employee: [
    { label: "Dashboard", href: "/dashboard/employee", icon: LayoutDashboard },
    { label: "My Assets", href: "/dashboard/employee/assets", icon: Package },
    { label: "Book Resources", href: "/dashboard/employee/bookings", icon: Calendar },
    { label: "Maintenance Requests", href: "/dashboard/employee/maintenance", icon: Wrench },
    { label: "Return / Transfer", href: "/dashboard/employee/requests", icon: RotateCcw },
    { label: "Notifications", href: "/dashboard/employee/notifications", icon: Bell },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  asset_manager: "Asset Manager",
  department_head: "Department Head",
  employee: "Employee",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "from-violet-600 to-purple-700",
  asset_manager: "from-blue-600 to-cyan-600",
  department_head: "from-emerald-600 to-teal-600",
  employee: "from-orange-500 to-amber-500",
};

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user?.role ?? "employee") as string;
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.employee;
  const gradient = ROLE_COLORS[role] ?? ROLE_COLORS.employee;

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-950 border-r border-gray-800/60 shrink-0">
      {/* Brand */}
      <div className={`flex items-center gap-3 px-5 py-5 bg-gradient-to-r ${gradient}`}>
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-base leading-tight">AssetFlow</p>
          <p className="text-white/70 text-xs">{ROLE_LABELS[role]}</p>
        </div>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 px-4 py-3 mx-3 mt-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
        <div className={`flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br ${gradient} text-white font-semibold text-sm shrink-0`}>
          {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <div className="min-w-0">
          <p className="text-gray-100 text-sm font-medium truncate">{session?.user?.name ?? "User"}</p>
          <p className="text-gray-400 text-xs truncate">{session?.user?.email ?? ""}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-5 pb-2 space-y-1">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest px-3 mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? `bg-gradient-to-r ${gradient} text-white shadow-lg shadow-black/20`
                  : "text-gray-400 hover:text-gray-100 hover:bg-gray-800/70"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-gray-500 group-hover:text-gray-300"}`} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-white/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
