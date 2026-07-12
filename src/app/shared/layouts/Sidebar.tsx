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
  Plus
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

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user?.role ?? "employee") as string;
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.employee;

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-white border-r border-gray-800 shrink-0 z-20">
      {/* Brand Logo Section */}
      <div className="h-20 flex items-center px-6 mt-2">
        <div className="flex items-center gap-3">
          {/* Stylized Orange Logo (SubMan-style) */}
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-md shadow-primary/20 transform rotate-6">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-gray-900 tracking-tight leading-none">AssetFlow</span>
            <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1">
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>
      </div>

      {/* Prominent Action Button (+ Add Asset) */}
      <div className="px-4 mb-4">
        <button className="w-full h-11 bg-primary hover:bg-primary-hover text-white border-none rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
          <Plus className="w-4 h-4" />
          <span>Add Asset</span>
        </button>
      </div>

      {/* User Info Widget */}
      <div className="flex items-center gap-3 px-4 py-3 mx-3 mb-4 rounded-xl bg-gray-50 border border-gray-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-light text-primary font-bold text-sm shrink-0">
          {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <div className="min-w-0">
          <p className="text-gray-800 text-sm font-semibold truncate leading-tight">{session?.user?.name ?? "User"}</p>
          <p className="text-gray-400 text-xs truncate mt-0.5">{session?.user?.email ?? ""}</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 pt-2 pb-2 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider px-3 mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? `bg-primary-light text-primary font-bold shadow-sm`
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600"}`} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5 border-t border-gray-800 pt-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
