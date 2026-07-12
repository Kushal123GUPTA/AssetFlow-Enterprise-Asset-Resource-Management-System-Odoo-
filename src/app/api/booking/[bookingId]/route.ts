import { NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { BookingService } from "@/app/api/modules/booking/services/BookingService";

const service = new BookingService();

export async function PATCH(
  req: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const { bookingId } = await context.params;
    const body = await req.json();
    const action = body?.action as string;

    if (action === "cancel") {
      const result = await service.cancelMine(
        auth.employee.id,
        bookingId,
        body?.reason
      );
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({ data: result.data });
    }

    if (action === "reschedule") {
      if (!body?.startTime || !body?.endTime) {
        return NextResponse.json(
          { error: "startTime and endTime are required to reschedule" },
          { status: 400 }
        );
      }
      const result = await service.rescheduleMine(auth.employee.id, bookingId, {
        startTime: body.startTime,
        endTime: body.endTime,
      });
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({ data: result.data });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/booking/[bookingId]", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
