import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import {
  assets,
  auditCycles,
  auditItems,
  assetStatusHistory,
  auditCycleAuditors,
} from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import {
  reconcileDiscrepanciesForCycle,
  upsertDiscrepancyReport,
} from "@/lib/auditDiscrepancies";
import { notifyEmployees } from "@/lib/notifications";

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

    const [cycle] = await db
      .select({
        id: auditCycles.id,
        status: auditCycles.status,
        name: auditCycles.name,
      })
      .from(auditCycles)
      .where(
        and(
          eq(auditCycles.id, auditCycleId),
          eq(auditCycles.organizationId, organizationId),
          isNull(auditCycles.deletedAt)
        )
      )
      .limit(1);

    if (!cycle) {
      return NextResponse.json({ error: "Audit cycle not found" }, { status: 404 });
    }
    if (cycle.status === "closed") {
      return NextResponse.json({ error: "Audit cycle is already closed" }, { status: 400 });
    }

    const timestampNow = new Date().toISOString();

    const flaggedItems = await db
      .select({
        id: auditItems.id,
        assetId: auditItems.assetId,
        status: auditItems.status,
        notes: auditItems.notes,
      })
      .from(auditItems)
      .where(
        and(eq(auditItems.auditCycleId, auditCycleId), isNull(auditItems.deletedAt))
      );

    // Ensure discrepancy reports exist for every flagged item before lock
    for (const item of flaggedItems) {
      if (item.status === "missing" || item.status === "damaged") {
        await upsertDiscrepancyReport({
          auditItemId: item.id,
          auditCycleId,
          assetId: item.assetId,
          discrepancyType: item.status,
          notes: item.notes,
          createdBy: session.user.id,
        });
      }
    }

    await db
      .update(auditCycles)
      .set({
        status: "closed",
        closedBy: session.user.id,
        closedAt: timestampNow,
        updatedBy: session.user.id,
      })
      .where(eq(auditCycles.id, auditCycleId));

    let missingCount = 0;
    let damagedCount = 0;

    for (const item of flaggedItems) {
      if (item.status === "missing") {
        missingCount += 1;
        const [asset] = await db
          .select({ status: assets.status })
          .from(assets)
          .where(eq(assets.id, item.assetId))
          .limit(1);
        const fromStatus = asset?.status ?? "allocated";

        await db
          .update(assets)
          .set({ status: "lost", updatedBy: session.user.id })
          .where(eq(assets.id, item.assetId));

        await db.insert(assetStatusHistory).values({
          assetId: item.assetId,
          fromStatus,
          toStatus: "lost",
          changedBy: session.user.id,
          reason: `Audit campaign reconciliation. Asset marked as missing. Notes: ${item.notes ?? ""}`,
        });
      } else if (item.status === "damaged") {
        damagedCount += 1;
        const [asset] = await db
          .select({ status: assets.status })
          .from(assets)
          .where(eq(assets.id, item.assetId))
          .limit(1);
        const fromStatus = asset?.status ?? "allocated";

        await db
          .update(assets)
          .set({
            status: "under_maintenance",
            condition: "poor",
            updatedBy: session.user.id,
          })
          .where(eq(assets.id, item.assetId));

        await db.insert(assetStatusHistory).values({
          assetId: item.assetId,
          fromStatus,
          toStatus: "under_maintenance",
          changedBy: session.user.id,
          reason: `Audit campaign reconciliation. Asset marked as damaged. Notes: ${item.notes ?? ""}`,
        });
      }
    }

    await reconcileDiscrepanciesForCycle(auditCycleId, session.user.id);

    const auditors = await db
      .select({ employeeId: auditCycleAuditors.employeeId })
      .from(auditCycleAuditors)
      .where(
        and(
          eq(auditCycleAuditors.auditCycleId, auditCycleId),
          isNull(auditCycleAuditors.deletedAt)
        )
      );

    await notifyEmployees(
      auditors.map((a) => a.employeeId),
      {
        type: "audit_cycle_closed",
        message: `Audit “${cycle.name}” closed. ${missingCount} missing → Lost, ${damagedCount} damaged → Under Maintenance.`,
        relatedEntityType: "audit_cycle",
        relatedEntityId: auditCycleId,
      }
    );

    return NextResponse.json({
      data: {
        success: true,
        discrepancies: { missing: missingCount, damaged: damagedCount },
      },
    });
  } catch (error: any) {
    console.error("CLOSE audit cycle error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
