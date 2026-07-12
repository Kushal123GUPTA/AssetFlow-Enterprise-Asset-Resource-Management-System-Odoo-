import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, auditCycles, auditItems, assetStatusHistory } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// POST /api/assets/audit/close — Close/lock an audit campaign and reconcile discrepancies
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { auditCycleId } = await req.json();
    if (!auditCycleId) {
      return NextResponse.json({ error: "Audit Cycle ID is required" }, { status: 400 });
    }

    const organizationId = session.user.organizationId;

    // Verify audit campaign exists
    const cycleRecord = await db
      .select({ id: auditCycles.id, status: auditCycles.status })
      .from(auditCycles)
      .where(
        and(
          eq(auditCycles.id, auditCycleId),
          eq(auditCycles.organizationId, organizationId),
          isNull(auditCycles.deletedAt)
        )
      )
      .limit(1);

    if (cycleRecord.length === 0) {
      return NextResponse.json({ error: "Audit cycle not found" }, { status: 404 });
    }

    const cycle = cycleRecord[0];
    if (cycle.status === "closed") {
      return NextResponse.json({ error: "Audit cycle is already closed" }, { status: 400 });
    }

    const timestampNow = new Date().toISOString();

    // 1. Mark campaign as closed
    await db
      .update(auditCycles)
      .set({
        status: "closed",
        closedBy: session.user.id,
        closedAt: timestampNow,
        updatedBy: session.user.id,
      })
      .where(eq(auditCycles.id, auditCycleId));

    // 2. Fetch flagged auditItems to reconcile
    const flaggedItems = await db
      .select({
        id: auditItems.id,
        assetId: auditItems.assetId,
        status: auditItems.status,
        notes: auditItems.notes,
      })
      .from(auditItems)
      .where(
        and(
          eq(auditItems.auditCycleId, auditCycleId),
          isNull(auditItems.deletedAt)
        )
      );

    // 3. Reconcile assets status based on verification outcomes
    await Promise.all(
      flaggedItems.map(async (item) => {
        if (item.status === "missing") {
          // Reconcile to lost
          await db
            .update(assets)
            .set({ status: "lost", updatedBy: session.user.id })
            .where(eq(assets.id, item.assetId));

          await db.insert(assetStatusHistory).values({
            assetId: item.assetId,
            fromStatus: "allocated",
            toStatus: "lost",
            changedBy: session.user.id,
            reason: `Audit campaign reconciliation. Asset marked as missing. Notes: ${item.notes ?? ""}`,
          });
        } else if (item.status === "damaged") {
          // Reconcile to under_maintenance
          await db
            .update(assets)
            .set({ status: "under_maintenance", condition: "poor", updatedBy: session.user.id })
            .where(eq(assets.id, item.assetId));

          await db.insert(assetStatusHistory).values({
            assetId: item.assetId,
            fromStatus: "allocated",
            toStatus: "under_maintenance",
            changedBy: session.user.id,
            reason: `Audit campaign reconciliation. Asset marked as damaged. Notes: ${item.notes ?? ""}`,
          });
        }
      })
    );

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    console.error("CLOSE audit cycle error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
