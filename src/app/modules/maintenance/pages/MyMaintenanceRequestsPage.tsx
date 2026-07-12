"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ImagePlus, Loader2, Trash2, Wrench } from "lucide-react";
import {
  maintenanceService,
  type AllocatedAssetOption,
} from "../services/MaintenanceService";
import type { MyMaintenanceRequest } from "../types/maintenance.types";
import { ApiError } from "@/lib/fetchJson";
import PageHeader, { PageShell } from "@/app/shared/components/PageHeader";

const PRIORITIES = ["low", "medium", "high", "critical"] as const;

export default function MyMaintenanceRequestsPage() {
  const searchParams = useSearchParams();
  const prefAssetId = searchParams.get("assetId") ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [allocations, setAllocations] = useState<AllocatedAssetOption[]>([]);
  const [requests, setRequests] = useState<MyMaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    assetId: prefAssetId,
    issueTitle: "",
    issueDescription: "",
    priority: "medium",
    photoUrl: "",
  });

  const selectedAssetId = form.assetId || prefAssetId;

  const refresh = async () => {
    const [mine, reqs] = await Promise.all([
      maintenanceService.listAllocatedAssets(),
      maintenanceService.listMine(),
    ]);
    setAllocations(mine);
    setRequests(reqs);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load maintenance");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onPhotoSelected(file: File | null) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const localPreview = URL.createObjectURL(file);
      setPhotoPreview(localPreview);
      const url = await maintenanceService.uploadPhoto(file);
      setForm((f) => ({ ...f, photoUrl: url }));
    } catch (err) {
      setPhotoPreview(null);
      setForm((f) => ({ ...f, photoUrl: "" }));
      setError(err instanceof ApiError ? err.message : "Failed to upload photo");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  function clearPhoto() {
    if (photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    setForm((f) => ({ ...f, photoUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!selectedAssetId || !form.issueDescription.trim()) {
      setError("Asset and issue description are required");
      return;
    }
    if (uploading) {
      setError("Please wait for the photo upload to finish");
      return;
    }
    setSubmitting(true);
    try {
      await maintenanceService.create({
        assetId: selectedAssetId,
        issueTitle: form.issueTitle || undefined,
        issueDescription: form.issueDescription,
        priority: form.priority,
        photoUrl: form.photoUrl || undefined,
      });
      setMessage("Maintenance request submitted. Status updates are read-only after this.");
      clearPhoto();
      setForm((f) => ({
        ...f,
        issueTitle: "",
        issueDescription: "",
        photoUrl: "",
        priority: "medium",
      }));
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading maintenance…
      </div>
    );
  }

  const displayPhoto = photoPreview || form.photoUrl || null;

  return (
    <PageShell>
      <PageHeader
        eyebrow="My workspace"
        title="Maintenance Requests"
        description="Raise issues only for assets allocated to you. Approval and technician work are managed separately."
      />

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

      <form
        onSubmit={onSubmit}
        className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4"
      >
        <h2 className="text-gray-200 font-semibold text-sm flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-700" /> Raise request
        </h2>
        <label className="block text-sm text-gray-300">
          Allocated asset
          <select
            required
            value={selectedAssetId}
            onChange={(e) => setForm((f) => ({ ...f, assetId: e.target.value }))}
            className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm"
          >
            <option value="">Select asset…</option>
            {allocations.map((a) => (
              <option key={a.allocationId} value={a.assetId}>
                {a.assetName} ({a.assetTag})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-gray-300">
          Issue title
          <input
            value={form.issueTitle}
            onChange={(e) => setForm((f) => ({ ...f, issueTitle: e.target.value }))}
            className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm text-gray-300">
          Issue description
          <textarea
            required
            value={form.issueDescription}
            onChange={(e) =>
              setForm((f) => ({ ...f, issueDescription: e.target.value }))
            }
            className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm min-h-24"
          />
        </label>
        <label className="block text-sm text-gray-300">
          Priority
          <select
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <div className="block text-sm text-gray-300">
          <span>Photo (optional)</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => onPhotoSelected(e.target.files?.[0] ?? null)}
          />
          {!displayPhoto ? (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-700 bg-gray-950 px-4 py-8 text-gray-500 hover:border-primary/40 hover:bg-primary-light/30 hover:text-primary transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <ImagePlus className="w-6 h-6" />
              )}
              <span className="text-sm font-medium text-gray-300">
                {uploading ? "Uploading…" : "Upload a photo"}
              </span>
              <span className="text-xs text-gray-500">
                JPEG, PNG, WebP, or GIF · max 5 MB
              </span>
            </button>
          ) : (
            <div className="mt-1 relative overflow-hidden rounded-xl border border-gray-700 bg-gray-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayPhoto}
                alt="Maintenance issue preview"
                className="max-h-56 w-full object-contain bg-gray-800/40"
              />
              <div className="flex items-center justify-between gap-2 border-t border-gray-800 px-3 py-2">
                <p className="text-xs text-gray-500 truncate">
                  {uploading ? "Uploading…" : "Photo attached"}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-primary hover:text-primary-hover disabled:opacity-50"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={clearPhoto}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-800 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || uploading || allocations.length === 0}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit request"}
        </button>
        {allocations.length === 0 && (
          <p className="text-gray-500 text-xs">
            You need an active allocation before raising maintenance.
          </p>
        )}
      </form>

      <section className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
        <h2 className="text-gray-200 font-semibold text-sm mb-3">My requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-500 text-sm">No maintenance requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-4 text-sm text-gray-300"
              >
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <p className="font-medium text-gray-100">
                    {r.issueTitle || "Maintenance request"} · {r.assetName}
                  </p>
                  <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    {r.status.replaceAll("_", " ").toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {r.assetTag} · {r.priority} · {new Date(r.createdAt).toLocaleString()}
                </p>
                <p className="mt-2 text-xs">{r.issueDescription}</p>
                {r.photoUrl && (
                  <a
                    href={r.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block overflow-hidden rounded-lg border border-gray-700 max-w-xs"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.photoUrl}
                      alt="Attached maintenance photo"
                      className="h-28 w-full object-cover"
                    />
                  </a>
                )}
                {r.rejectionReason && (
                  <p className="mt-2 text-xs text-red-700">Rejected: {r.rejectionReason}</p>
                )}
                {r.resolutionNotes && (
                  <p className="mt-2 text-xs text-emerald-700">
                    Resolution: {r.resolutionNotes}
                  </p>
                )}
                {r.technicianName && (
                  <p className="mt-1 text-xs text-gray-500">Technician: {r.technicianName}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
