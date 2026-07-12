"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Loader2, Package } from "lucide-react";
import { allocationService } from "../services/AllocationService";
import type { MyAllocation } from "../types/allocation.types";
import { ApiError } from "@/lib/fetchJson";
import PageHeader, { PageShell } from "@/app/shared/components/PageHeader";
import Card from "@/app/shared/components/Card";

function StatusPill({ status, overdue }: { status: string; overdue?: boolean }) {
  const label = overdue ? "OVERDUE" : status.replaceAll("_", " ").toUpperCase();
  const color = overdue
    ? "bg-amber-500/15 text-amber-700"
    : status === "active"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-gray-500/15 text-gray-400";
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
}

export default function MyAssetsPage() {
  const [rows, setRows] = useState<MyAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await allocationService.listMine();
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load assets");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell>
      <PageHeader
        eyebrow="My workspace"
        title="My Assets"
        description="Assets currently allocated to you. You can request maintenance, return, or transfer."
      />

      {loading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading your allocations…
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-4">
          {error}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <Card className="p-10 text-center">
          <Package className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-200 font-medium">No assets allocated to you</p>
          <p className="text-gray-500 text-sm mt-1">
            When an asset is assigned, it will appear here.
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.allocationId}
            className="rounded-2xl bg-gray-900 border border-gray-800 p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-gray-100 font-semibold">{row.assetName}</h2>
                  <StatusPill status={row.allocationStatus} overdue={row.isOverdue} />
                  {row.isOverdue && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                      <AlertTriangle className="w-3 h-3" /> Return overdue
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  {row.assetTag}
                  {row.categoryName ? ` · ${row.categoryName}` : ""}
                  {row.serialNumber ? ` · SN ${row.serialNumber}` : ""}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Allocated {new Date(row.allocatedAt).toLocaleDateString()}
                  {row.expectedReturnDate
                    ? ` · Expected return ${row.expectedReturnDate}`
                    : " · No return date"}
                  {row.location ? ` · ${row.location}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/employee/assets/${row.allocationId}`}
                  className="text-xs px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700"
                >
                  View Details
                </Link>
                <Link
                  href={`/dashboard/employee/maintenance?assetId=${row.assetId}`}
                  className="text-xs px-3 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200"
                >
                  Raise Maintenance
                </Link>
                <Link
                  href={`/dashboard/employee/requests?tab=return&allocationId=${row.allocationId}`}
                  className="text-xs px-3 py-2 rounded-xl bg-primary-light text-primary border border-primary/20"
                >
                  Request Return
                </Link>
                <Link
                  href={`/dashboard/employee/requests?tab=transfer&allocationId=${row.allocationId}`}
                  className="text-xs px-3 py-2 rounded-xl bg-gray-800 text-gray-200 border border-gray-700"
                >
                  Request Transfer
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/dashboard/employee"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
      >
        Back to dashboard <ArrowRight className="w-3 h-3" />
      </Link>
    </PageShell>
  );
}
