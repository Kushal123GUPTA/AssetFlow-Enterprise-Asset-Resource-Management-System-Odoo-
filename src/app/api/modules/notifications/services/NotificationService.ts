import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { isUuid } from "@/lib/notificationTypes";

export type ListMineOptions = {
  unreadOnly?: boolean;
  types?: string[] | null;
  limit?: number;
  offset?: number;
};

export type NotificationRow = {
  id: string;
  type: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  createdAt: string;
};

function clampLimit(limit?: number): number {
  if (limit == null || Number.isNaN(limit)) return 100;
  return Math.min(Math.max(Math.floor(limit), 1), 200);
}

function clampOffset(offset?: number): number {
  if (offset == null || Number.isNaN(offset)) return 0;
  return Math.max(Math.floor(offset), 0);
}

export class NotificationService {
  private baseWhere(employeeId: string, opts: ListMineOptions = {}) {
    const parts = [
      eq(notifications.employeeId, employeeId),
      isNull(notifications.deletedAt),
    ];
    if (opts.unreadOnly) {
      parts.push(eq(notifications.isRead, false));
    }
    if (opts.types && opts.types.length > 0) {
      parts.push(inArray(notifications.type, opts.types));
    }
    return and(...parts);
  }

  async listMine(
    employeeId: string,
    opts: ListMineOptions = {}
  ): Promise<{ data: NotificationRow[]; total: number; unreadCount: number }> {
    const limit = clampLimit(opts.limit);
    const offset = clampOffset(opts.offset);
    const where = this.baseWhere(employeeId, opts);

    const [rows, totalResult, unreadResult] = await Promise.all([
      db
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
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(notifications)
        .where(where),
      db
        .select({ value: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.employeeId, employeeId),
            eq(notifications.isRead, false),
            isNull(notifications.deletedAt)
          )
        ),
    ]);

    return {
      data: rows,
      total: Number(totalResult[0]?.value ?? 0),
      unreadCount: Number(unreadResult[0]?.value ?? 0),
    };
  }

  async getUnreadCount(employeeId: string): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.employeeId, employeeId),
          eq(notifications.isRead, false),
          isNull(notifications.deletedAt)
        )
      );
    return Number(row?.value ?? 0);
  }

  async markRead(employeeId: string, notificationId: string) {
    if (!isUuid(notificationId)) return null;
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

  async markAllRead(employeeId: string): Promise<number> {
    const updated = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.employeeId, employeeId),
          eq(notifications.isRead, false),
          isNull(notifications.deletedAt)
        )
      )
      .returning({ id: notifications.id });
    return updated.length;
  }

  async softDelete(employeeId: string, notificationId: string) {
    if (!isUuid(notificationId)) return null;
    const [updated] = await db
      .update(notifications)
      .set({
        deletedAt: new Date().toISOString(),
        deletedBy: employeeId,
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.employeeId, employeeId),
          isNull(notifications.deletedAt)
        )
      )
      .returning({ id: notifications.id });
    return updated ?? null;
  }

  /** Insert helper used by tests / admin tooling — throws on failure. */
  async createForEmployee(input: {
    employeeId: string;
    type: string;
    message: string;
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
  }): Promise<NotificationRow> {
    const [row] = await db
      .insert(notifications)
      .values({
        employeeId: input.employeeId,
        type: input.type,
        message: input.message.trim(),
        relatedEntityType: input.relatedEntityType ?? null,
        relatedEntityId: input.relatedEntityId ?? null,
        isRead: false,
      })
      .returning({
        id: notifications.id,
        type: notifications.type,
        message: notifications.message,
        relatedEntityType: notifications.relatedEntityType,
        relatedEntityId: notifications.relatedEntityId,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      });
    return row;
  }
}
