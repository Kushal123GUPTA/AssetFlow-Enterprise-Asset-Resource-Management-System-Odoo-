import { NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { AllocationService } from "@/app/api/modules/allocation/services/AllocationService";

const service = new AllocationService();

export async function GET() {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const data = await service.listMine(auth.employee.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/allocation/mine", error);
    return NextResponse.json({ error: "Failed to load allocations" }, { status: 500 });
  }
}
