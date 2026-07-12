import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { auditItems, auditCycles, assets, auditCycleAuditors } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import {
  clearDiscrepancyForItem,
  upsertDiscrepancyReport,
} from "@/lib/auditDiscrepancies";
import { notifyEmployees } from "@/lib/notifications";

const ALLOWED = new Set(["verified", "missing", "damaged"]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { auditItemId, status, notes } = await req.json();

    if (!auditItemId || !status) {
      return NextResponse.json(
        { error: "Audit Item ID and status are required" },
        { status: 400 }
      );
    }
    if (!ALLOWED.has(status)) {
      return NextResponse.json(
        { error: "Status must be verified, missing, or damaged" },
        { status: 400 }
      );
    }

    const [itemRecord] = await db
      .select({
        id: auditItems.id,
        auditCycleId: auditItems.auditCycleId,
        assetId: auditItems.assetId,
      })
      .from(auditItems)
      .where(eq(auditItems.id, auditItemId))
      .limit(1);

    if (!itemRecord) {
      return NextResponse.json({ error: "Audit item not found" }, { status: 404 });
    }

    const [cycle] = await db
      .select({ status: auditCycles.status, name: auditCycles.name })
      .from(auditCycles)
      .where(eq(auditCycles.id, itemRecord.auditCycleId))
      .limit(1);

    if (cycle?.status === "closed") {
      return NextResponse.json(
        { error: "Audit campaign is closed and locked" },
        { status: 400 }
      );
    }

    if (cycle?.status === "planned") {
      await db
        .update(auditCycles)
        .set({
          status: "in_progress",
          updatedBy: session.user.id,
        })
        .where(eq(auditCycles.id, itemRecord.auditCycleId));
    }

    const [updated] = await db
      .update(auditItems)
      .set({
        status,
        notes: notes || null,
        verifiedBy: session.user.id,
        verifiedAt: new Date().toISOString(),
        updatedBy: session.user.id,
      })
      .where(eq(auditItems.id, auditItemId))
      .returning();

    if (status === "missing" || status === "damaged") {
      await upsertDiscrepancyReport({
        auditItemId: itemRecord.id,
        auditCycleId: itemRecord.auditCycleId,
        assetId: itemRecord.assetId,
        discrepancyType: status,
        notes: notes || null,
        createdBy: session.user.id,
      });

      const [asset] = await db
        .select({ name: assets.name, assetTag: assets.assetTag })
        .from(assets)
        .where(eq(assets.id, itemRecord.assetId))
        .limit(1);

      const auditors = await db
        .select({ employeeId: auditCycleAuditors.employeeId })
        .from(auditCycleAuditors)
        .where(
          and(
            eq(auditCycleAuditors.auditCycleId, itemRecord.auditCycleId),
            isNull(auditCycleAuditors.deletedAt)
          )
        );

      await notifyEmployees(
        auditors.map((a) => a.employeeId),
        {
          type: "audit_discrepancy_flagged",
          message: `Audit discrepancy (${status}) on ${asset?.assetTag ?? "asset"} — ${asset?.name ?? "item"} in “${cycle?.name ?? "cycle"}”.`,
          relatedEntityType: "audit_cycle",
          relatedEntityId: itemRecord.auditCycleId,
        }
      );
    } else {
      await clearDiscrepancyForItem(itemRecord.id, session.user.id);
    }

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("VERIFY audit item error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
