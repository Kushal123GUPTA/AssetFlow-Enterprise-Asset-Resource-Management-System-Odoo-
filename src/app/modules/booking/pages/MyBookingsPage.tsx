"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { bookingService } from "../services/BookingService";
import type { BookableResource, MyBooking } from "../types/booking.types";
import { ApiError } from "@/lib/fetchJson";
import PageHeader, { PageShell } from "@/app/shared/components/PageHeader";

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MyBookingsPage() {
  const [resources, setResources] = useState<BookableResource[]>([]);
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleEnd, setRescheduleEnd] = useState("");

  const refresh = async (q?: string) => {
    const [res, mine] = await Promise.all([
      bookingService.listResources(q),
      bookingService.listMine(),
    ]);
    setResources(res);
    setBookings(mine);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load bookings");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const editableStatuses = useMemo(() => new Set(["upcoming", "ongoing"]), []);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await bookingService.listResources(search);
      setResources(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Search failed");
    }
  }

  async function createBooking(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!selectedAssetId || !startTime || !endTime) {
      setError("Select a resource and time range");
      return;
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      setError("End time must be after start time");
      return;
    }
    if (start.getTime() < Date.now() - 60_000) {
      setError("Cannot create a booking in the past");
      return;
    }
    setSubmitting(true);
    try {
      await bookingService.create({
        assetId: selectedAssetId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      setMessage("Booking created");
      setStartTime("");
      setEndTime("");
      await refresh(search);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelBooking(id: string) {
    setError(null);
    setMessage(null);
    try {
      await bookingService.cancel(id);
      setMessage("Booking cancelled");
      await refresh(search);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to cancel booking");
    }
  }

  async function submitReschedule(e: FormEvent) {
    e.preventDefault();
    if (!rescheduleId) return;
    setError(null);
    setMessage(null);
    const start = new Date(rescheduleStart);
    const end = new Date(rescheduleEnd);
    if (end <= start) {
      setError("End time must be after start time");
      return;
    }
    try {
      await bookingService.reschedule(rescheduleId, {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      setMessage("Booking rescheduled");
      setRescheduleId(null);
      await refresh(search);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reschedule");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading bookings…
      </div>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="My workspace"
        title="Book Resources"
        description="Reserve shared resources. Overlapping slots are rejected by the server."
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

      <form onSubmit={onSearch} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources…"
          className="flex-1 rounded-xl bg-gray-900 border border-gray-800 text-gray-100 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold"
        >
          Search
        </button>
      </form>

      <form
        onSubmit={createBooking}
        className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4"
      >
        <h2 className="text-gray-200 font-semibold text-sm">Create booking</h2>
        <label className="block text-sm text-gray-300">
          Resource
          <select
            required
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm"
          >
            <option value="">Select resource…</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.assetTag}){r.location ? ` · ${r.location}` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-sm text-gray-300">
            Start
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-gray-300">
            End
            <input
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 w-full rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={submitting || resources.length === 0}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Booking…" : "Book slot"}
        </button>
        {resources.length === 0 && (
          <p className="text-gray-500 text-xs">No bookable resources found.</p>
        )}
      </form>

      <section className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-primary" />
          <h2 className="text-gray-200 font-semibold text-sm">My bookings</h2>
        </div>
        {bookings.length === 0 ? (
          <p className="text-gray-500 text-sm">You have no bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <p className="text-gray-100 text-sm font-medium">
                      {b.assetName} ({b.assetTag})
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(b.startTime).toLocaleString()} –{" "}
                      {new Date(b.endTime).toLocaleString()}
                    </p>
                    <span className="inline-block mt-2 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      {b.status.toUpperCase()}
                    </span>
                  </div>
                  {editableStatuses.has(b.status) && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleId(b.id);
                          setRescheduleStart(toLocalInputValue(b.startTime));
                          setRescheduleEnd(toLocalInputValue(b.endTime));
                        }}
                        className="text-xs px-3 py-2 rounded-xl bg-primary-light text-primary border border-primary/20"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelBooking(b.id)}
                        className="text-xs px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                {rescheduleId === b.id && (
                  <form onSubmit={submitReschedule} className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="datetime-local"
                      required
                      value={rescheduleStart}
                      onChange={(e) => setRescheduleStart(e.target.value)}
                      className="rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm"
                    />
                    <input
                      type="datetime-local"
                      required
                      value={rescheduleEnd}
                      onChange={(e) => setRescheduleEnd(e.target.value)}
                      className="rounded-xl bg-gray-950 border border-gray-700 text-gray-100 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xl bg-primary text-white text-sm"
                    >
                      Save
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
