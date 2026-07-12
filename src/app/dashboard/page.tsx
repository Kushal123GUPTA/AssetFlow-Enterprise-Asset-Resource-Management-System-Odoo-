"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const ROLE_REDIRECT: Record<string, string> = {
  admin: "/dashboard/admin",
  asset_manager: "/dashboard/asset-manager",
  department_head: "/dashboard/department-head",
  employee: "/dashboard/employee",
};

export default function DashboardRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role) {
      const target = ROLE_REDIRECT[session.user.role] ?? "/dashboard/employee";
      router.replace(target);
    }
  }, [status, session, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-gray-400 text-sm">Loading your workspace…</p>
      </div>
    </div>
  );
}
