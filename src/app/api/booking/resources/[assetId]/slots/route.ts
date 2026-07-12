import { NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { BookingService } from "@/app/api/modules/booking/services/BookingService";

const service = new BookingService();

export async function GET(
  _req: Request,
  context: { params: Promise<{ assetId: string }> }
) {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const { assetId } = await context.params;
    const result = await service.listResourceSlots(
      assetId,
      auth.employee.organizationId
    );
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("GET /api/booking/resources/[assetId]/slots", error);
    return NextResponse.json({ error: "Failed to load slots" }, { status: 500 });
  }
}
