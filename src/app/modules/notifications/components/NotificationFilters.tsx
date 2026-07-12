"use client";

import type { NotificationFilterTab } from "@/lib/notificationTypes";

const TABS: Array<{ key: NotificationFilterTab; label: string }> = [
  { key: "all", label: "All" },
  { key: "alerts", label: "Alerts" },
  { key: "approvals", label: "Approvals" },
  { key: "bookings", label: "Bookings" },
];

type Props = {
  value: NotificationFilterTab;
  onChange: (tab: NotificationFilterTab) => void;
  unreadOnly: boolean;
  onUnreadOnlyChange: (value: boolean) => void;
};

export default function NotificationFilters({
  value,
  onChange,
  unreadOnly,
  onUnreadOnlyChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = value === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition-colors ${
                active
                  ? "bg-primary text-white border-primary"
                  : "bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <label className="inline-flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={unreadOnly}
          onChange={(e) => onUnreadOnlyChange(e.target.checked)}
          className="rounded border-gray-700"
        />
        Unread only
      </label>
    </div>
  );
}
