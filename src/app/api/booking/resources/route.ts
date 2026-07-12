import { NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { BookingService } from "@/app/api/modules/booking/services/BookingService";

const service = new BookingService();

export async function GET(req: Request) {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") ?? undefined;
    const data = await service.listBookableResources(
      auth.employee.organizationId,
      search
    );
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/booking/resources", error);
    return NextResponse.json({ error: "Failed to load resources" }, { status: 500 });
  }
}
