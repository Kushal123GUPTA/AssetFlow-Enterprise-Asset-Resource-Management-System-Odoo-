"use client";

import { Suspense } from "react";
import MyMaintenanceRequestsPage from "@/app/modules/maintenance/pages/MyMaintenanceRequestsPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-sm">Loading…</div>}>
      <MyMaintenanceRequestsPage />
    </Suspense>
  );
}
