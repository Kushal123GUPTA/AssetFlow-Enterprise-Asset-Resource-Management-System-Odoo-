"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { notificationService } from "../services/NotificationService";
import type { EmployeeNotification } from "../types/notification.types";
import type { NotificationFilterTab } from "@/lib/notificationTypes";
import { ApiError } from "@/lib/fetchJson";
import PageHeader, { PageShell } from "@/app/shared/components/PageHeader";
import NotificationFilters from "../components/NotificationFilters";

type Props = {
  backHref?: string;
};

export default function MyNotificationsPage({ backHref = "/dashboard" }: Props) {
  const [items, setItems] = useState<EmployeeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<NotificationFilterTab>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const res = await notificationService.listMine({
      filter,
      unreadOnly,
      limit: 100,
    });
    setItems(res.data);
    setUnreadCount(res.meta.unreadCount);
  }, [filter, unreadOnly]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await refresh();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load notifications");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function onMarkRead(id: string) {
    setError(null);
    setBusy(true);
    try {
      await notificationService.markRead(id);
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to mark as read");
    } finally {
      setBusy(false);
    }
  }

  async function onMarkAllRead() {
    setError(null);
    setBusy(true);
    try {
      await notificationService.markAllRead();
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to mark all as read");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setError(null);
    setBusy(true);
    try {
      await notificationService.softDelete(id);
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete notification");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description={`Updates about assets, bookings, maintenance, and requests${
          unreadCount > 0 ? ` · ${unreadCount} unread` : ""
        }`}
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          ) : undefined
        }
      />

      <NotificationFilters
        value={filter}
        onChange={setFilter}
        unreadOnly={unreadOnly}
        onUnreadOnlyChange={setUnreadOnly}
      />

      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading notifications…
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-4">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center">
          <Bell className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">No notifications yet</p>
          <p className="text-gray-500 text-sm mt-1">
            You’ll see alerts here when something needs your attention.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((n) => (
          <div
            key={n.id}
            className={`rounded-2xl border p-4 ${
              n.isRead
                ? "bg-gray-900 border-gray-800"
                : "bg-gray-900 border-orange-500/30"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">
                  {n.type.replaceAll("_", " ")}
                </p>
                <p className="text-gray-200 text-sm mt-1">{n.message}</p>
                <p className="text-gray-600 text-xs mt-2">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!n.isRead && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onMarkRead(n.id)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-primary-light text-primary border border-primary/20 disabled:opacity-50"
                  >
                    Mark read
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onDelete(n.id)}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-gray-800 text-gray-500 hover:text-red-400 hover:border-red-400/40 disabled:opacity-50"
                  aria-label="Delete notification"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link
        href={backHref}
        className="inline-block text-xs text-gray-500 hover:text-gray-300"
      >
        ← Back
      </Link>
    </PageShell>
  );
}
