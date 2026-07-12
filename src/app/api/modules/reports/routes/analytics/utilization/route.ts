import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { departments, assetAllocations } from "@/db/schema";
import { eq, count, isNull, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;

    // Get all departments in org
    const depts = await db.select({
      id: departments.id,
      name: departments.name
    }).from(departments)
      .where(and(eq(departments.organizationId, orgId), isNull(departments.deletedAt)));

    // Get all active allocations
    const activeAllocations = await db.select({
      departmentId: assetAllocations.departmentId,
    }).from(assetAllocations)
      .where(eq(assetAllocations.status, "active"));

    // Aggregate Utilization by department
    // In a real app we'd compare this to total assignable assets, but for a mockup bar chart,
    // we'll just count how many assets are allocated to each dept and generate a percentage relative to the max.
    const countsByDept: Record<string, number> = {};
    activeAllocations.forEach(alloc => {
      if (alloc.departmentId) {
        countsByDept[alloc.departmentId] = (countsByDept[alloc.departmentId] || 0) + 1;
      }
    });

    const maxCount = Math.max(...Object.values(countsByDept), 10); // avoid div by 0

    const utilizationData = depts.map(d => {
      const allocated = countsByDept[d.id] || 0;
      const percentage = Math.round((allocated / maxCount) * 100);
      return {
        department: d.name,
        percentage,
        allocatedCount: allocated
      };
    }).sort((a, b) => b.percentage - a.percentage);

    return NextResponse.json({ data: utilizationData });
  } catch (error: any) {
    console.error("Utilization API Error:", error);
    return NextResponse.json({ error: "Failed to fetch utilization data" }, { status: 500 });
  }
}
