import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetAllocations, transferRequests, maintenanceRequests, employees } from "@/db/schema";
import { eq, and, isNull, count, sql, desc, inArray } from "drizzle-orm";

// POST /api/assets/dashboard-stats — Fetch real stats and listings for the dashboard
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const nowStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // 1. Fetch counts
    // Total assets
    const [totalAssetsRes] = await db
      .select({ val: count() })
      .from(assets)
      .where(and(eq(assets.organizationId, organizationId), isNull(assets.deletedAt)));

    // Active allocations
    const [activeAllocationsRes] = await db
      .select({ val: count() })
      .from(assetAllocations)
      .innerJoin(assets, eq(assetAllocations.assetId, assets.id))
      .where(
        and(
          eq(assets.organizationId, organizationId),
          eq(assetAllocations.status, "active"),
          isNull(assetAllocations.deletedAt)
        )
      );

    // Overdue allocations
    const [overdueAllocationsRes] = await db
      .select({ val: count() })
      .from(assetAllocations)
      .innerJoin(assets, eq(assetAllocations.assetId, assets.id))
      .where(
        and(
          eq(assets.organizationId, organizationId),
          eq(assetAllocations.status, "active"),
          sql`${assetAllocations.expectedReturnDate} < ${nowStr}`,
          isNull(assetAllocations.deletedAt)
        )
      );

    // Pending Transfers
    const [pendingTransfersRes] = await db
      .select({ val: count() })
      .from(transferRequests)
      .innerJoin(assets, eq(transferRequests.assetId, assets.id))
      .where(
        and(
          eq(assets.organizationId, organizationId),
          eq(transferRequests.status, "requested"),
          isNull(transferRequests.deletedAt)
        )
      );

    // Maintenance Requests (pending/open)
    const [maintenanceRequestsRes] = await db
      .select({ val: count() })
      .from(maintenanceRequests)
      .innerJoin(assets, eq(maintenanceRequests.assetId, assets.id))
      .where(
        and(
          eq(assets.organizationId, organizationId),
          eq(maintenanceRequests.status, "pending"),
          isNull(maintenanceRequests.deletedAt)
        )
      );

    // 2. Fetch recent maintenance requests (limit 3)
    const recentMaintenance = await db
      .select({
        id: maintenanceRequests.id,
        issueDescription: maintenanceRequests.issueDescription,
        priority: maintenanceRequests.priority,
        status: maintenanceRequests.status,
        assetName: assets.name,
        assetTag: assets.assetTag,
      })
      .from(maintenanceRequests)
      .innerJoin(assets, eq(maintenanceRequests.assetId, assets.id))
      .where(and(eq(assets.organizationId, organizationId), isNull(maintenanceRequests.deletedAt)))
      .orderBy(desc(maintenanceRequests.createdAt))
      .limit(3);

    // 3. Fetch recent transfer requests (limit 3)
    const recentTransfers = await db
      .select({
        id: transferRequests.id,
        status: transferRequests.status,
        assetName: assets.name,
        assetTag: assets.assetTag,
        toEmployeeId: transferRequests.toEmployeeId,
        toDepartmentId: transferRequests.toDepartmentId,
      })
      .from(transferRequests)
      .innerJoin(assets, eq(transferRequests.assetId, assets.id))
      .where(
        and(
          eq(assets.organizationId, organizationId),
          eq(transferRequests.status, "requested"),
          isNull(transferRequests.deletedAt)
        )
      )
      .orderBy(desc(transferRequests.createdAt))
      .limit(3);

    // Enriched transfers list
    let enrichedTransfers: Array<{ id: string; asset: string; from: string; type: "Transfer" }> = [];
    if (recentTransfers.length > 0) {
      const targetEmpIds = recentTransfers.map((t) => t.toEmployeeId).filter(Boolean) as string[];
      const emps = targetEmpIds.length > 0 ? await db.select({ id: employees.id, name: employees.name }).from(employees).where(inArray(employees.id, targetEmpIds)) : [];
      const empMap = new Map(emps.map((e) => [e.id, e.name]));

      enrichedTransfers = recentTransfers.map((t) => {
        const dest = t.toEmployeeId ? `To Employee: ${empMap.get(t.toEmployeeId) ?? "Unknown"}` : "To Department";
        return {
          id: t.id,
          asset: `${t.assetName} (${t.assetTag})`,
          from: dest,
          type: "Transfer" as const,
        };
      });
    }

    return NextResponse.json({
      data: {
        totalAssets: totalAssetsRes?.val ?? 0,
        activeAllocations: activeAllocationsRes?.val ?? 0,
        overdueAllocations: overdueAllocationsRes?.val ?? 0,
        pendingTransfers: pendingTransfersRes?.val ?? 0,
        maintenanceRequests: maintenanceRequestsRes?.val ?? 0,
        recentMaintenance,
        recentTransfers: enrichedTransfers,
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
