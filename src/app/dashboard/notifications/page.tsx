"use client";

import { useSession } from "next-auth/react";
import MyNotificationsPage from "@/app/modules/notifications/pages/MyNotificationsPage";

const BACK: Record<string, string> = {
  admin: "/dashboard/admin",
  asset_manager: "/dashboard/asset-manager",
  department_head: "/dashboard/department-head",
  employee: "/dashboard/employee",
};

export default function NotificationsRoutePage() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "employee";
  return <MyNotificationsPage backHref={BACK[role] ?? "/dashboard"} />;
}
