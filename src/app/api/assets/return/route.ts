import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetAllocations, assetStatusHistory } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { logActivity } from "@/lib/activityLog";

// POST /api/assets/return — Return allocated asset
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { allocationId, actualReturnDate, condition, checkInNotes } = body;

    if (!allocationId) {
      return NextResponse.json({ error: "Allocation ID is required" }, { status: 400 });
    }
    if (!condition) {
      return NextResponse.json({ error: "Condition is required on return" }, { status: 400 });
    }

    const organizationId = session.user.organizationId;

    // Fetch allocation details
    const allocRecord = await db
      .select({
        id: assetAllocations.id,
        assetId: assetAllocations.assetId,
        status: assetAllocations.status,
      })
      .from(assetAllocations)
      .innerJoin(assets, eq(assetAllocations.assetId, assets.id))
      .where(
        and(
          eq(assetAllocations.id, allocationId),
          eq(assets.organizationId, organizationId)
        )
      )
      .limit(1);

    if (allocRecord.length === 0) {
      return NextResponse.json({ error: "Allocation record not found" }, { status: 404 });
    }

    const alloc = allocRecord[0];
    if (alloc.status === "returned") {
      return NextResponse.json({ error: "Asset is already returned" }, { status: 400 });
    }

    const returnDate = actualReturnDate || new Date().toISOString().split("T")[0];

    // Update allocation record
    const updatedAllocation = await db
      .update(assetAllocations)
      .set({
        actualReturnDate: returnDate,
        status: "returned",
        returnConditionNotes: checkInNotes || null,
      })
      .where(eq(assetAllocations.id, allocationId))
      .returning();

    // Determine target asset status based on condition
    let targetStatus: "available" | "under_maintenance" | "disposed" = "available";
    if (condition === "damaged" || condition === "poor") {
      targetStatus = "under_maintenance";
    }

    // Update asset
    await db
      .update(assets)
      .set({
        status: targetStatus,
        condition,
        updatedBy: session.user.id,
      })
      .where(eq(assets.id, alloc.assetId));

    // Log status history
    await db.insert(assetStatusHistory).values({
      assetId: alloc.assetId,
      fromStatus: "allocated",
      toStatus: targetStatus,
      changedBy: session.user.id,
      reason: `Returned by user. Return condition: ${condition}. Notes: ${checkInNotes ?? ""}`,
    });

    await logActivity({
      organizationId,
      employeeId: session.user.id,
      action: "asset_returned",
      entityType: "allocation",
      entityId: allocationId,
      details: { assetId: alloc.assetId, condition, targetStatus },
    });

    return NextResponse.json({ data: updatedAllocation[0] });
  } catch (error: any) {
    console.error("RETURN asset error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
