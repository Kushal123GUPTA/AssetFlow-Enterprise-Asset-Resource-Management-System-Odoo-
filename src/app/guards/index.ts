import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Route/role guards — implemented via Next.js middleware (src/middleware.ts).
 * This module re-exports helpers for server components if needed later.
 */

export const ROLE_HOME: Record<string, string> = {
  admin: "/dashboard/admin",
  asset_manager: "/dashboard/asset-manager",
  department_head: "/dashboard/department-head",
  employee: "/dashboard/employee",
};

export function homeForRole(role: string): string {
  return ROLE_HOME[role] ?? "/dashboard/employee";
}

export { withAuth, NextResponse };
