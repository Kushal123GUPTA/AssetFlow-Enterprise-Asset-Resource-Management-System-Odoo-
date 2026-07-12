"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { bookingService } from "../services/BookingService";
import type { BookingSlot } from "../types/booking.types";
import { ApiError } from "@/lib/fetchJson";

type Props = {
  assetId: string;
  assetLabel?: string;
  onPickSlot?: (startLocal: string, endLocal: string) => void;
};

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function hourLabel(h: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:00 ${ampm}`;
}

export default function BookingCalendar({ assetId, assetLabel, onPickSlot }: Props) {
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  useEffect(() => {
    if (!assetId) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await bookingService.listSlots(assetId);
        if (!cancelled) setSlots(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load calendar");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 8), []);

  const dayStart = useMemo(() => new Date(`${day}T00:00:00`).getTime(), [day]);
  const dayEnd = useMemo(() => new Date(`${day}T23:59:59`).getTime(), [day]);

  const daySlots = useMemo(
    () =>
      slots.filter((s) => {
        if (s.status === "cancelled") return false;
        const start = new Date(s.startTime).getTime();
        const end = new Date(s.endTime).getTime();
        return end > dayStart && start < dayEnd;
      }),
    [slots, dayStart, dayEnd]
  );

  function overlapsHour(hour: number) {
    const hStart = new Date(`${day}T${String(hour).padStart(2, "0")}:00:00`).getTime();
    const hEnd = hStart + 60 * 60 * 1000;
    return daySlots.filter((s) => {
      const start = new Date(s.startTime).getTime();
      const end = new Date(s.endTime).getTime();
      return end > hStart && start < hEnd;
    });
  }

  if (!assetId) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-950 px-4 py-8 text-center text-sm text-gray-500">
        Select a resource to view its booking calendar.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-100">Resource calendar</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {assetLabel ?? "Selected resource"} · existing bookings shown below
          </p>
        </div>
        <input
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100"
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading slots…
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-1">
          {hours.map((hour) => {
            const busy = overlapsHour(hour);
            const free = busy.length === 0;
            return (
              <button
                key={hour}
                type="button"
                disabled={!free || !onPickSlot}
                onClick={() => {
                  if (!onPickSlot || !free) return;
                  const start = `${day}T${String(hour).padStart(2, "0")}:00`;
                  const endHour = hour + 1;
                  const end = `${day}T${String(endHour).padStart(2, "0")}:00`;
                  onPickSlot(start, end);
                }}
                className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  free
                    ? "border-gray-800 bg-gray-950 hover:border-primary/40 hover:bg-primary-light/40"
                    : "cursor-default border-amber-200/60 bg-amber-50/80"
                }`}
              >
                <span className="w-16 shrink-0 text-xs font-semibold text-gray-500">
                  {hourLabel(hour)}
                </span>
                <div className="min-w-0 flex-1">
                  {free ? (
                    <p className="text-xs font-medium text-gray-300">Available — click to book</p>
                  ) : (
                    busy.map((s) => (
                      <p key={s.id} className="text-xs font-medium text-amber-900">
                        Booked · {new Date(s.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        –{new Date(s.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        {" · "}
                        {s.status}
                      </p>
                    ))
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {daySlots.length > 0 && (
        <p className="mt-3 text-[11px] text-gray-500">
          {daySlots.length} booking{daySlots.length === 1 ? "" : "s"} on this day. Overlaps are
          rejected by the server.
        </p>
      )}
    </div>
  );
}

export { toLocalInputValue };
