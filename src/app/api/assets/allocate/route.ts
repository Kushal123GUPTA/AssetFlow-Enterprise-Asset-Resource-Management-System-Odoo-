import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetAllocations, assetStatusHistory } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { notifyEmployee } from "@/lib/notifications";
import { logActivity } from "@/lib/activityLog";

// POST /api/assets/allocate — Allocate an asset
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { assetId, employeeId, departmentId, expectedReturnDate, notes } = body;

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }
    if (!employeeId && !departmentId) {
      return NextResponse.json({ error: "Either Employee or Department must be selected" }, { status: 400 });
    }

    const organizationId = session.user.organizationId;

    // Check if asset is available
    const assetRecord = await db
      .select({ status: assets.status })
      .from(assets)
      .where(and(eq(assets.id, assetId), eq(assets.organizationId, organizationId), isNull(assets.deletedAt)))
      .limit(1);

    if (assetRecord.length === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (assetRecord[0].status !== "available") {
      return NextResponse.json({ error: "Asset is not available for allocation" }, { status: 400 });
    }

    // Insert allocation record
    const insertedAllocation = await db
      .insert(assetAllocations)
      .values({
        assetId,
        employeeId: employeeId || null,
        departmentId: departmentId || null,
        allocatedBy: session.user.id,
        expectedReturnDate: expectedReturnDate || null,
        status: "active",
      })
      .returning();

    // Update asset status
    await db
      .update(assets)
      .set({ status: "allocated", updatedBy: session.user.id })
      .where(eq(assets.id, assetId));

    // Log status history
    await db.insert(assetStatusHistory).values({
      assetId,
      fromStatus: "available",
      toStatus: "allocated",
      changedBy: session.user.id,
      reason: employeeId ? "Allocated to employee" : "Allocated to department",
    });

    if (employeeId) {
      const [assetMeta] = await db
        .select({ name: assets.name, assetTag: assets.assetTag })
        .from(assets)
        .where(eq(assets.id, assetId))
        .limit(1);
      await notifyEmployee({
        employeeId,
        type: "asset_assigned",
        message: `Asset assigned: ${assetMeta?.assetTag ?? ""} ${assetMeta?.name ?? ""}`.trim(),
        relatedEntityType: "allocation",
        relatedEntityId: insertedAllocation[0].id,
      });
    }

    await logActivity({
      organizationId,
      employeeId: session.user.id,
      action: "asset_allocated",
      entityType: "allocation",
      entityId: insertedAllocation[0].id,
      details: { assetId, employeeId: employeeId || null, departmentId: departmentId || null },
    });

    return NextResponse.json({ data: insertedAllocation[0] });
  } catch (error: any) {
    console.error("ALLOCATE asset error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
