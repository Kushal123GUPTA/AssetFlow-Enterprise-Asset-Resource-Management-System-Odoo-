import { NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { MaintenanceService } from "@/app/api/modules/maintenance/services/MaintenanceService";

const service = new MaintenanceService();

export async function GET() {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const data = await service.listMine(auth.employee.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/maintenance/mine", error);
    return NextResponse.json({ error: "Failed to load maintenance requests" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    if (!body?.assetId || !body?.issueDescription) {
      return NextResponse.json(
        { error: "assetId and issueDescription are required" },
        { status: 400 }
      );
    }
    const result = await service.createMine(auth.employee.id, {
      assetId: body.assetId,
      issueTitle: body.issueTitle,
      issueDescription: body.issueDescription,
      priority: body.priority,
      photoUrl: body.photoUrl,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/maintenance/mine", error);
    return NextResponse.json({ error: "Failed to create maintenance request" }, { status: 500 });
  }
}
