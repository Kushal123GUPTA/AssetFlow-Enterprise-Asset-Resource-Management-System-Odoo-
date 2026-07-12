"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { bookingService } from "../services/BookingService";
import type { BookableResource, MyBooking } from "../types/booking.types";
import { ApiError } from "@/lib/fetchJson";
import PageHeader, { PageShell } from "@/app/shared/components/PageHeader";
import BookingCalendar from "../components/BookingCalendar";
import { Select, DatePicker, Button, message as antdMessage } from "antd";
import dayjs from "dayjs";

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
      antdMessage.success("Booking created successfully!");
      setMessage("Booking created");
      setStartTime("");
      setEndTime("");
      setSelectedAssetId("");
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
      antdMessage.success("Booking cancelled");
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
      antdMessage.success("Booking rescheduled");
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
        <div className="rounded-xl border border-emerald-250 bg-emerald-50 text-emerald-800 text-sm p-4 font-semibold">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-4 font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={onSearch} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources…"
          className="flex-1 rounded-xl bg-gray-900 border border-gray-800 text-gray-100 px-4 py-2.5 text-sm"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold border-none transition-colors cursor-pointer"
        >
          Search
        </button>
      </form>

      <form
        onSubmit={createBooking}
        className="rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-5"
      >
        <h2 className="text-gray-100 font-extrabold text-base">Create Booking</h2>
        
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Resource
          </label>
          <Select
            showSearch
            placeholder="Select a bookable resource..."
            value={selectedAssetId || undefined}
            onChange={(val) => setSelectedAssetId(val || "")}
            className="w-full rounded-xl"
            style={{ width: "100%" }}
            size="large"
            optionFilterProp="label"
            options={resources.map((r) => ({
              value: r.id,
              label: `${r.name} (${r.assetTag})${r.location ? ` · ${r.location}` : ""}`,
            }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Start Time
            </label>
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="YYYY-MM-DD HH:mm"
              placeholder="Select start date & time"
              value={startTime ? dayjs(startTime) : null}
              onChange={(val) => setStartTime(val ? val.toISOString() : "")}
              className="w-full rounded-xl py-2.5"
              style={{ width: "100%" }}
              size="large"
              disabledDate={(current) => current && current < dayjs().startOf("day")}
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              End Time
            </label>
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="YYYY-MM-DD HH:mm"
              placeholder="Select end date & time"
              value={endTime ? dayjs(endTime) : null}
              onChange={(val) => setEndTime(val ? val.toISOString() : "")}
              className="w-full rounded-xl py-2.5"
              style={{ width: "100%" }}
              size="large"
              disabledDate={(current) => current && current < dayjs().startOf("day")}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || resources.length === 0}
          className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold border-none transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] cursor-pointer"
        >
          {submitting ? "Booking…" : "Book slot"}
        </button>
        {resources.length === 0 && (
          <p className="text-gray-500 text-xs font-semibold">No bookable resources found.</p>
        )}
      </form>

      <BookingCalendar
        assetId={selectedAssetId}
        assetLabel={
          resources.find((r) => r.id === selectedAssetId)
            ? `${resources.find((r) => r.id === selectedAssetId)!.name} (${resources.find((r) => r.id === selectedAssetId)!.assetTag})`
            : undefined
        }
        onPickSlot={(start, end) => {
          setStartTime(start);
          setEndTime(end);
          antdMessage.info("Slot selected from calendar — review times and click book.");
          setMessage("Slot selected from calendar — review times and book.");
        }}
      />

      <section className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-4 h-4 text-primary" />
          <h2 className="text-gray-100 font-extrabold text-base">My Bookings</h2>
        </div>
        {bookings.length === 0 ? (
          <p className="text-gray-500 text-sm font-semibold">You have no bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="rounded-xl bg-gray-800/40 border border-gray-700/50 p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <p className="text-gray-100 text-sm font-extrabold">
                      {b.assetName} ({b.assetTag})
                    </p>
                    <p className="text-gray-400 text-xs font-semibold mt-1">
                      {new Date(b.startTime).toLocaleString()} –{" "}
                      {new Date(b.endTime).toLocaleString()}
                    </p>
                    <span className="inline-block mt-2 text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {b.status}
                    </span>
                  </div>
                  {editableStatuses.has(b.status) && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleId(b.id);
                          setRescheduleStart(b.startTime);
                          setRescheduleEnd(b.endTime);
                        }}
                        className="text-xs px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 font-bold transition-all cursor-pointer"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelBooking(b.id)}
                        className="text-xs px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-250 hover:bg-red-100 font-bold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                {rescheduleId === b.id && (
                  <form onSubmit={submitReschedule} className="mt-4 p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reschedule Booking</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DatePicker
                        showTime={{ format: "HH:mm" }}
                        format="YYYY-MM-DD HH:mm"
                        placeholder="Start Time"
                        value={rescheduleStart ? dayjs(rescheduleStart) : null}
                        onChange={(val) => setRescheduleStart(val ? val.toISOString() : "")}
                        className="rounded-xl w-full"
                        style={{ width: "100%" }}
                        disabledDate={(current) => current && current < dayjs().startOf("day")}
                      />
                      <DatePicker
                        showTime={{ format: "HH:mm" }}
                        format="YYYY-MM-DD HH:mm"
                        placeholder="End Time"
                        value={rescheduleEnd ? dayjs(rescheduleEnd) : null}
                        onChange={(val) => setRescheduleEnd(val ? val.toISOString() : "")}
                        className="rounded-xl w-full"
                        style={{ width: "100%" }}
                        disabledDate={(current) => current && current < dayjs().startOf("day")}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setRescheduleId(null)}
                        className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold border-none transition-all cursor-pointer text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold border-none transition-all cursor-pointer text-xs"
                      >
                        Save
                      </button>
                    </div>
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
