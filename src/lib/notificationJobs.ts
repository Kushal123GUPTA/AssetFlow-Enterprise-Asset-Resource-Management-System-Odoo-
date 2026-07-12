import { and, eq, isNull, lt, lte, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  assetAllocations,
  assets,
  notifications,
  resourceBookings,
} from "@/db/schema";
import { notifyEmployee } from "@/lib/notifications";

const REMINDER_WINDOW_MINUTES = 60;

/**
 * Dispatches overdue-return and booking-reminder notifications.
 * Skips if the same type+entity was already notified in the last 20h.
 */
export async function dispatchNotificationJobs(organizationId?: string): Promise<{
  overdueNotified: number;
  remindersNotified: number;
}> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const reminderUntil = new Date(now.getTime() + REMINDER_WINDOW_MINUTES * 60_000);

  let overdueNotified = 0;
  let remindersNotified = 0;

  const overdueConds = [
    eq(assetAllocations.status, "active"),
    isNull(assetAllocations.deletedAt),
    isNull(assets.deletedAt),
    sql`${assetAllocations.expectedReturnDate} IS NOT NULL`,
    lt(assetAllocations.expectedReturnDate, today),
  ];
  if (organizationId) {
    overdueConds.push(eq(assets.organizationId, organizationId));
  }

  const overdueRows = await db
    .select({
      allocationId: assetAllocations.id,
      employeeId: assetAllocations.employeeId,
      expectedReturnDate: assetAllocations.expectedReturnDate,
      assetTag: assets.assetTag,
      assetName: assets.name,
    })
    .from(assetAllocations)
    .innerJoin(assets, eq(assetAllocations.assetId, assets.id))
    .where(and(...overdueConds))
    .limit(200);

  for (const row of overdueRows) {
    if (!row.employeeId) continue;
    if (await recentlyNotified(row.employeeId, "overdue_return", row.allocationId)) {
      continue;
    }

    await notifyEmployee({
      employeeId: row.employeeId,
      type: "overdue_return",
      message: `Overdue return: ${row.assetTag} (${row.assetName}) was due ${row.expectedReturnDate}.`,
      relatedEntityType: "allocation",
      relatedEntityId: row.allocationId,
    });
    overdueNotified += 1;
  }

  const bookingConds = [
    isNull(resourceBookings.deletedAt),
    isNull(assets.deletedAt),
    sql`${resourceBookings.status} IN ('upcoming', 'ongoing')`,
    gte(resourceBookings.startTime, now.toISOString()),
    lte(resourceBookings.startTime, reminderUntil.toISOString()),
  ];
  if (organizationId) {
    bookingConds.push(eq(assets.organizationId, organizationId));
  }

  const bookingRows = await db
    .select({
      bookingId: resourceBookings.id,
      employeeId: resourceBookings.bookedByEmployeeId,
      startTime: resourceBookings.startTime,
      assetTag: assets.assetTag,
      assetName: assets.name,
    })
    .from(resourceBookings)
    .innerJoin(assets, eq(resourceBookings.assetId, assets.id))
    .where(and(...bookingConds))
    .limit(200);

  for (const row of bookingRows) {
    if (await recentlyNotified(row.employeeId, "booking_reminder", row.bookingId)) {
      continue;
    }

    await notifyEmployee({
      employeeId: row.employeeId,
      type: "booking_reminder",
      message: `Reminder: ${row.assetTag} (${row.assetName}) starts at ${new Date(row.startTime).toLocaleString()}.`,
      relatedEntityType: "booking",
      relatedEntityId: row.bookingId,
    });
    remindersNotified += 1;
  }

  return { overdueNotified, remindersNotified };
}

async function recentlyNotified(
  employeeId: string,
  type: string,
  relatedEntityId: string
): Promise<boolean> {
  const since = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
  const [row] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.employeeId, employeeId),
        eq(notifications.type, type),
        eq(notifications.relatedEntityId, relatedEntityId),
        isNull(notifications.deletedAt),
        sql`${notifications.createdAt} >= ${since}`
      )
    )
    .limit(1);
  return Boolean(row);
}
