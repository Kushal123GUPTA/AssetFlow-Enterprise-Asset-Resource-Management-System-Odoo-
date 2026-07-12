"use client";

import { Fragment, useMemo } from "react";

type HeatCell = { day: string; dow: number; hour: number; count: number };

type Props = {
  cells: HeatCell[];
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

export default function BookingHeatmap({ cells }: Props) {
  const max = useMemo(() => Math.max(1, ...cells.map((c) => c.count), 0), [cells]);

  const lookup = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cells) map.set(`${c.dow}-${c.hour}`, c.count);
    return map;
  }, [cells]);

  if (cells.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-8 text-center">
        No booking data yet for a heatmap.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid gap-1"
        style={{ gridTemplateColumns: `48px repeat(${HOURS.length}, 28px)` }}
      >
        <div />
        {HOURS.map((h) => (
          <div key={h} className="text-[10px] text-gray-500 text-center">
            {h}
          </div>
        ))}
        {DAY_ORDER.map((dow, idx) => (
          <Fragment key={dow}>
            <div className="text-[11px] text-gray-400 flex items-center">{DAYS[idx]}</div>
            {HOURS.map((hour) => {
              const count = lookup.get(`${dow}-${hour}`) ?? 0;
              const intensity = count / max;
              return (
                <div
                  key={`${dow}-${hour}`}
                  title={`${DAYS[idx]} ${hour}:00 — ${count} bookings`}
                  className="h-7 w-7 rounded-md border border-gray-800"
                  style={{
                    backgroundColor:
                      count === 0
                        ? "transparent"
                        : `rgba(255, 107, 0, ${0.15 + intensity * 0.85})`,
                  }}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
      <p className="text-[10px] text-gray-500 mt-3">
        Peak usage by weekday × hour (source: resource bookings)
      </p>
    </div>
  );
}
