import { NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { EmployeeDashboardService } from "@/app/modules/dashboard/services/EmployeeDashboardService";

const service = new EmployeeDashboardService();

export async function GET() {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const data = await service.getSummary(auth.employee.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/dashboard/employee/summary", error);
    return NextResponse.json({ error: "Failed to load dashboard summary" }, { status: 500 });
  }
}
