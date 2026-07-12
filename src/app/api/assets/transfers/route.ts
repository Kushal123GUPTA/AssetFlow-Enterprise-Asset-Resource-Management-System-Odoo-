import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, transferRequests, employees, departments } from "@/db/schema";
import { eq, and, isNull, inArray, desc } from "drizzle-orm";

// POST /api/assets/transfers — Retrieve all transfer requests for an organization
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;
    const organizationId = session.user.organizationId;

    const conditions = [
      eq(assets.organizationId, organizationId),
      isNull(transferRequests.deletedAt),
    ];

    if (status) {
      conditions.push(eq(transferRequests.status, status));
    }

    // Query transfer requests inner-joined with assets to enforce organization scope
    const rows = await db
      .select({
        id: transferRequests.id,
        assetId: transferRequests.assetId,
        currentAllocationId: transferRequests.currentAllocationId,
        fromEmployeeId: transferRequests.fromEmployeeId,
        fromDepartmentId: transferRequests.fromDepartmentId,
        toEmployeeId: transferRequests.toEmployeeId,
        toDepartmentId: transferRequests.toDepartmentId,
        requestedBy: transferRequests.requestedBy,
        status: transferRequests.status,
        approvedBy: transferRequests.approvedBy,
        approvedAt: transferRequests.approvedAt,
        resultingAllocationId: transferRequests.resultingAllocationId,
        createdAt: transferRequests.createdAt,
      })
      .from(transferRequests)
      .innerJoin(assets, eq(transferRequests.assetId, assets.id))
      .where(and(...conditions))
      .orderBy(desc(transferRequests.createdAt));

    if (rows.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Batch resolve ids to strings for name mapping
    const assetIds = [...new Set(rows.map(r => r.assetId))];
    const empIds = [
      ...rows.map(r => r.fromEmployeeId).filter(Boolean),
      ...rows.map(r => r.toEmployeeId).filter(Boolean),
      ...rows.map(r => r.requestedBy).filter(Boolean),
      ...rows.map(r => r.approvedBy).filter(Boolean),
    ] as string[];
    const deptIds = [
      ...rows.map(r => r.fromDepartmentId).filter(Boolean),
      ...rows.map(r => r.toDepartmentId).filter(Boolean),
    ] as string[];

    const [allAssets, allEmps, allDepts] = await Promise.all([
      db.select({ id: assets.id, name: assets.name, assetTag: assets.assetTag }).from(assets).where(inArray(assets.id, assetIds)),
      empIds.length > 0 ? db.select({ id: employees.id, name: employees.name }).from(employees).where(inArray(employees.id, empIds)) : [],
      deptIds.length > 0 ? db.select({ id: departments.id, name: departments.name }).from(departments).where(inArray(departments.id, deptIds)) : [],
    ]);

    const assetMap = new Map(allAssets.map(a => [a.id, a]));
    const empMap = new Map(allEmps.map(e => [e.id, e.name]));
    const deptMap = new Map(allDepts.map(d => [d.id, d.name]));

    const enriched = rows.map(r => {
      const asset = assetMap.get(r.assetId);
      return {
        ...r,
        assetTag: asset?.assetTag ?? "Unknown",
        assetName: asset?.name ?? "Unknown",
        fromEmployeeName: r.fromEmployeeId ? empMap.get(r.fromEmployeeId) ?? "Unknown" : null,
        fromDepartmentName: r.fromDepartmentId ? deptMap.get(r.fromDepartmentId) ?? "Unknown" : null,
        toEmployeeName: r.toEmployeeId ? empMap.get(r.toEmployeeId) ?? "Unknown" : null,
        toDepartmentName: r.toDepartmentId ? deptMap.get(r.toDepartmentId) ?? "Unknown" : null,
        requestedByName: r.requestedBy ? empMap.get(r.requestedBy) ?? "Unknown" : "Unknown",
        approvedByName: r.approvedBy ? empMap.get(r.approvedBy) ?? "System" : null,
      };
    });

    return NextResponse.json({ data: enriched });
  } catch (error: any) {
    console.error("GET transfers error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
