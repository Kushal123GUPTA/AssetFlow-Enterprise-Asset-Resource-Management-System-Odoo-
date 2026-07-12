import { fetchJson } from "@/lib/fetchJson";
import type { EmployeeNotification } from "../types/notification.types";

export class NotificationService {
  async listMine() {
    const res = await fetchJson<{ data: EmployeeNotification[] }>(
      "/api/notifications/mine"
    );
    return res.data;
  }

  async markRead(notificationId: string) {
    const res = await fetchJson<{ data: { id: string; isRead: boolean } }>(
      "/api/notifications/mine",
      {
        method: "PATCH",
        body: JSON.stringify({ action: "mark_read", notificationId }),
      }
    );
    return res.data;
  }

  async markAllRead() {
    await fetchJson<{ data: { ok: boolean } }>("/api/notifications/mine", {
      method: "PATCH",
      body: JSON.stringify({ action: "mark_all_read" }),
    });
  }
}

export const notificationService = new NotificationService();
