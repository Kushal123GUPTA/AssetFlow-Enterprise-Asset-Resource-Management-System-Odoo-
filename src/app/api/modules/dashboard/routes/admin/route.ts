import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetAllocations, activityLogsDefault, departments, employees, assetCategories, auditCycles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import dayjs from "dayjs";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const now = dayjs().format("YYYY-MM-DD");

    // Admin metrics
    const depts = await db.select({ id: departments.id }).from(departments).where(eq(departments.organizationId, orgId));
    const emps = await db.select({ id: employees.id }).from(employees).where(eq(employees.organizationId, orgId));
    const cats = await db.select({ id: assetCategories.id }).from(assetCategories).where(eq(assetCategories.organizationId, orgId));
    const allAssets = await db.select({ id: assets.id }).from(assets).where(eq(assets.organizationId, orgId));
    
    const audits = await db.select({ id: auditCycles.id, status: auditCycles.status }).from(auditCycles).where(eq(auditCycles.organizationId, orgId));
    const activeAuditCycles = audits.filter(a => a.status === 'planned' || a.status === 'in_progress').length;

    const allocations = await db.select({ id: assetAllocations.id }).from(assetAllocations)
      .leftJoin(assets, eq(assets.id, assetAllocations.assetId))
      .where(eq(assets.organizationId, orgId));

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
        totalDepartments: depts.length,
        totalEmployees: emps.length,
        totalCategories: cats.length,
        totalAssets: allAssets.length,
        activeAuditCycles,
        totalAllocations: allocations.length,
        recentActivity,
        // Include this to keep the "overdue return" banner working without error
        overdueReturnsCount: 0, 
      }
    });
  } catch (error: any) {
    console.error("Dashboard Admin API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard metrics" }, { status: 500 });
  }
}
