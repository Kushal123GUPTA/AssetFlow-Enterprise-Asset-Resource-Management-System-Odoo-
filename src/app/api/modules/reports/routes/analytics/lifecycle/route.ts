import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, maintenanceRequests } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

/**
 * GET assets due for maintenance / nearing retirement heuristics:
 * - dueMaintenance: under_maintenance OR open maint request OR no resolved maint in 180d and age > 1y
 * - nearingRetirement: acquisitionDate older than 4 years and not already retired/disposed
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgId = session.user.organizationId;

    const allAssets = await db
      .select({
        id: assets.id,
        assetTag: assets.assetTag,
        name: assets.name,
        status: assets.status,
        condition: assets.condition,
        acquisitionDate: assets.acquisitionDate,
        location: assets.location,
      })
      .from(assets)
      .where(and(eq(assets.organizationId, orgId), isNull(assets.deletedAt)));

    const openMaint = await db
      .select({ assetId: maintenanceRequests.assetId })
      .from(maintenanceRequests)
      .innerJoin(assets, eq(maintenanceRequests.assetId, assets.id))
      .where(
        and(
          eq(assets.organizationId, orgId),
          isNull(maintenanceRequests.deletedAt),
          sql`${maintenanceRequests.status} NOT IN ('resolved', 'rejected')`
        )
      );
    const openMaintSet = new Set(openMaint.map((m) => m.assetId));

    const fourYearsAgo = new Date();
    fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);
    const fourYearsAgoStr = fourYearsAgo.toISOString().slice(0, 10);

    const dueMaintenance = allAssets
      .filter(
        (a) =>
          a.status === "under_maintenance" ||
          openMaintSet.has(a.id) ||
          a.condition === "poor"
      )
      .slice(0, 50)
      .map((a) => ({
        ...a,
        reason: a.status === "under_maintenance"
          ? "Under maintenance"
          : openMaintSet.has(a.id)
            ? "Open maintenance request"
            : "Poor condition",
      }));

    const nearingRetirement = allAssets
      .filter(
        (a) =>
          a.acquisitionDate &&
          a.acquisitionDate <= fourYearsAgoStr &&
          !["retired", "disposed"].includes(a.status)
      )
      .slice(0, 50)
      .map((a) => ({
        ...a,
        reason: `Acquired ${a.acquisitionDate} (≥ 4 years)`,
      }));

    return NextResponse.json({
      data: { dueMaintenance, nearingRetirement },
    });
  } catch (error) {
    console.error("lifecycle analytics", error);
    return NextResponse.json({ error: "Failed to load lifecycle lists" }, { status: 500 });
  }
}
