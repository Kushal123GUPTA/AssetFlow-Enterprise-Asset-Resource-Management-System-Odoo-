import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetAllocations, transferRequests, maintenanceRequests, employees, resourceBookings } from "@/db/schema";
import { eq, and, isNull, count, sql, desc, inArray, or } from "drizzle-orm";

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

    // Available assets
    const [availableCountRes] = await db
      .select({ val: count() })
      .from(assets)
      .where(
        and(
          eq(assets.organizationId, organizationId),
          eq(assets.status, "available"),
          isNull(assets.deletedAt)
        )
      );

    // Allocated assets
    const [allocatedCountRes] = await db
      .select({ val: count() })
      .from(assets)
      .where(
        and(
          eq(assets.organizationId, organizationId),
          eq(assets.status, "allocated"),
          isNull(assets.deletedAt)
        )
      );

    // Under maintenance assets (used as maintenanceTodayCount)
    const [maintenanceTodayRes] = await db
      .select({ val: count() })
      .from(assets)
      .where(
        and(
          eq(assets.organizationId, organizationId),
          eq(assets.status, "under_maintenance"),
          isNull(assets.deletedAt)
        )
      );

    // Active bookings (upcoming or ongoing)
    const [activeBookingsRes] = await db
      .select({ val: count() })
      .from(resourceBookings)
      .innerJoin(assets, eq(resourceBookings.assetId, assets.id))
      .where(
        and(
          eq(assets.organizationId, organizationId),
          or(
            eq(resourceBookings.status, "upcoming"),
            eq(resourceBookings.status, "ongoing")
          ),
          isNull(resourceBookings.deletedAt)
        )
      );

    // Upcoming returns (active allocations with expectedReturnDate >= today)
    const [upcomingReturnsRes] = await db
      .select({ val: count() })
      .from(assetAllocations)
      .innerJoin(assets, eq(assetAllocations.assetId, assets.id))
      .where(
        and(
          eq(assets.organizationId, organizationId),
          eq(assetAllocations.status, "active"),
          sql`${assetAllocations.expectedReturnDate} >= ${nowStr}`,
          isNull(assetAllocations.deletedAt)
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

    const overdueAllocations = overdueAllocationsRes?.val ?? 0;

    return NextResponse.json({
      data: {
        totalAssets: totalAssetsRes?.val ?? 0,
        activeAllocations: activeAllocationsRes?.val ?? 0,
        overdueAllocations,
        pendingTransfers: pendingTransfersRes?.val ?? 0,
        maintenanceRequests: maintenanceRequestsRes?.val ?? 0,
        availableCount: availableCountRes?.val ?? 0,
        allocatedCount: allocatedCountRes?.val ?? 0,
        maintenanceTodayCount: maintenanceTodayRes?.val ?? 0,
        activeBookingsCount: activeBookingsRes?.val ?? 0,
        upcomingReturnsCount: upcomingReturnsRes?.val ?? 0,
        overdueReturnsCount: overdueAllocations,
        recentMaintenance,
        recentTransfers: enrichedTransfers,
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
