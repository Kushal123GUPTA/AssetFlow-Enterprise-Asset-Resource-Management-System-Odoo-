import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, resourceBookings, assetAllocations } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import dayjs from "dayjs";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;

    // Get all assets
    const allAssets = await db.select({
      id: assets.id,
      name: assets.name,
      assetTag: assets.assetTag,
      status: assets.status,
      updatedAt: assets.updatedAt
    }).from(assets)
      .where(eq(assets.organizationId, orgId));

    // For most used, we'll count bookings + allocations per asset
    const bookings = await db.select({ assetId: resourceBookings.assetId })
      .from(resourceBookings);
      
    const allocations = await db.select({ assetId: assetAllocations.assetId })
      .from(assetAllocations);

    const usageCount: Record<string, number> = {};
    bookings.forEach(b => { usageCount[b.assetId] = (usageCount[b.assetId] || 0) + 1; });
    allocations.forEach(a => { usageCount[a.assetId] = (usageCount[a.assetId] || 0) + 1; });

    // Most used assets
    const mostUsed = [...allAssets]
      .filter(a => usageCount[a.id] > 0)
      .map(a => ({
        id: a.id,
        name: a.name,
        tag: a.assetTag,
        usage: usageCount[a.id]
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5); // top 5

    // Idle assets (Status available and not updated in 60 days)
    const sixtyDaysAgo = dayjs().subtract(60, 'day');
    const idleAssets = allAssets
      .filter(a => a.status === 'available' && dayjs(a.updatedAt).isBefore(sixtyDaysAgo))
      .map(a => ({
        id: a.id,
        name: a.name,
        tag: a.assetTag,
        daysIdle: dayjs().diff(dayjs(a.updatedAt), 'day')
      }))
      .sort((a, b) => b.daysIdle - a.daysIdle)
      .slice(0, 5);

    return NextResponse.json({ 
      data: {
        mostUsed,
        idleAssets
      } 
    });
  } catch (error: any) {
    console.error("Analytics Assets API Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics assets" }, { status: 500 });
  }
}
