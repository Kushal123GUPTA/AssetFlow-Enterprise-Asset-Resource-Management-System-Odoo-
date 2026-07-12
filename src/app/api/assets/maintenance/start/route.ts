import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, maintenanceRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notifyEmployee } from "@/lib/notifications";

/** technician_assigned → in_progress (work started). */
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
    if (existing.status !== "technician_assigned") {
      return NextResponse.json(
        { error: "Only technician-assigned tickets can move to in progress" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(maintenanceRequests)
      .set({
        status: "in_progress",
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
      type: "maintenance_in_progress",
      message: `Maintenance is in progress for ${asset?.assetTag ?? "asset"} — ${asset?.name ?? "item"}.`,
      relatedEntityType: "maintenance_request",
      relatedEntityId: updated.id,
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("START maintenance error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
