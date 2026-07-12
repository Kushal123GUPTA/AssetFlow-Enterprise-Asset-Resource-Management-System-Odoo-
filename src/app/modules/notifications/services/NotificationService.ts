import { fetchJson } from "@/lib/fetchJson";
import type { EmployeeNotification } from "../types/notification.types";
import type { NotificationFilterTab } from "@/lib/notificationTypes";

export type ListMineResult = {
  data: EmployeeNotification[];
  meta: {
    total: number;
    unreadCount: number;
    limit: number;
    offset: number;
    filter: NotificationFilterTab | string;
  };
};

export class NotificationService {
  async listMine(opts?: {
    unreadOnly?: boolean;
    filter?: NotificationFilterTab;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<ListMineResult> {
    const params = new URLSearchParams();
    if (opts?.unreadOnly) params.set("unread", "1");
    if (opts?.filter && opts.filter !== "all") params.set("filter", opts.filter);
    if (opts?.type) params.set("type", opts.type);
    if (opts?.limit != null) params.set("limit", String(opts.limit));
    if (opts?.offset != null) params.set("offset", String(opts.offset));
    const qs = params.toString();
    return fetchJson<ListMineResult>(
      `/api/notifications/mine${qs ? `?${qs}` : ""}`
    );
  }

  async getUnreadCount(): Promise<number> {
    const res = await fetchJson<{ data: { unreadCount: number } }>(
      "/api/notifications/unread-count"
    );
    return res.data.unreadCount;
  }

  async markRead(notificationId: string) {
    const res = await fetchJson<{ data: { id: string; isRead: boolean } }>(
      `/api/notifications/${notificationId}`,
      { method: "PATCH" }
    );
    return res.data;
  }

  async markAllRead() {
    const res = await fetchJson<{ data: { ok: boolean; updatedCount: number } }>(
      "/api/notifications/mine",
      {
        method: "PATCH",
        body: JSON.stringify({ action: "mark_all_read" }),
      }
    );
    return res.data;
  }

  async softDelete(notificationId: string) {
    const res = await fetchJson<{ data: { ok: boolean; id: string } }>(
      `/api/notifications/${notificationId}`,
      { method: "DELETE" }
    );
    return res.data;
  }
}

export const notificationService = new NotificationService();
