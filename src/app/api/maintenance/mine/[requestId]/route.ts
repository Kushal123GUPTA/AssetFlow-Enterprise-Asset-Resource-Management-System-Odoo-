import { NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { MaintenanceService } from "@/app/api/modules/maintenance/services/MaintenanceService";

const service = new MaintenanceService();

export async function GET(
  _req: Request,
  context: { params: Promise<{ requestId: string }> }
) {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const { requestId } = await context.params;
    const data = await service.getMine(auth.employee.id, requestId);
    if (!data) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/maintenance/mine/[requestId]", error);
    return NextResponse.json({ error: "Failed to load request" }, { status: 500 });
  }
}
