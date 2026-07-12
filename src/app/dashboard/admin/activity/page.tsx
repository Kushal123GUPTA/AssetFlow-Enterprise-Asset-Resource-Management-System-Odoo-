"use client";

import ActivityLogTable from "@/app/modules/notifications/components/ActivityLogTable";
import PageHeader, { PageShell } from "@/app/shared/components/PageHeader";

export default function ActivityLogsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Audit trail"
        title="Activity Logs"
        description="Who did what, and when — across your organization"
      />
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
        <ActivityLogTable limit={50} />
      </div>
    </PageShell>
  );
}
