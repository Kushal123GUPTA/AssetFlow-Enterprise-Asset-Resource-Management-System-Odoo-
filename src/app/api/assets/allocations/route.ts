import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetAllocations, employees, departments } from "@/db/schema";
import { eq, and, isNull, ilike, desc, inArray, or } from "drizzle-orm";

// POST /api/assets/allocations — Get allocations (with filters)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { search, status, type } = body;
    const organizationId = session.user.organizationId;

    const conditions = [
      eq(assets.organizationId, organizationId),
      isNull(assetAllocations.deletedAt),
    ];

    if (status) conditions.push(eq(assetAllocations.status, status));
    if (type === "employee") {
      conditions.push(isNull(assetAllocations.departmentId));
    } else if (type === "department") {
      conditions.push(isNull(assetAllocations.employeeId));
    }

    // Fetch allocations matching the status/type first
    const rows = await db
      .select({
        id: assetAllocations.id,
        assetId: assetAllocations.assetId,
        employeeId: assetAllocations.employeeId,
        departmentId: assetAllocations.departmentId,
        allocatedBy: assetAllocations.allocatedBy,
        allocatedAt: assetAllocations.allocatedAt,
        expectedReturnDate: assetAllocations.expectedReturnDate,
        actualReturnDate: assetAllocations.actualReturnDate,
        status: assetAllocations.status,
        returnConditionNotes: assetAllocations.returnConditionNotes,
        createdAt: assetAllocations.createdAt,
      })
      .from(assetAllocations)
      .innerJoin(assets, eq(assetAllocations.assetId, assets.id))
      .where(and(...conditions))
      .orderBy(desc(assetAllocations.createdAt));

    if (rows.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Collect keys for batch resolution
    const assetIds = [...new Set(rows.map(r => r.assetId))];
    const empIds = [
      ...rows.map(r => r.employeeId).filter(Boolean),
      ...rows.map(r => r.allocatedBy).filter(Boolean),
    ] as string[];
    const deptIds = [...new Set(rows.map(r => r.departmentId).filter(Boolean))] as string[];

    const [allAssets, allEmps, allDepts] = await Promise.all([
      db.select({ id: assets.id, name: assets.name, assetTag: assets.assetTag }).from(assets).where(inArray(assets.id, assetIds)),
      empIds.length > 0 ? db.select({ id: employees.id, name: employees.name }).from(employees).where(inArray(employees.id, empIds)) : [],
      deptIds.length > 0 ? db.select({ id: departments.id, name: departments.name }).from(departments).where(inArray(departments.id, deptIds)) : [],
    ]);

    const assetMap = new Map(allAssets.map(a => [a.id, a]));
    const empMap = new Map(allEmps.map(e => [e.id, e.name]));
    const deptMap = new Map(allDepts.map(d => [d.id, d.name]));

    const enriched = rows
      .map(r => {
        const asset = assetMap.get(r.assetId);
        return {
          ...r,
          assetTag: asset?.assetTag ?? "Unknown",
          assetName: asset?.name ?? "Unknown",
          employeeName: r.employeeId ? empMap.get(r.employeeId) ?? "Unknown" : null,
          departmentName: r.departmentId ? deptMap.get(r.departmentId) ?? "Unknown" : null,
          allocatedByName: r.allocatedBy ? empMap.get(r.allocatedBy) ?? "System" : "System",
        };
      })
      // Post-filtering for search matching name, tag, employeeName or departmentName
      .filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.assetName.toLowerCase().includes(q) ||
          r.assetTag.toLowerCase().includes(q) ||
          (r.employeeName && r.employeeName.toLowerCase().includes(q)) ||
          (r.departmentName && r.departmentName.toLowerCase().includes(q))
        );
      });

    return NextResponse.json({ data: enriched });
  } catch (error: any) {
    console.error("GET allocations error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
