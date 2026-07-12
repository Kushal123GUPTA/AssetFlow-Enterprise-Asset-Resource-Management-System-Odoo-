import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, maintenanceRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notifyEmployee } from "@/lib/notifications";

/** Reject pending ticket — does not touch asset status (raise no longer flips it). */
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
        { error: "Only pending requests can be rejected" },
        { status: 400 }
      );
    }

    const [updated] = await db
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

    const [asset] = await db
      .select({ name: assets.name, assetTag: assets.assetTag })
      .from(assets)
      .where(eq(assets.id, updated.assetId))
      .limit(1);

    await notifyEmployee({
      employeeId: updated.raisedBy,
      type: "maintenance_rejected",
      message: `Maintenance rejected for ${asset?.assetTag ?? "asset"}${
        rejectionReason ? `: ${rejectionReason}` : "."
      }`,
      relatedEntityType: "maintenance_request",
      relatedEntityId: updated.id,
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("REJECT maintenance error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
