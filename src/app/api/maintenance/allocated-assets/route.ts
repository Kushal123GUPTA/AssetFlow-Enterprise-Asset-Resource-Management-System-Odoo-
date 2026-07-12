import { NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { MaintenanceService } from "@/app/api/modules/maintenance/services/MaintenanceService";

const service = new MaintenanceService();

export async function GET() {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const data = await service.listAllocatedAssets(auth.employee.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/maintenance/allocated-assets", error);
    return NextResponse.json({ error: "Failed to load allocated assets" }, { status: 500 });
  }
}
