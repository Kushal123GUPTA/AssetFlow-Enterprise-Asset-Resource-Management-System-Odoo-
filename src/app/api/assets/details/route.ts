import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetCategories, departments, employees, assetAllocations, maintenanceRequests, assetStatusHistory } from "@/db/schema";
import { eq, and, isNull, desc, inArray } from "drizzle-orm";

// POST /api/assets/details — Get single asset with allocation + maintenance + status history
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    // Fetch asset, allocations, maintenance, and status history in parallel
    const [assetRows, allocationRows, maintenanceRows, statusRows] = await Promise.all([
      db.select().from(assets).where(and(eq(assets.id, id), isNull(assets.deletedAt))).limit(1),
      db.select().from(assetAllocations).where(and(eq(assetAllocations.assetId, id), isNull(assetAllocations.deletedAt))).orderBy(desc(assetAllocations.allocatedAt)),
      db.select().from(maintenanceRequests).where(and(eq(maintenanceRequests.assetId, id), isNull(maintenanceRequests.deletedAt))).orderBy(desc(maintenanceRequests.createdAt)),
      db.select().from(assetStatusHistory).where(eq(assetStatusHistory.assetId, id)).orderBy(desc(assetStatusHistory.changedAt)),
    ]);

    if (assetRows.length === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const asset = assetRows[0];

    // Resolve related names
    const empIds = [
      ...allocationRows.map(a => a.employeeId).filter(Boolean),
      ...allocationRows.map(a => a.allocatedBy).filter(Boolean),
      ...statusRows.map(s => s.changedBy).filter(Boolean),
      ...maintenanceRows.map(m => m.raisedBy).filter(Boolean),
    ] as string[];
    const deptIds = [
      ...allocationRows.map(a => a.departmentId).filter(Boolean),
      asset.departmentId,
    ].filter(Boolean) as string[];

    const uniqueEmpIds = [...new Set(empIds)];
    const uniqueDeptIds = [...new Set(deptIds)];

    const [emps, depts, cats] = await Promise.all([
      uniqueEmpIds.length > 0
        ? db.select({ id: employees.id, name: employees.name }).from(employees).where(inArray(employees.id, uniqueEmpIds))
        : [],
      uniqueDeptIds.length > 0
        ? db.select({ id: departments.id, name: departments.name }).from(departments).where(inArray(departments.id, uniqueDeptIds))
        : [],
      db.select({ id: assetCategories.id, name: assetCategories.name }).from(assetCategories).where(eq(assetCategories.id, asset.categoryId)),
    ]);

    const empMap = new Map(emps.map(e => [e.id, e.name]));
    const deptMap = new Map(depts.map(d => [d.id, d.name]));

    const enrichedAsset = {
      ...asset,
      categoryName: cats[0]?.name ?? "Unknown",
      departmentName: asset.departmentId ? deptMap.get(asset.departmentId) ?? null : null,
    };

    const enrichedAllocations = allocationRows.map(a => ({
      id: a.id,
      employeeName: a.employeeId ? empMap.get(a.employeeId) ?? null : null,
      departmentName: a.departmentId ? deptMap.get(a.departmentId) ?? null : null,
      allocatedByName: empMap.get(a.allocatedBy) ?? null,
      allocatedAt: a.allocatedAt,
      expectedReturnDate: a.expectedReturnDate,
      actualReturnDate: a.actualReturnDate,
      status: a.status,
    }));

    const enrichedStatusHistory = statusRows.map(s => ({
      id: s.id,
      fromStatus: s.fromStatus,
      toStatus: s.toStatus,
      changedBy: s.changedBy,
      changedByName: s.changedBy ? empMap.get(s.changedBy) ?? null : null,
      reason: s.reason,
      changedAt: s.changedAt,
    }));

    return NextResponse.json({
      data: {
        asset: enrichedAsset,
        allocations: enrichedAllocations,
        maintenance: maintenanceRows,
        statusHistory: enrichedStatusHistory,
      },
    });
  } catch (error: any) {
    console.error("DETAILS asset error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
