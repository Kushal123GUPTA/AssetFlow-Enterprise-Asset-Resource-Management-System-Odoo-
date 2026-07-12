import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, resourceBookings } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

/** GET booking heatmap: day-of-week × hour peak usage */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgId = session.user.organizationId;

    const rows = await db
      .select({
        dow: sql<number>`EXTRACT(DOW FROM ${resourceBookings.startTime})::int`,
        hour: sql<number>`EXTRACT(HOUR FROM ${resourceBookings.startTime})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(resourceBookings)
      .innerJoin(assets, eq(resourceBookings.assetId, assets.id))
      .where(
        and(
          eq(assets.organizationId, orgId),
          isNull(resourceBookings.deletedAt),
          isNull(assets.deletedAt),
          sql`${resourceBookings.status} != 'cancelled'`
        )
      )
      .groupBy(
        sql`EXTRACT(DOW FROM ${resourceBookings.startTime})`,
        sql`EXTRACT(HOUR FROM ${resourceBookings.startTime})`
      );

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const cells = rows.map((r) => ({
      day: dayNames[Number(r.dow)] ?? String(r.dow),
      dow: Number(r.dow),
      hour: Number(r.hour),
      count: Number(r.count),
    }));

    return NextResponse.json({ data: cells });
  } catch (error) {
    console.error("heatmap analytics", error);
    return NextResponse.json({ error: "Failed to load heatmap" }, { status: 500 });
  }
}
