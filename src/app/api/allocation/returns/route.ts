import { NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { AllocationService } from "@/app/api/modules/allocation/services/AllocationService";

const service = new AllocationService();

export async function GET() {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const data = await service.listMyReturnRequests(auth.employee.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/allocation/returns", error);
    return NextResponse.json({ error: "Failed to load return requests" }, { status: 500 });
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
    const result = await service.createReturnRequest(auth.employee.id, {
      allocationId: body.allocationId,
      reason: body.reason,
      conditionNotes: body.conditionNotes,
      preferredReturnDate: body.preferredReturnDate,
      attachmentUrl: body.attachmentUrl,
      remarks: body.remarks,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/allocation/returns", error);
    return NextResponse.json({ error: "Failed to create return request" }, { status: 500 });
  }
}
