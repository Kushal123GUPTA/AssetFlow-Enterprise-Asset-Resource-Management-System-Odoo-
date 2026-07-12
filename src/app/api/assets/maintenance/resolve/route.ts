import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { maintenanceRequests, assets, assetStatusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notifyEmployee } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, resolutionNotes, assetCondition, nextAssetStatus } =
      await req.json();
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
    if (
      existing.status !== "technician_assigned" &&
      existing.status !== "in_progress"
    ) {
      return NextResponse.json(
        { error: "Ticket must be assigned or in progress to resolve" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(maintenanceRequests)
      .set({
        status: "resolved",
        resolutionNotes: resolutionNotes || null,
        resolvedAt: new Date().toISOString(),
        updatedBy: session.user.id,
      })
      .where(eq(maintenanceRequests.id, requestId))
      .returning();

    const targetStatus = nextAssetStatus || "available";

    await db
      .update(assets)
      .set({
        status: targetStatus,
        condition: assetCondition || undefined,
        updatedBy: session.user.id,
      })
      .where(eq(assets.id, updated.assetId));

    await db.insert(assetStatusHistory).values({
      assetId: updated.assetId,
      fromStatus: "under_maintenance",
      toStatus: targetStatus,
      changedBy: session.user.id,
      reason: `Maintenance resolved. Resolution notes: ${resolutionNotes ?? ""}. Asset status: ${targetStatus}.`,
    });

    const [asset] = await db
      .select({ name: assets.name, assetTag: assets.assetTag })
      .from(assets)
      .where(eq(assets.id, updated.assetId))
      .limit(1);

    await notifyEmployee({
      employeeId: updated.raisedBy,
      type: "maintenance_resolved",
      message: `Maintenance resolved for ${asset?.assetTag ?? "asset"} — ${asset?.name ?? "item"}.`,
      relatedEntityType: "maintenance_request",
      relatedEntityId: updated.id,
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("RESOLVE maintenance error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
