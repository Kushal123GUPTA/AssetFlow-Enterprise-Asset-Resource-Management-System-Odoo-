import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, auditCycles, auditItems, auditCycleAuditors, employees, departments } from "@/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";

// POST /api/assets/audit/details — Retrieve details of a specific audit cycle (metadata, items list, auditors)
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

    // 1. Fetch Cycle Metadata
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

    // 2. Fetch assigned auditors list
    const auditorsList = await db
      .select({ employeeId: auditCycleAuditors.employeeId, employeeName: employees.name })
      .from(auditCycleAuditors)
      .innerJoin(employees, eq(auditCycleAuditors.employeeId, employees.id))
      .where(and(eq(auditCycleAuditors.auditCycleId, auditCycleId), isNull(auditCycleAuditors.deletedAt)));

    // 3. Fetch audit items
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

    let enrichedItems: any[] = [];
    if (items.length > 0) {
      const assetIds = [...new Set(items.map((i) => i.assetId))];
      const verifiedByEmployeeIds = [...new Set(items.map((i) => i.verifiedBy).filter(Boolean))] as string[];

      const [allAssets, allEmps] = await Promise.all([
        db.select({ id: assets.id, name: assets.name, assetTag: assets.assetTag, location: assets.location }).from(assets).where(inArray(assets.id, assetIds)),
        verifiedByEmployeeIds.length > 0 ? db.select({ id: employees.id, name: employees.name }).from(employees).where(inArray(employees.id, verifiedByEmployeeIds)) : [],
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

    return NextResponse.json({
      data: {
        cycle,
        auditors: auditorsList,
        items: enrichedItems,
      },
    });
  } catch (error: any) {
    console.error("GET audit cycle details error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
