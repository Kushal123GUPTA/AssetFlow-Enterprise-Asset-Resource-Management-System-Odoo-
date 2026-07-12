import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetStatusHistory, maintenanceRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notifyEmployee } from "@/lib/notifications";

/** Approve pending ticket → Under Maintenance (spec: approval before work). */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(maintenanceRequests)
      .where(eq(maintenanceRequests.id, requestId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending requests can be approved" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(maintenanceRequests)
      .set({
        status: "approved",
        approvedBy: session.user.id,
        approvedAt: new Date().toISOString(),
        updatedBy: session.user.id,
      })
      .where(eq(maintenanceRequests.id, requestId))
      .returning();

    const [assetRecord] = await db
      .select({ status: assets.status, name: assets.name, assetTag: assets.assetTag })
      .from(assets)
      .where(eq(assets.id, updated.assetId))
      .limit(1);

    const fromStatus = assetRecord?.status ?? "available";

    await db
      .update(assets)
      .set({
        status: "under_maintenance",
        updatedBy: session.user.id,
      })
      .where(eq(assets.id, updated.assetId));

    await db.insert(assetStatusHistory).values({
      assetId: updated.assetId,
      fromStatus,
      toStatus: "under_maintenance",
      changedBy: session.user.id,
      reason: `Maintenance approved: ${updated.issueDescription}`,
    });

    await notifyEmployee({
      employeeId: updated.raisedBy,
      type: "maintenance_approved",
      message: `Maintenance approved for ${assetRecord?.assetTag ?? "asset"} — ${assetRecord?.name ?? "item"}. Work can begin.`,
      relatedEntityType: "maintenance_request",
      relatedEntityId: updated.id,
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("APPROVE maintenance error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
