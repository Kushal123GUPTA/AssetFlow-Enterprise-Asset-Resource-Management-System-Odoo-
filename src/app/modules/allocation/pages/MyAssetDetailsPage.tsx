"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { allocationService } from "../services/AllocationService";
import type { MyAllocationDetail } from "../types/allocation.types";
import { ApiError } from "@/lib/fetchJson";
import PageHeader, { PageShell } from "@/app/shared/components/PageHeader";

export default function MyAssetDetailsPage({
  allocationId,
}: {
  allocationId: string;
}) {
  const [data, setData] = useState<MyAllocationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const detail = await allocationService.getMine(allocationId);
        if (!cancelled) setData(detail);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load details");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allocationId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading asset details…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-4">
        {error ?? "Allocation not found"}
      </div>
    );
  }

  return (
    <PageShell>
      <div>
        <Link
          href="/dashboard/employee/assets"
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          ← My Assets
        </Link>
        <PageHeader
          className="mt-3"
          title={data.assetName}
          description={`${data.assetTag}${
            data.categoryName ? ` · ${data.categoryName}` : ""
          }${data.isOverdue ? " · Overdue" : ""}`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          ["Serial number", data.serialNumber ?? "—"],
          ["Condition", data.condition ?? "—"],
          ["Location", data.location ?? "—"],
          ["Asset status", data.assetStatus],
          ["Allocated", new Date(data.allocatedAt).toLocaleString()],
          ["Expected return", data.expectedReturnDate ?? "No return date"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl bg-gray-900 border border-gray-800 p-4"
          >
            <p className="text-gray-500 text-xs uppercase tracking-wide">{label}</p>
            <p className="text-gray-100 text-sm mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/dashboard/employee/maintenance?assetId=${data.assetId}`}
          className="text-xs px-3 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200"
        >
          Raise Maintenance
        </Link>
        <Link
          href={`/dashboard/employee/requests?tab=return&allocationId=${data.allocationId}`}
          className="text-xs px-3 py-2 rounded-xl bg-primary-light text-primary border border-primary/20"
        >
          Request Return
        </Link>
        <Link
          href={`/dashboard/employee/requests?tab=transfer&allocationId=${data.allocationId}`}
          className="text-xs px-3 py-2 rounded-xl bg-gray-800 text-gray-200 border border-gray-700"
        >
          Request Transfer
        </Link>
      </div>

      <section className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
        <h2 className="text-gray-200 font-semibold text-sm mb-3">Your allocation history</h2>
        {data.allocationHistory.length === 0 ? (
          <p className="text-gray-500 text-sm">No history available.</p>
        ) : (
          <div className="space-y-2">
            {data.allocationHistory.map((h) => (
              <div
                key={h.id}
                className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-3 text-xs text-gray-300"
              >
                <p>
                  {h.status.toUpperCase()} · from {new Date(h.allocatedAt).toLocaleDateString()}
                  {h.actualReturnDate
                    ? ` · returned ${new Date(h.actualReturnDate).toLocaleDateString()}`
                    : ""}
                </p>
                {h.returnConditionNotes && (
                  <p className="text-gray-500 mt-1">{h.returnConditionNotes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
        <h2 className="text-gray-200 font-semibold text-sm mb-3">Your maintenance history</h2>
        {data.maintenanceHistory.length === 0 ? (
          <p className="text-gray-500 text-sm">No maintenance requests yet.</p>
        ) : (
          <div className="space-y-2">
            {data.maintenanceHistory.map((m) => (
              <div
                key={m.id}
                className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-3 text-xs text-gray-300"
              >
                <p className="font-medium">
                  {m.issueTitle || "Maintenance request"} · {m.status.replaceAll("_", " ")}
                </p>
                <p className="text-gray-500 mt-1">{m.issueDescription}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
