import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { auditCycles, auditItems, departments } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

// POST /api/assets/audit/list — Fetch all audit campaigns with status/completion metrics
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Fetch audit cycles joined with department to resolve scope names
    const cycles = await db
      .select({
        id: auditCycles.id,
        name: auditCycles.name,
        scopeDepartmentId: auditCycles.scopeDepartmentId,
        scopeLocation: auditCycles.scopeLocation,
        startDate: auditCycles.startDate,
        endDate: auditCycles.endDate,
        status: auditCycles.status,
        createdAt: auditCycles.createdAt,
        departmentName: departments.name,
      })
      .from(auditCycles)
      .leftJoin(departments, eq(auditCycles.scopeDepartmentId, departments.id))
      .where(and(eq(auditCycles.organizationId, organizationId), isNull(auditCycles.deletedAt)))
      .orderBy(desc(auditCycles.createdAt));

    if (cycles.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Resolve metrics (totals, verified, missing, damaged counts) for each cycle
    const enriched = await Promise.all(
      cycles.map(async (c) => {
        const items = await db
          .select({ status: auditItems.status })
          .from(auditItems)
          .where(and(eq(auditItems.auditCycleId, c.id), isNull(auditItems.deletedAt)));

        const total = items.length;
        const verified = items.filter((i) => i.status === "verified").length;
        const missing = items.filter((i) => i.status === "missing").length;
        const damaged = items.filter((i) => i.status === "damaged").length;
        const pending = items.filter((i) => i.status === "pending").length;

        return {
          ...c,
          metrics: {
            total,
            verified,
            missing,
            damaged,
            pending,
            completionRate: total > 0 ? Math.round(((total - pending) / total) * 100) : 0,
          },
        };
      })
    );

    return NextResponse.json({ data: enriched });
  } catch (error: any) {
    console.error("LIST audit cycles error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
