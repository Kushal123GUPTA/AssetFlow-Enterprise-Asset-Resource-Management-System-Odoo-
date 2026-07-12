import { and, asc, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { assetCategories, assets, resourceBookings } from "@/db/schema";
import { isExclusionViolation } from "@/lib/apiAuth";
import { notifyEmployee } from "@/lib/notifications";
import { logActivity } from "@/lib/activityLog";

function deriveBookingStatus(
  startTime: string,
  endTime: string,
  current: "upcoming" | "ongoing" | "completed" | "cancelled"
): "upcoming" | "ongoing" | "completed" | "cancelled" {
  if (current === "cancelled" || current === "completed") return current;
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (now < start) return "upcoming";
  if (now >= start && now < end) return "ongoing";
  return "completed";
}

export class BookingService {
  async listBookableResources(organizationId: string, search?: string) {
    const filters = [
      eq(assets.organizationId, organizationId),
      eq(assets.isBookable, true),
      isNull(assets.deletedAt),
      ne(assets.status, "retired"),
      ne(assets.status, "disposed"),
      ne(assets.status, "lost"),
    ];

    if (search?.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      filters.push(
        sql`(lower(${assets.name}) like ${q} or lower(${assets.assetTag}) like ${q} or lower(coalesce(${assets.location}, '')) like ${q})`
      );
    }

    return db
      .select({
        id: assets.id,
        name: assets.name,
        assetTag: assets.assetTag,
        location: assets.location,
        condition: assets.condition,
        status: assets.status,
        categoryName: assetCategories.name,
        photoUrl: assets.photoUrl,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assetCategories.id, assets.categoryId))
      .where(and(...filters))
      .orderBy(asc(assets.name));
  }

  async listResourceSlots(assetId: string, organizationId: string) {
    const [asset] = await db
      .select({ id: assets.id })
      .from(assets)
      .where(
        and(
          eq(assets.id, assetId),
          eq(assets.organizationId, organizationId),
          eq(assets.isBookable, true),
          isNull(assets.deletedAt)
        )
      )
      .limit(1);
    if (!asset) return { error: "Resource not found", status: 404 as const };

    const slots = await db
      .select({
        id: resourceBookings.id,
        startTime: resourceBookings.startTime,
        endTime: resourceBookings.endTime,
        status: resourceBookings.status,
        bookedByEmployeeId: resourceBookings.bookedByEmployeeId,
      })
      .from(resourceBookings)
      .where(
        and(
          eq(resourceBookings.assetId, assetId),
          isNull(resourceBookings.deletedAt),
          ne(resourceBookings.status, "cancelled")
        )
      )
      .orderBy(asc(resourceBookings.startTime));

    return {
      data: slots.map((s) => ({
        ...s,
        status: deriveBookingStatus(s.startTime, s.endTime, s.status),
      })),
    };
  }

  async listMine(employeeId: string) {
    const rows = await db
      .select({
        id: resourceBookings.id,
        assetId: resourceBookings.assetId,
        startTime: resourceBookings.startTime,
        endTime: resourceBookings.endTime,
        status: resourceBookings.status,
        cancelledReason: resourceBookings.cancelledReason,
        createdAt: resourceBookings.createdAt,
        assetName: assets.name,
        assetTag: assets.assetTag,
        location: assets.location,
      })
      .from(resourceBookings)
      .innerJoin(assets, eq(assets.id, resourceBookings.assetId))
      .where(
        and(
          eq(resourceBookings.bookedByEmployeeId, employeeId),
          isNull(resourceBookings.deletedAt)
        )
      )
      .orderBy(desc(resourceBookings.startTime));

    return rows.map((row) => ({
      ...row,
      status: deriveBookingStatus(row.startTime, row.endTime, row.status),
    }));
  }

  async createBooking(
    employeeId: string,
    organizationId: string,
    departmentId: string | null,
    input: { assetId: string; startTime: string; endTime: string }
  ) {
    const start = new Date(input.startTime);
    const end = new Date(input.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { error: "Invalid start or end time", status: 400 as const };
    }
    if (end <= start) {
      return { error: "End time must be after start time", status: 400 as const };
    }
    if (start.getTime() < Date.now() - 60_000) {
      return { error: "Cannot create a booking in the past", status: 400 as const };
    }

    const [asset] = await db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.id, input.assetId),
          eq(assets.organizationId, organizationId),
          eq(assets.isBookable, true),
          isNull(assets.deletedAt)
        )
      )
      .limit(1);

    if (!asset) {
      return { error: "Resource is not available for booking", status: 404 as const };
    }
    if (["retired", "disposed", "lost", "under_maintenance"].includes(asset.status)) {
      return { error: "Resource is no longer available", status: 409 as const };
    }

    try {
      const [created] = await db
        .insert(resourceBookings)
        .values({
          assetId: input.assetId,
          bookedByEmployeeId: employeeId,
          departmentId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          status: "upcoming",
          createdBy: employeeId,
          updatedBy: employeeId,
        })
        .returning();
      await notifyEmployee({
        employeeId,
        type: "booking_confirmed",
        message: `Booking confirmed for ${asset.name} (${asset.assetTag}).`,
        relatedEntityType: "resource_booking",
        relatedEntityId: created.id,
      });
      await logActivity({
        organizationId,
        employeeId,
        action: "booking_created",
        entityType: "resource_booking",
        entityId: created.id,
        details: { assetId: input.assetId },
      });
      return { data: created };
    } catch (error) {
      if (isExclusionViolation(error) || isUniqueViolationLike(error)) {
        return {
          error: "This time slot overlaps an existing booking for the resource",
          status: 409 as const,
        };
      }
      throw error;
    }
  }

  async cancelMine(employeeId: string, bookingId: string, reason?: string) {
    const [booking] = await db
      .select()
      .from(resourceBookings)
      .where(
        and(
          eq(resourceBookings.id, bookingId),
          eq(resourceBookings.bookedByEmployeeId, employeeId),
          isNull(resourceBookings.deletedAt)
        )
      )
      .limit(1);

    if (!booking) return { error: "Booking not found", status: 404 as const };

    const status = deriveBookingStatus(booking.startTime, booking.endTime, booking.status);
    if (status === "completed" || status === "cancelled") {
      return { error: "This booking can no longer be cancelled", status: 400 as const };
    }

    const [updated] = await db
      .update(resourceBookings)
      .set({
        status: "cancelled",
        cancelledReason: reason ?? null,
        updatedBy: employeeId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(resourceBookings.id, bookingId))
      .returning();

    await notifyEmployee({
      employeeId,
      type: "booking_cancelled",
      message: `Booking cancelled${reason ? `: ${reason}` : "."}`,
      relatedEntityType: "resource_booking",
      relatedEntityId: bookingId,
    });

    const [assetRow] = await db
      .select({ organizationId: assets.organizationId })
      .from(assets)
      .where(eq(assets.id, booking.assetId))
      .limit(1);
    await logActivity({
      organizationId: assetRow?.organizationId ?? "",
      employeeId,
      action: "booking_cancelled",
      entityType: "resource_booking",
      entityId: bookingId,
      details: reason ? { reason } : undefined,
    });

    return { data: updated };
  }

  async rescheduleMine(
    employeeId: string,
    bookingId: string,
    input: { startTime: string; endTime: string }
  ) {
    const start = new Date(input.startTime);
    const end = new Date(input.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { error: "Invalid start or end time", status: 400 as const };
    }
    if (end <= start) {
      return { error: "End time must be after start time", status: 400 as const };
    }
    if (start.getTime() < Date.now() - 60_000) {
      return { error: "Cannot reschedule a booking into the past", status: 400 as const };
    }

    const [booking] = await db
      .select()
      .from(resourceBookings)
      .where(
        and(
          eq(resourceBookings.id, bookingId),
          eq(resourceBookings.bookedByEmployeeId, employeeId),
          isNull(resourceBookings.deletedAt)
        )
      )
      .limit(1);

    if (!booking) return { error: "Booking not found", status: 404 as const };

    const status = deriveBookingStatus(booking.startTime, booking.endTime, booking.status);
    if (status === "completed" || status === "cancelled") {
      return { error: "This booking can no longer be rescheduled", status: 400 as const };
    }

    try {
      const [updated] = await db
        .update(resourceBookings)
        .set({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          status: "upcoming",
          updatedBy: employeeId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(resourceBookings.id, bookingId))
        .returning();
      return { data: updated };
    } catch (error) {
      if (isExclusionViolation(error)) {
        return {
          error: "This time slot overlaps an existing booking for the resource",
          status: 409 as const,
        };
      }
      throw error;
    }
  }
}

function isUniqueViolationLike(error: unknown): boolean {
  const e = error as { message?: string };
  return Boolean(e?.message?.toLowerCase().includes("overlap"));
}
