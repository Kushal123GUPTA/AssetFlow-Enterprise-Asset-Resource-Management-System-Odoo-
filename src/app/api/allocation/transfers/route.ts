import { NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { AllocationService } from "@/app/api/modules/allocation/services/AllocationService";

const service = new AllocationService();

export async function GET() {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const data = await service.listMyTransferRequests(auth.employee.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/allocation/transfers", error);
    return NextResponse.json({ error: "Failed to load transfer requests" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    if (!body?.allocationId) {
      return NextResponse.json({ error: "allocationId is required" }, { status: 400 });
    }
    const result = await service.createTransferRequest(
      auth.employee.id,
      auth.employee.organizationId,
      {
        allocationId: body.allocationId,
        toEmployeeId: body.toEmployeeId,
        toDepartmentId: body.toDepartmentId,
        reason: body.reason,
        notes: body.notes,
      }
    );
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/allocation/transfers", error);
    return NextResponse.json({ error: "Failed to create transfer request" }, { status: 500 });
  }
}
