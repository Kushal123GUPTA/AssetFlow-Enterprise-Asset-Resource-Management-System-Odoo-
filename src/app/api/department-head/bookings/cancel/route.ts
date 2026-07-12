import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { resourceBookings, activityLogsDefault } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "department_head") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, reason } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const departmentId = session.user.departmentId;
    if (!departmentId) {
      return NextResponse.json({ error: "User is not assigned to a department" }, { status: 400 });
    }

    // 1. Fetch booking
    const bookingRecord = await db
      .select()
      .from(resourceBookings)
      .where(eq(resourceBookings.id, bookingId))
      .limit(1);

    const booking = bookingRecord[0];
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // 2. Verify booking belongs to Department Head's department
    if (booking.departmentId !== departmentId) {
      return NextResponse.json({ error: "You cannot cancel bookings outside your department" }, { status: 403 });
    }

    // 3. Update status
    await db.transaction(async (tx) => {
      await tx
        .update(resourceBookings)
        .set({
          status: "cancelled",
          cancelledReason: reason || "Cancelled by Department Head",
          updatedBy: session.user.id,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(resourceBookings.id, bookingId));

      await tx.insert(activityLogsDefault).values({
        organizationId: session.user.organizationId,
        employeeId: session.user.id,
        action: "booking.cancel",
        entityType: "resource_booking",
        entityId: bookingId,
        details: {
          bookingId,
          reason: reason || "Cancelled by Department Head",
        },
      });
    });

    return NextResponse.json({ success: true, message: "Booking cancelled successfully" });
  } catch (error: any) {
    console.error("Cancel booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
