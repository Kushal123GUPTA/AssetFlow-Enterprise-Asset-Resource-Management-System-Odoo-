import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { maintenanceRequests, assets } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import dayjs from "dayjs";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;

    // Get all maintenance requests for this org's assets
    const requests = await db.select({
      createdAt: maintenanceRequests.createdAt,
    }).from(maintenanceRequests)
      .leftJoin(assets, eq(assets.id, maintenanceRequests.assetId))
      .where(eq(assets.organizationId, orgId));

    // Group by Month (Last 6 months)
    const countsByMonth: Record<string, number> = {};
    
    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const monthLabel = dayjs().subtract(i, 'month').format('MMM YYYY');
      countsByMonth[monthLabel] = 0;
    }

    requests.forEach(r => {
      const monthLabel = dayjs(r.createdAt).format('MMM YYYY');
      if (countsByMonth[monthLabel] !== undefined) {
        countsByMonth[monthLabel]++;
      }
    });

    const frequencyData = Object.keys(countsByMonth).map(month => ({
      month,
      requests: countsByMonth[month]
    }));

    return NextResponse.json({ data: frequencyData });
  } catch (error: any) {
    console.error("Maintenance Frequency API Error:", error);
    return NextResponse.json({ error: "Failed to fetch maintenance frequency" }, { status: 500 });
  }
}
