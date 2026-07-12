import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { maintenanceRequests, assets, assetStatusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/assets/maintenance/resolve — Resolve maintenance request and update asset condition/status
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, resolutionNotes, assetCondition, nextAssetStatus } = await req.json();
    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    // Resolve maintenance request
    const updated = await db
      .update(maintenanceRequests)
      .set({
        status: "resolved",
        resolutionNotes: resolutionNotes || null,
        resolvedAt: new Date().toISOString(),
        updatedBy: session.user.id,
      })
      .where(eq(maintenanceRequests.id, requestId))
      .returning();

    if (updated.length > 0) {
      const ticket = updated[0];
      const targetStatus = nextAssetStatus || "available";

      // Update asset condition and status
      await db
        .update(assets)
        .set({
          status: targetStatus,
          condition: assetCondition || undefined,
          updatedBy: session.user.id,
        })
        .where(eq(assets.id, ticket.assetId));

      // Log status change history
      await db.insert(assetStatusHistory).values({
        assetId: ticket.assetId,
        fromStatus: "under_maintenance",
        toStatus: targetStatus,
        changedBy: session.user.id,
        reason: `Maintenance resolved. Resolution notes: ${resolutionNotes ?? ""}. Asset status: ${targetStatus}.`,
      });
    }

    return NextResponse.json({ data: updated[0] });
  } catch (error: any) {
    console.error("RESOLVE maintenance error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
