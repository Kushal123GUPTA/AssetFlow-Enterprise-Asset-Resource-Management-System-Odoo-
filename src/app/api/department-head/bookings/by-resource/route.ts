import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { resourceBookings, employees } from "@/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "department_head") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assetId } = await req.json();
    if (!assetId) {
      return NextResponse.json({ error: "Missing assetId" }, { status: 400 });
    }

    const result = await db
      .select({
        id: resourceBookings.id,
        startTime: resourceBookings.startTime,
        endTime: resourceBookings.endTime,
        status: resourceBookings.status,
        bookedByEmployeeName: employees.name,
      })
      .from(resourceBookings)
      .leftJoin(employees, eq(resourceBookings.bookedByEmployeeId, employees.id))
      .where(
        and(
          eq(resourceBookings.assetId, assetId),
          ne(resourceBookings.status, "cancelled"),
          isNull(resourceBookings.deletedAt)
        )
      );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Fetch bookings by resource error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
