import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, maintenanceRequests, employees } from "@/db/schema";
import { eq, and, isNull, inArray, desc } from "drizzle-orm";

// POST /api/assets/maintenance/list — Fetch maintenance requests for the organization
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status, priority } = body;
    const organizationId = session.user.organizationId;

    const conditions = [
      eq(assets.organizationId, organizationId),
      isNull(maintenanceRequests.deletedAt),
    ];

    if (status) {
      conditions.push(eq(maintenanceRequests.status, status));
    }
    if (priority) {
      conditions.push(eq(maintenanceRequests.priority, priority));
    }

    // Query maintenance requests inner joined on assets to guarantee organizational boundary
    const rows = await db
      .select({
        id: maintenanceRequests.id,
        assetId: maintenanceRequests.assetId,
        raisedBy: maintenanceRequests.raisedBy,
        issueDescription: maintenanceRequests.issueDescription,
        priority: maintenanceRequests.priority,
        photoUrl: maintenanceRequests.photoUrl,
        status: maintenanceRequests.status,
        approvedBy: maintenanceRequests.approvedBy,
        approvedAt: maintenanceRequests.approvedAt,
        rejectionReason: maintenanceRequests.rejectionReason,
        technicianName: maintenanceRequests.technicianName,
        technicianAssignedAt: maintenanceRequests.technicianAssignedAt,
        resolvedAt: maintenanceRequests.resolvedAt,
        resolutionNotes: maintenanceRequests.resolutionNotes,
        createdAt: maintenanceRequests.createdAt,
      })
      .from(maintenanceRequests)
      .innerJoin(assets, eq(maintenanceRequests.assetId, assets.id))
      .where(and(...conditions))
      .orderBy(desc(maintenanceRequests.createdAt));

    if (rows.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Batch resolve related assets and employees names
    const assetIds = [...new Set(rows.map(r => r.assetId))];
    const empIds = [
      ...rows.map(r => r.raisedBy).filter(Boolean),
      ...rows.map(r => r.approvedBy).filter(Boolean),
    ] as string[];

    const [allAssets, allEmps] = await Promise.all([
      db.select({ id: assets.id, name: assets.name, assetTag: assets.assetTag }).from(assets).where(inArray(assets.id, assetIds)),
      empIds.length > 0 ? db.select({ id: employees.id, name: employees.name }).from(employees).where(inArray(employees.id, empIds)) : [],
    ]);

    const assetMap = new Map(allAssets.map(a => [a.id, a]));
    const empMap = new Map(allEmps.map(e => [e.id, e.name]));

    const enriched = rows.map(r => {
      const asset = assetMap.get(r.assetId);
      return {
        ...r,
        assetTag: asset?.assetTag ?? "Unknown",
        assetName: asset?.name ?? "Unknown",
        raisedByName: empMap.get(r.raisedBy) ?? "Unknown",
        approvedByName: r.approvedBy ? empMap.get(r.approvedBy) ?? "System" : null,
      };
    });

    return NextResponse.json({ data: enriched });
  } catch (error: any) {
    console.error("GET maintenance list error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
