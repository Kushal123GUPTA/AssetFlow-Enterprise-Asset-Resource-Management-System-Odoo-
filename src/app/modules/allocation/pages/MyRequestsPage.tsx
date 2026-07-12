"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { allocationService } from "../services/AllocationService";
import type {
  MyAllocation,
  ReturnRequest,
  TransferRequest,
  TransferTargets,
} from "../types/allocation.types";
import { ApiError } from "@/lib/fetchJson";
import PageHeader, { PageShell } from "@/app/shared/components/PageHeader";

type Tab = "return" | "transfer" | "history";

export default function MyRequestsPage() {
  const searchParams = useSearchParams();
  const initialTab = ((searchParams.get("tab") as Tab) || "return") as Tab;
  const prefillAllocationId = searchParams.get("allocationId") ?? "";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [allocations, setAllocations] = useState<MyAllocation[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [targets, setTargets] = useState<TransferTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [returnForm, setReturnForm] = useState({
    allocationId: prefillAllocationId,
    reason: "",
    conditionNotes: "",
    preferredReturnDate: "",
    remarks: "",
  });

  const [transferForm, setTransferForm] = useState({
    allocationId: prefillAllocationId,
    destinationType: "employee" as "employee" | "department",
    toEmployeeId: "",
    toDepartmentId: "",
    reason: "",
    notes: "",
  });

  // Keep URL-driven defaults in sync when query changes without an effect cascade
  const activeTab =
    searchParams.get("tab") === "transfer" ||
    searchParams.get("tab") === "history" ||
    searchParams.get("tab") === "return"
      ? (searchParams.get("tab") as Tab)
      : tab;
  const urlAllocationId = searchParams.get("allocationId") ?? "";
  const returnAllocationId = returnForm.allocationId || urlAllocationId;
  const transferAllocationId = transferForm.allocationId || urlAllocationId;

  const refresh = async () => {
    const [mine, ret, tr, tgt] = await Promise.all([
      allocationService.listMine(),
      allocationService.listReturns(),
      allocationService.listTransfers(),
      allocationService.listTransferTargets(),
    ]);
    setAllocations(mine);
    setReturns(ret);
    setTransfers(tr);
    setTargets(tgt);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load requests");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allocationOptions = useMemo(() => allocations, [allocations]);

  async function submitReturn(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setSubmitting(true);
    try {
      await allocationService.createReturn({
        allocationId: returnAllocationId,
        reason: returnForm.reason || undefined,
        conditionNotes: returnForm.conditionNotes || undefined,
        preferredReturnDate: returnForm.preferredReturnDate || undefined,
        remarks: returnForm.remarks || undefined,
      });
      setMessage(
        "Return request submitted. The asset stays allocated until a manager completes the return."
      );
      setReturnForm((f) => ({
        ...f,
        reason: "",
        conditionNotes: "",
        preferredReturnDate: "",
        remarks: "",
      }));
      await refresh();
      setTab("history");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit return request");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitTransfer(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setSubmitting(true);
    try {
      await allocationService.createTransfer({
        allocationId: transferAllocationId,
        toEmployeeId:
          transferForm.destinationType === "employee"
            ? transferForm.toEmployeeId || undefined
            : undefined,
        toDepartmentId:
          transferForm.destinationType === "department"
            ? transferForm.toDepartmentId || undefined
            : undefined,
        reason: transferForm.reason || undefined,
        notes: transferForm.notes || undefined,
      });
      setMessage(
        "Transfer request submitted. Allocation is unchanged until a manager approves."
      );
      setTransferForm((f) => ({
        ...f,
        toEmployeeId: "",
        toDepartmentId: "",
        reason: "",
        notes: "",
      }));
      await refresh();
      setTab("history");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit transfer request");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading requests…
      </div>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="My workspace"
        title="Return / Transfer"
        description="Initiate requests only. Managers approve and complete the change."
      />

      <div className="flex gap-2 flex-wrap">
        {(
          [
            ["return", "Request Return"],
            ["transfer", "Request Transfer"],
            ["history", "My Requests"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`text-xs px-3 py-2 rounded-xl border ${
              activeTab === key
                ? "bg-primary text-white border-primary"
                : "bg-gray-800 text-gray-300 border-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm p-4">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-4">
          {error}
        </div>
      )}

      {activeTab === "return" && (
        <form
          onSubmit={submitReturn}
          className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4"
        >
          <label className="block text-sm text-gray-300">
            Allocated asset
            <select
              required
              value={returnAllocationId}
              onChange={(e) =>
                setReturnForm((f) => ({ ...f, allocationId: e.target.value }))
              }
              className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm"
            >
              <option value="">Select asset…</option>
              {allocationOptions.map((a) => (
                <option key={a.allocationId} value={a.allocationId}>
                  {a.assetName} ({a.assetTag})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-gray-300">
            Reason
            <textarea
              value={returnForm.reason}
              onChange={(e) => setReturnForm((f) => ({ ...f, reason: e.target.value }))}
              className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm min-h-20"
            />
          </label>
          <label className="block text-sm text-gray-300">
            Condition notes
            <textarea
              value={returnForm.conditionNotes}
              onChange={(e) =>
                setReturnForm((f) => ({ ...f, conditionNotes: e.target.value }))
              }
              className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm min-h-20"
            />
          </label>
          <label className="block text-sm text-gray-300">
            Preferred return date
            <input
              type="date"
              value={returnForm.preferredReturnDate}
              onChange={(e) =>
                setReturnForm((f) => ({ ...f, preferredReturnDate: e.target.value }))
              }
              className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-gray-300">
            Additional remarks
            <textarea
              value={returnForm.remarks}
              onChange={(e) => setReturnForm((f) => ({ ...f, remarks: e.target.value }))}
              className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm min-h-16"
            />
          </label>
          <button
            type="submit"
            disabled={submitting || allocationOptions.length === 0}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit return request"}
          </button>
        </form>
      )}

      {activeTab === "transfer" && (
        <form
          onSubmit={submitTransfer}
          className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4"
        >
          <label className="block text-sm text-gray-300">
            Allocated asset
            <select
              required
              value={transferAllocationId}
              onChange={(e) =>
                setTransferForm((f) => ({ ...f, allocationId: e.target.value }))
              }
              className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm"
            >
              <option value="">Select asset…</option>
              {allocationOptions.map((a) => (
                <option key={a.allocationId} value={a.allocationId}>
                  {a.assetName} ({a.assetTag})
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-3 text-sm text-gray-300">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={transferForm.destinationType === "employee"}
                onChange={() =>
                  setTransferForm((f) => ({ ...f, destinationType: "employee" }))
                }
              />
              Employee
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={transferForm.destinationType === "department"}
                onChange={() =>
                  setTransferForm((f) => ({ ...f, destinationType: "department" }))
                }
              />
              Department
            </label>
          </div>
          {transferForm.destinationType === "employee" ? (
            <label className="block text-sm text-gray-300">
              Destination employee
              <select
                required
                value={transferForm.toEmployeeId}
                onChange={(e) =>
                  setTransferForm((f) => ({ ...f, toEmployeeId: e.target.value }))
                }
                className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm"
              >
                <option value="">Select employee…</option>
                {targets?.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block text-sm text-gray-300">
              Destination department
              <select
                required
                value={transferForm.toDepartmentId}
                onChange={(e) =>
                  setTransferForm((f) => ({ ...f, toDepartmentId: e.target.value }))
                }
                className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm"
              >
                <option value="">Select department…</option>
                {targets?.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-sm text-gray-300">
            Transfer reason
            <textarea
              value={transferForm.reason}
              onChange={(e) =>
                setTransferForm((f) => ({ ...f, reason: e.target.value }))
              }
              className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm min-h-20"
            />
          </label>
          <label className="block text-sm text-gray-300">
            Notes
            <textarea
              value={transferForm.notes}
              onChange={(e) => setTransferForm((f) => ({ ...f, notes: e.target.value }))}
              className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm min-h-16"
            />
          </label>
          <button
            type="submit"
            disabled={submitting || allocationOptions.length === 0}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit transfer request"}
          </button>
        </form>
      )}

      {activeTab === "history" && (
        <div className="space-y-6">
          <section className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
            <h2 className="text-gray-200 font-semibold text-sm mb-3">Return requests</h2>
            {returns.length === 0 ? (
              <p className="text-gray-500 text-sm">No return requests yet.</p>
            ) : (
              <div className="space-y-2">
                {returns.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-3 text-sm text-gray-300"
                  >
                    <p className="font-medium">
                      {r.assetName} ({r.assetTag}) · {r.status.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted {new Date(r.createdAt).toLocaleString()}
                    </p>
                    {r.rejectionReason && (
                      <p className="text-xs text-red-700 mt-1">{r.rejectionReason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
            <h2 className="text-gray-200 font-semibold text-sm mb-3">Transfer requests</h2>
            {transfers.length === 0 ? (
              <p className="text-gray-500 text-sm">No transfer requests yet.</p>
            ) : (
              <div className="space-y-2">
                {transfers.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-3 text-sm text-gray-300"
                  >
                    <p className="font-medium">
                      {t.assetName} ({t.assetTag}) · {t.status.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      To {t.toEmployeeName ?? t.toDepartmentName ?? "—"} ·{" "}
                      {new Date(t.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}
