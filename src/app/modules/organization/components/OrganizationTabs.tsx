"use client";

import Link from "next/link";

const TABS = [
  { key: "departments", label: "Departments", href: "/dashboard/admin/departments" },
  { key: "categories", label: "Categories", href: "/dashboard/admin/categories" },
  { key: "employees", label: "Employees", href: "/dashboard/admin/employees" },
] as const;

type Props = {
  active?: "departments" | "categories" | "employees";
};

/** Lightweight tab strip linking to org setup sections (full UI is /organization). */
export default function OrganizationTabs({ active }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Link
        href="/dashboard/admin/organization"
        className="rounded-xl px-3 py-1.5 text-xs font-semibold border border-primary bg-primary text-white"
      >
        All tabs
      </Link>
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold border ${
            active === t.key
              ? "border-gray-600 bg-gray-800 text-gray-100"
              : "border-gray-800 bg-gray-900 text-gray-400 hover:text-gray-200"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
