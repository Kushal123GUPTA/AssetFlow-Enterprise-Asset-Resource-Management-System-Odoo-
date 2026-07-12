import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { resourceBookings, activityLogsDefault } from "@/db/schema";
import { eq, and, isNull, ne, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "department_head") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assetId, startTime, endTime } = await req.json();
    if (!assetId || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const departmentId = session.user.departmentId;
    if (!departmentId) {
      return NextResponse.json({ error: "User is not assigned to a department" }, { status: 400 });
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    // 1. Check for overlapping bookings
    const overlapping = await db
      .select()
      .from(resourceBookings)
      .where(
        and(
          eq(resourceBookings.assetId, assetId),
          ne(resourceBookings.status, "cancelled"),
          isNull(resourceBookings.deletedAt),
          sql`${resourceBookings.startTime} < ${endTime}::timestamptz`,
          sql`${resourceBookings.endTime} > ${startTime}::timestamptz`
        )
      )
      .limit(1);

    if (overlapping.length > 0) {
      return NextResponse.json(
        { error: "The resource is already booked during this time slot. Please choose another time." },
        { status: 409 }
      );
    }

    // 2. Create the booking
    const newBooking = await db
      .insert(resourceBookings)
      .values({
        assetId,
        bookedByEmployeeId: session.user.id,
        departmentId,
        startTime,
        endTime,
        status: "upcoming",
        createdBy: session.user.id,
        updatedBy: session.user.id,
      })
      .returning();

    // 3. Log activity
    await db.insert(activityLogsDefault).values({
      organizationId: session.user.organizationId,
      employeeId: session.user.id,
      action: "booking.create",
      entityType: "resource_booking",
      entityId: newBooking[0].id,
      details: {
        bookingId: newBooking[0].id,
        assetId,
        startTime,
        endTime,
      },
    });

    return NextResponse.json({ success: true, data: newBooking[0] });
  } catch (error: any) {
    console.error("Create booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
