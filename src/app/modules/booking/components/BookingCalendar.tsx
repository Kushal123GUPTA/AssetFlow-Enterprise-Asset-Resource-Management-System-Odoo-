"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Calendar as CalendarIcon, Info } from "lucide-react";
import { bookingService } from "../services/BookingService";
import type { BookingSlot } from "../types/booking.types";
import { ApiError } from "@/lib/fetchJson";
import { message as antdMessage } from "antd";

type Props = {
  assetId: string;
  assetLabel?: string;
  onPickSlot?: (startLocal: string, endLocal: string) => void;
};

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

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState<number | null>(null);
  const [dragEndSlot, setDragEndSlot] = useState<number | null>(null);

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

  // Reset drag selection on day or asset change
  useEffect(() => {
    setDragStartSlot(null);
    setDragEndSlot(null);
    setIsDragging(false);
  }, [day, assetId]);

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

  const formatSlotTime = (index: number) => {
    const totalMins = 8 * 60 + index * 30;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const getBookingPosition = (booking: BookingSlot) => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    // Get hours and minutes relative to 8:00 AM timeline start
    const startMins = start.getHours() * 60 + start.getMinutes() - 8 * 60;
    const endMins = end.getHours() * 60 + end.getMinutes() - 8 * 60;

    // Clamp values between 8:00 AM (0 mins) and 8:00 PM (720 mins)
    const clampedStart = Math.max(0, Math.min(720, startMins));
    const clampedEnd = Math.max(0, Math.min(720, endMins));

    // 1 minute = 50px / 60mins = 0.8333px
    const top = clampedStart * (50 / 60);
    const height = (clampedEnd - clampedStart) * (50 / 60);

    return { top, height };
  };

  // Global mouseup listener to finish dragging
  useEffect(() => {
    if (!isDragging) return;
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      if (dragStartSlot !== null && dragEndSlot !== null) {
        const startIdx = Math.min(dragStartSlot, dragEndSlot);
        const endIdx = Math.max(dragStartSlot, dragEndSlot);

        const startStr = `${day}T${formatSlotTime(startIdx)}`;
        const endStr = `${day}T${formatSlotTime(endIdx + 1)}`;

        const selStart = new Date(startStr).getTime();
        const selEnd = new Date(endStr).getTime();

        const hasOverlap = daySlots.some((s) => {
          const bStart = new Date(s.startTime).getTime();
          const bEnd = new Date(s.endTime).getTime();
          return bEnd > selStart && bStart < selEnd;
        });

        if (hasOverlap) {
          antdMessage.error("Overlapping booking detected! Please choose a free slot.");
          setDragStartSlot(null);
          setDragEndSlot(null);
        } else if (onPickSlot) {
          onPickSlot(startStr, endStr);
        }
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging, dragStartSlot, dragEndSlot, day, daySlots, onPickSlot]);

  if (!assetId) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-500 font-bold">
        Select a resource to view its booking calendar.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-gray-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" /> Resource Availability
          </h2>
          <p className="mt-1 text-xs text-gray-500 font-medium">
            {assetLabel ?? "Selected resource"} · Existing bookings shown below
          </p>
        </div>
        <input
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-gray-100 font-bold outline-none hover:border-primary focus:border-primary transition-colors"
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-6">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading availability…
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-750 font-bold">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {/* Timeline Onboarding Tip */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 font-semibold leading-relaxed">
              <span className="text-primary font-extrabold">Tip:</span> Click and drag your mouse cursor down on the timeline grid to select a custom booking range (e.g. drag from 9:00 AM to 10:30 AM).
            </p>
          </div>

          <div className="flex gap-4">
            {/* Hour labels (left column) */}
            <div className="w-16 flex flex-col select-none py-1 relative shrink-0" style={{ height: "600px" }}>
              {Array.from({ length: 13 }, (_, i) => i + 8).map((h, idx) => (
                <div
                  key={h}
                  style={{
                    position: "absolute",
                    top: `${idx * 50}px`,
                    transform: "translateY(-50%)",
                  }}
                  className="text-[10px] font-bold text-gray-400 w-full text-right pr-2"
                >
                  {hourLabel(h)}
                </div>
              ))}
            </div>

            {/* Timeline Grid (right column) */}
            <div
              className="flex-1 bg-slate-50/30 rounded-2xl border border-slate-200 relative overflow-hidden select-none cursor-crosshair"
              style={{ height: "600px" }}
            >
              {/* Background Grid Rows (24 slots of 30-min each) */}
              {Array.from({ length: 24 }).map((_, idx) => {
                const isHour = idx % 2 === 0;
                return (
                  <div
                    key={idx}
                    onMouseDown={() => {
                      setIsDragging(true);
                      setDragStartSlot(idx);
                      setDragEndSlot(idx);
                    }}
                    onMouseEnter={() => {
                      if (isDragging) {
                        setDragEndSlot(idx);
                      }
                    }}
                    style={{
                      position: "absolute",
                      top: `${idx * 25}px`,
                      height: "25px",
                      left: 0,
                      right: 0,
                    }}
                    className={`border-t transition-colors ${
                      isHour ? "border-slate-200" : "border-dashed border-slate-150"
                    } hover:bg-slate-200/40`}
                  />
                );
              })}

              {/* Render Existing Booked Slots as absolute overlays */}
              {daySlots.map((s) => {
                const pos = getBookingPosition(s);
                return (
                  <div
                    key={s.id}
                    style={{
                      position: "absolute",
                      top: `${pos.top}px`,
                      height: `${pos.height}px`,
                      left: "8px",
                      right: "8px",
                    }}
                    className="rounded-xl border border-blue-200 bg-blue-50/90 hover:bg-blue-100/90 transition-all p-3 shadow-sm overflow-hidden flex flex-col justify-center"
                  >
                    <p className="text-xs font-extrabold text-blue-900 leading-none truncate">
                      Booked
                    </p>
                    <p className="text-[10px] font-bold text-blue-700 mt-1 truncate">
                      {new Date(s.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} -{" "}
                      {new Date(s.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                );
              })}

              {/* Render Drag Selection Overlay dynamically */}
              {dragStartSlot !== null && dragEndSlot !== null && (
                (() => {
                  const startIdx = Math.min(dragStartSlot, dragEndSlot);
                  const endIdx = Math.max(dragStartSlot, dragEndSlot);
                  const top = startIdx * 25;
                  const height = (endIdx - startIdx + 1) * 25;

                  const selStart = new Date(`${day}T${formatSlotTime(startIdx)}`).getTime();
                  const selEnd = new Date(`${day}T${formatSlotTime(endIdx + 1)}`).getTime();

                  const hasOverlap = daySlots.some((s) => {
                    const bStart = new Date(s.startTime).getTime();
                    const bEnd = new Date(s.endTime).getTime();
                    return bEnd > selStart && bStart < selEnd;
                  });

                  return (
                    <div
                      style={{
                        position: "absolute",
                        top: `${top}px`,
                        height: `${height}px`,
                        left: "12px",
                        right: "12px",
                        pointerEvents: "none",
                      }}
                      className={`rounded-xl transition-all duration-75 flex flex-col justify-center p-3 z-10 ${
                        hasOverlap
                          ? "bg-rose-500/10 border-2 border-dashed border-rose-500 text-rose-800"
                          : "bg-emerald-500/10 border-2 border-dashed border-emerald-500 text-emerald-850 animate-pulse"
                      }`}
                    >
                      <p className="text-xs font-extrabold leading-none">
                        {hasOverlap ? "Conflict - Slot Unavailable" : "Release mouse button to book"}
                      </p>
                      <p className="text-[10px] font-bold mt-1">
                        {formatSlotTime(startIdx)} - {formatSlotTime(endIdx + 1)}
                      </p>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {daySlots.length > 0 && (
        <p className="mt-4 text-[10px] font-semibold text-gray-400">
          {daySlots.length} booking{daySlots.length === 1 ? "" : "s"} scheduled for this date.
        </p>
      )}
    </div>
  );
}
