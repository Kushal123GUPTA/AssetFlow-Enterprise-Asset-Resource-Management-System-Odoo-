import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export class NotificationService {
  async listMine(employeeId: string) {
    return db
      .select({
        id: notifications.id,
        type: notifications.type,
        message: notifications.message,
        relatedEntityType: notifications.relatedEntityType,
        relatedEntityId: notifications.relatedEntityId,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.employeeId, employeeId),
          isNull(notifications.deletedAt)
        )
      )
      .orderBy(desc(notifications.createdAt));
  }

  async markRead(employeeId: string, notificationId: string) {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.employeeId, employeeId),
          isNull(notifications.deletedAt)
        )
      )
      .returning({
        id: notifications.id,
        isRead: notifications.isRead,
      });
    return updated ?? null;
  }

  async markAllRead(employeeId: string) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.employeeId, employeeId),
          eq(notifications.isRead, false),
          isNull(notifications.deletedAt)
        )
      );
  }
}
