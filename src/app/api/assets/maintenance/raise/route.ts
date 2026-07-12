import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, maintenanceRequests, assetStatusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/assets/maintenance/raise — Create a maintenance ticket and mark asset under maintenance
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assetId, issueDescription, priority, photoUrl } = await req.json();

    if (!assetId || !issueDescription) {
      return NextResponse.json({ error: "Asset ID and issue description are required" }, { status: 400 });
    }

    // Insert maintenance request
    const ticket = await db
      .insert(maintenanceRequests)
      .values({
        assetId,
        raisedBy: session.user.id,
        issueDescription,
        priority: priority || "medium",
        photoUrl: photoUrl || null,
        status: "pending",
      })
      .returning();

    // Fetch current status of asset for history log
    const assetRecord = await db
      .select({ status: assets.status })
      .from(assets)
      .where(eq(assets.id, assetId))
      .limit(1);

    const fromStatus = assetRecord[0]?.status ?? "available";

    // Transition asset status to under_maintenance
    await db
      .update(assets)
      .set({
        status: "under_maintenance",
        updatedBy: session.user.id,
      })
      .where(eq(assets.id, assetId));

    // Log status history
    await db.insert(assetStatusHistory).values({
      assetId,
      fromStatus,
      toStatus: "under_maintenance",
      changedBy: session.user.id,
      reason: `Maintenance ticket raised: ${issueDescription}`,
    });

    return NextResponse.json({ data: ticket[0] });
  } catch (error: any) {
    console.error("RAISE maintenance error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
