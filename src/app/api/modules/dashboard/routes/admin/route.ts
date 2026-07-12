import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetAllocations, resourceBookings, transferRequests, activityLogsDefault } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrAfter);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const now = dayjs().format("YYYY-MM-DD");

    // Fetch total assets to break down by status
    const allAssets = await db.select({
      id: assets.id,
      status: assets.status,
    }).from(assets).where(eq(assets.organizationId, orgId));

    const availableCount = allAssets.filter(a => a.status === "available").length;
    const allocatedCount = allAssets.filter(a => a.status === "allocated").length;
    const maintenanceCount = allAssets.filter(a => a.status === "under_maintenance").length;

    // Active Bookings (ongoing or upcoming)
    const allBookings = await db.select({ id: resourceBookings.id, status: resourceBookings.status })
      .from(resourceBookings)
      .leftJoin(assets, eq(assets.id, resourceBookings.assetId))
      .where(eq(assets.organizationId, orgId));
    const activeBookingsCount = allBookings.filter(b => b.status === "ongoing" || b.status === "upcoming").length;

    // Pending Transfers
    const allTransfers = await db.select({ id: transferRequests.id, status: transferRequests.status })
      .from(transferRequests)
      .leftJoin(assets, eq(assets.id, transferRequests.assetId))
      .where(eq(assets.organizationId, orgId));
    const pendingTransfersCount = allTransfers.filter(t => t.status === "requested").length;

    // Upcoming and Overdue Returns
    const allAllocations = await db.select({ 
      id: assetAllocations.id, 
      status: assetAllocations.status, 
      expectedReturnDate: assetAllocations.expectedReturnDate 
    })
      .from(assetAllocations)
      .leftJoin(assets, eq(assets.id, assetAllocations.assetId))
      .where(eq(assets.organizationId, orgId));

    const activeAllocations = allAllocations.filter(a => a.status === "active" && a.expectedReturnDate);
    const upcomingReturnsCount = activeAllocations.filter(a => dayjs(a.expectedReturnDate).isSameOrAfter(now)).length;
    const overdueReturnsCount = activeAllocations.filter(a => dayjs(a.expectedReturnDate).isBefore(now)).length;

    // Recent Activity Feed
    const recentActivity = await db.select({
      id: activityLogsDefault.id,
      action: activityLogsDefault.action,
      entityType: activityLogsDefault.entityType,
      entityId: activityLogsDefault.entityId,
      createdAt: activityLogsDefault.createdAt,
      details: activityLogsDefault.details,
    })
    .from(activityLogsDefault)
    .where(eq(activityLogsDefault.organizationId, orgId))
    .orderBy(desc(activityLogsDefault.createdAt))
    .limit(10);

    return NextResponse.json({
      data: {
        availableCount,
        allocatedCount,
        maintenanceCount,
        activeBookingsCount,
        pendingTransfersCount,
        upcomingReturnsCount,
        overdueReturnsCount,
        recentActivity,
      }
    });
  } catch (error: any) {
    console.error("Dashboard Admin API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard metrics" }, { status: 500 });
  }
}
