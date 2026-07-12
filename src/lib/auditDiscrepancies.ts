import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { discrepancyReports } from "@/db/schema";

type DiscrepancyType = "missing" | "damaged";

/** Upsert an open discrepancy report for a flagged audit item. */
export async function upsertDiscrepancyReport(input: {
  auditItemId: string;
  auditCycleId: string;
  assetId: string;
  discrepancyType: DiscrepancyType;
  notes?: string | null;
  createdBy: string;
}) {
  const [existing] = await db
    .select({ id: discrepancyReports.id })
    .from(discrepancyReports)
    .where(
      and(
        eq(discrepancyReports.auditItemId, input.auditItemId),
        isNull(discrepancyReports.deletedAt)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(discrepancyReports)
      .set({
        discrepancyType: input.discrepancyType,
        notes: input.notes ?? null,
        resolutionStatus: "open",
        resolvedAt: null,
        resolvedBy: null,
        updatedBy: input.createdBy,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(discrepancyReports.id, existing.id));
    return existing.id;
  }

  const [created] = await db
    .insert(discrepancyReports)
    .values({
      auditItemId: input.auditItemId,
      auditCycleId: input.auditCycleId,
      assetId: input.assetId,
      discrepancyType: input.discrepancyType,
      notes: input.notes ?? null,
      resolutionStatus: "open",
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
    })
    .returning({ id: discrepancyReports.id });

  return created.id;
}

/** Soft-close open discrepancy when item is re-verified as OK. */
export async function clearDiscrepancyForItem(auditItemId: string, updatedBy: string) {
  await db
    .update(discrepancyReports)
    .set({
      resolutionStatus: "cleared",
      resolvedAt: new Date().toISOString(),
      resolvedBy: updatedBy,
      updatedBy,
      updatedAt: new Date().toISOString(),
      deletedAt: new Date().toISOString(),
      deletedBy: updatedBy,
    })
    .where(
      and(
        eq(discrepancyReports.auditItemId, auditItemId),
        eq(discrepancyReports.resolutionStatus, "open"),
        isNull(discrepancyReports.deletedAt)
      )
    );
}

/** Mark open discrepancies for a cycle as reconciled on close. */
export async function reconcileDiscrepanciesForCycle(
  auditCycleId: string,
  resolvedBy: string
) {
  await db
    .update(discrepancyReports)
    .set({
      resolutionStatus: "reconciled",
      resolvedAt: new Date().toISOString(),
      resolvedBy,
      updatedBy: resolvedBy,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(discrepancyReports.auditCycleId, auditCycleId),
        eq(discrepancyReports.resolutionStatus, "open"),
        isNull(discrepancyReports.deletedAt)
      )
    );
}
