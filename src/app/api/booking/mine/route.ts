import { NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { BookingService } from "@/app/api/modules/booking/services/BookingService";

const service = new BookingService();

export async function GET() {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const data = await service.listMine(auth.employee.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/booking/mine", error);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    if (!body?.assetId || !body?.startTime || !body?.endTime) {
      return NextResponse.json(
        { error: "assetId, startTime, and endTime are required" },
        { status: 400 }
      );
    }
    const result = await service.createBooking(
      auth.employee.id,
      auth.employee.organizationId,
      auth.employee.departmentId,
      {
        assetId: body.assetId,
        startTime: body.startTime,
        endTime: body.endTime,
      }
    );
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/booking/mine", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
