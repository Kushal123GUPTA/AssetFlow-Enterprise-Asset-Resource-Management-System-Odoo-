import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { maintenanceRequests, assets } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/assets/maintenance/reject — Reject a pending maintenance ticket
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, rejectionReason } = await req.json();
    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    // Update maintenance request status
    const updated = await db
      .update(maintenanceRequests)
      .set({
        status: "rejected",
        rejectionReason: rejectionReason || null,
        approvedBy: session.user.id,
        approvedAt: new Date().toISOString(),
        updatedBy: session.user.id,
      })
      .where(eq(maintenanceRequests.id, requestId))
      .returning();

    if (updated.length > 0) {
      const ticket = updated[0];
      // Revert asset back to available if it was marked under maintenance
      await db
        .update(assets)
        .set({ status: "available" })
        .where(eq(assets.id, ticket.assetId));
    }

    return NextResponse.json({ data: updated[0] });
  } catch (error: any) {
    console.error("REJECT maintenance error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
