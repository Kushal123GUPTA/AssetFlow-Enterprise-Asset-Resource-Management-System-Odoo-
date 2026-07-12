import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, maintenanceRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notifyEmployee } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, technicianName } = await req.json();
    if (!requestId || !technicianName) {
      return NextResponse.json(
        { error: "Request ID and technician name are required" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(maintenanceRequests)
      .where(eq(maintenanceRequests.id, requestId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (existing.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved tickets can be assigned a technician" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(maintenanceRequests)
      .set({
        status: "technician_assigned",
        technicianName,
        technicianAssignedAt: new Date().toISOString(),
        updatedBy: session.user.id,
      })
      .where(eq(maintenanceRequests.id, requestId))
      .returning();

    const [asset] = await db
      .select({ name: assets.name, assetTag: assets.assetTag })
      .from(assets)
      .where(eq(assets.id, updated.assetId))
      .limit(1);

    await notifyEmployee({
      employeeId: updated.raisedBy,
      type: "maintenance_technician_assigned",
      message: `Technician ${technicianName} assigned to ${asset?.assetTag ?? "asset"}.`,
      relatedEntityType: "maintenance_request",
      relatedEntityId: updated.id,
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("ASSIGN maintenance technician error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
