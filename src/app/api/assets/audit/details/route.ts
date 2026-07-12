import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import {
  assets,
  auditCycles,
  auditItems,
  auditCycleAuditors,
  employees,
  discrepancyReports,
} from "@/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";

// POST /api/assets/audit/details — Retrieve details of a specific audit cycle
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

    const cycleRecord = await db
      .select({
        id: auditCycles.id,
        name: auditCycles.name,
        scopeDepartmentId: auditCycles.scopeDepartmentId,
        scopeLocation: auditCycles.scopeLocation,
        startDate: auditCycles.startDate,
        endDate: auditCycles.endDate,
        status: auditCycles.status,
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

    if (cycleRecord.length === 0) {
      return NextResponse.json({ error: "Audit cycle not found" }, { status: 404 });
    }

    const cycle = cycleRecord[0];

    const auditorsList = await db
      .select({ employeeId: auditCycleAuditors.employeeId, employeeName: employees.name })
      .from(auditCycleAuditors)
      .innerJoin(employees, eq(auditCycleAuditors.employeeId, employees.id))
      .where(
        and(eq(auditCycleAuditors.auditCycleId, auditCycleId), isNull(auditCycleAuditors.deletedAt))
      );

    const items = await db
      .select({
        id: auditItems.id,
        assetId: auditItems.assetId,
        status: auditItems.status,
        notes: auditItems.notes,
        verifiedBy: auditItems.verifiedBy,
        verifiedAt: auditItems.verifiedAt,
      })
      .from(auditItems)
      .where(and(eq(auditItems.auditCycleId, auditCycleId), isNull(auditItems.deletedAt)));

    type EnrichedAuditItem = (typeof items)[number] & {
      assetTag: string;
      assetName: string;
      assetLocation: string;
      verifiedByName: string | null;
    };

    let enrichedItems: EnrichedAuditItem[] = [];
    if (items.length > 0) {
      const assetIds = [...new Set(items.map((i) => i.assetId))];
      const verifiedByEmployeeIds = [
        ...new Set(items.map((i) => i.verifiedBy).filter(Boolean)),
      ] as string[];

      const [allAssets, allEmps] = await Promise.all([
        db
          .select({
            id: assets.id,
            name: assets.name,
            assetTag: assets.assetTag,
            location: assets.location,
          })
          .from(assets)
          .where(inArray(assets.id, assetIds)),
        verifiedByEmployeeIds.length > 0
          ? db
              .select({ id: employees.id, name: employees.name })
              .from(employees)
              .where(inArray(employees.id, verifiedByEmployeeIds))
          : Promise.resolve([] as { id: string; name: string }[]),
      ]);

      const assetMap = new Map(allAssets.map((a) => [a.id, a]));
      const empMap = new Map(allEmps.map((e) => [e.id, e.name]));

      enrichedItems = items.map((i) => {
        const asset = assetMap.get(i.assetId);
        return {
          ...i,
          assetTag: asset?.assetTag ?? "Unknown",
          assetName: asset?.name ?? "Unknown",
          assetLocation: asset?.location ?? "Unknown",
          verifiedByName: i.verifiedBy ? empMap.get(i.verifiedBy) ?? "Unknown" : null,
        };
      });
    }

    // Persisted discrepancy reports (auto-generated on Missing/Damaged)
    const reports = await db
      .select({
        id: discrepancyReports.id,
        auditItemId: discrepancyReports.auditItemId,
        assetId: discrepancyReports.assetId,
        discrepancyType: discrepancyReports.discrepancyType,
        notes: discrepancyReports.notes,
        resolutionStatus: discrepancyReports.resolutionStatus,
        resolvedAt: discrepancyReports.resolvedAt,
        createdAt: discrepancyReports.createdAt,
        createdBy: discrepancyReports.createdBy,
      })
      .from(discrepancyReports)
      .where(
        and(
          eq(discrepancyReports.auditCycleId, auditCycleId),
          isNull(discrepancyReports.deletedAt)
        )
      );

    let enrichedReports: Array<{
      id: string;
      auditItemId: string;
      assetId: string;
      assetTag: string;
      assetName: string;
      assetLocation: string;
      discrepancyType: string;
      notes: string | null;
      resolutionStatus: string;
      resolvedAt: string | null;
      createdAt: string;
      createdByName: string | null;
    }> = [];

    if (reports.length > 0) {
      const reportAssetIds = [...new Set(reports.map((r) => r.assetId))];
      const reportCreatorIds = [
        ...new Set(reports.map((r) => r.createdBy).filter(Boolean)),
      ] as string[];

      const [reportAssets, reportCreators] = await Promise.all([
        db
          .select({
            id: assets.id,
            name: assets.name,
            assetTag: assets.assetTag,
            location: assets.location,
          })
          .from(assets)
          .where(inArray(assets.id, reportAssetIds)),
        reportCreatorIds.length > 0
          ? db
              .select({ id: employees.id, name: employees.name })
              .from(employees)
              .where(inArray(employees.id, reportCreatorIds))
          : Promise.resolve([] as { id: string; name: string }[]),
      ]);

      const assetMap = new Map(reportAssets.map((a) => [a.id, a]));
      const creatorMap = new Map(reportCreators.map((e) => [e.id, e.name]));

      enrichedReports = reports.map((r) => {
        const asset = assetMap.get(r.assetId);
        return {
          id: r.id,
          auditItemId: r.auditItemId,
          assetId: r.assetId,
          assetTag: asset?.assetTag ?? "Unknown",
          assetName: asset?.name ?? "Unknown",
          assetLocation: asset?.location ?? "Unknown",
          discrepancyType: r.discrepancyType,
          notes: r.notes,
          resolutionStatus: r.resolutionStatus,
          resolvedAt: r.resolvedAt,
          createdAt: r.createdAt,
          createdByName: r.createdBy ? creatorMap.get(r.createdBy) ?? null : null,
        };
      });
    }

    return NextResponse.json({
      data: {
        cycle,
        auditors: auditorsList,
        items: enrichedItems,
        discrepancies: enrichedReports,
      },
    });
  } catch (error: any) {
    console.error("GET audit cycle details error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
