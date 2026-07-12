import { NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { AllocationService } from "@/app/api/modules/allocation/services/AllocationService";

const service = new AllocationService();

export async function GET(
  _req: Request,
  context: { params: Promise<{ allocationId: string }> }
) {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const { allocationId } = await context.params;
    const data = await service.getMineDetail(auth.employee.id, allocationId);
    if (!data) {
      return NextResponse.json({ error: "Allocation not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/allocation/mine/[id]", error);
    return NextResponse.json({ error: "Failed to load allocation" }, { status: 500 });
  }
}
