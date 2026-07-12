"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
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
    { label: "Organization Setup", href: "/dashboard/admin/organization", icon: Building2 },
    { label: "Audit Cycles", href: "/dashboard/admin/audit-cycles", icon: ClipboardList },
    { label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
    { label: "Activity Logs", href: "/dashboard/admin/activity", icon: ClipboardList },
    { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ],
  asset_manager: [
    { label: "Dashboard", href: "/dashboard/asset-manager", icon: LayoutDashboard },
    { label: "Assets", href: "/dashboard/asset-manager/assets", icon: Package },
    { label: "Allocations", href: "/dashboard/asset-manager/allocations", icon: GitMerge },
    { label: "Transfer Requests", href: "/dashboard/asset-manager/transfers", icon: ArrowLeftRight },
    { label: "Maintenance", href: "/dashboard/asset-manager/maintenance", icon: Wrench },
    { label: "Audit & Discrepancies", href: "/dashboard/asset-manager/audit", icon: ClipboardCheck },
    { label: "Asset Returns", href: "/dashboard/asset-manager/returns", icon: RotateCcw },
    { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ],
  department_head: [
    { label: "Dashboard", href: "/dashboard/department-head", icon: LayoutDashboard },
    { label: "Department Assets", href: "/dashboard/department-head/assets", icon: Package },
    { label: "Allocation Requests", href: "/dashboard/department-head/allocations", icon: GitMerge },
    { label: "Transfer Requests", href: "/dashboard/department-head/transfers", icon: ArrowLeftRight },
    { label: "Resource Bookings", href: "/dashboard/department-head/bookings", icon: Calendar },
    { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ],
  employee: [
    { label: "Dashboard", href: "/dashboard/employee", icon: LayoutDashboard },
    { label: "My Assets", href: "/dashboard/employee/assets", icon: Package },
    { label: "Book Resources", href: "/dashboard/employee/bookings", icon: Calendar },
    { label: "Maintenance Requests", href: "/dashboard/employee/maintenance", icon: Wrench },
    { label: "Return / Transfer", href: "/dashboard/employee/requests", icon: RotateCcw },
    { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
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
    <aside className="z-20 flex w-64 shrink-0 flex-col border-r border-gray-800 bg-gray-900 min-h-screen">
      <div className="mt-2 flex h-20 items-center px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/icon.png"
            alt="AssetFlow"
            width={40}
            height={40}
            className="rotate-6 rounded-xl shadow-md shadow-primary/20"
            priority
          />
          <div className="flex flex-col">
            <span className="text-xl font-black leading-none tracking-tight text-gray-100">
              AssetFlow
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 pb-2 pt-2">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.label === "Dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary-light font-bold text-primary shadow-sm"
                  : "text-gray-400 hover:bg-gray-950 hover:text-gray-100"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive
                    ? "text-primary"
                    : "text-gray-500 group-hover:text-gray-300"
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {isActive ? <ChevronRight className="h-3.5 w-3.5 text-primary" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 px-3 pb-5 pt-4">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400 transition-all duration-150 hover:bg-red-50 hover:text-red-500 !border-none !bg-transparent"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
