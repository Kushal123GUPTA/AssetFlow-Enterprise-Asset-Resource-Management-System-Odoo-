"use client";

import { Suspense } from "react";
import MyRequestsPage from "@/app/modules/allocation/pages/MyRequestsPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-sm">Loading…</div>}>
      <MyRequestsPage />
    </Suspense>
  );
}
