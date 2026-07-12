import { db } from "@/db";
import {
  departments,
  assetCategories,
  employees,
  auditCycles,
  assets,
  assetAllocations,
  maintenanceRequests,
  discrepancyReports,
  activityLogsDefault,
} from "@/db/schema";
import { eq, isNull, and, sql, count } from "drizzle-orm";

export async function getAdminAnalytics(organizationId: string) {
  // Parallel aggregation queries
  const [
    deptCount,
    catCount,
    empCount,
    activeAudits,
    assetCount,
    activeAllocs,
    pendingMaint,
    openDiscrep,
    assetsByStatus,
    recentActivity,
  ] = await Promise.all([
    // Total departments
    db
      .select({ count: count() })
      .from(departments)
      .where(and(eq(departments.organizationId, organizationId), isNull(departments.deletedAt)))
      .then((r) => r[0].count),

    // Total categories
    db
      .select({ count: count() })
      .from(assetCategories)
      .where(and(eq(assetCategories.organizationId, organizationId), isNull(assetCategories.deletedAt)))
      .then((r) => r[0].count),

    // Total employees
    db
      .select({ count: count() })
      .from(employees)
      .where(and(eq(employees.organizationId, organizationId), isNull(employees.deletedAt)))
      .then((r) => r[0].count),

    // Active audit cycles
    db
      .select({ count: count() })
      .from(auditCycles)
      .where(
        and(
          eq(auditCycles.organizationId, organizationId),
          isNull(auditCycles.deletedAt),
          sql`${auditCycles.status} != 'closed'`
        )
      )
      .then((r) => r[0].count),

    // Total assets
    db
      .select({ count: count() })
      .from(assets)
      .where(and(eq(assets.organizationId, organizationId), isNull(assets.deletedAt)))
      .then((r) => r[0].count),

    // Active allocations
    db
      .select({ count: count() })
      .from(assetAllocations)
      .where(and(eq(assetAllocations.status, "active"), isNull(assetAllocations.deletedAt)))
      .then((r) => r[0].count),

    // Pending maintenance
    db
      .select({ count: count() })
      .from(maintenanceRequests)
      .where(and(eq(maintenanceRequests.status, "pending"), isNull(maintenanceRequests.deletedAt)))
      .then((r) => r[0].count),

    // Open discrepancies
    db
      .select({ count: count() })
      .from(discrepancyReports)
      .where(
        and(
          eq(discrepancyReports.resolutionStatus, "open"),
          isNull(discrepancyReports.deletedAt)
        )
      )
      .then((r) => r[0].count),

    // Assets by status
    db
      .select({ status: assets.status, count: count() })
      .from(assets)
      .where(and(eq(assets.organizationId, organizationId), isNull(assets.deletedAt)))
      .groupBy(assets.status),

    // Recent activity (last 10)
    db
      .select({
        action: activityLogsDefault.action,
        entityType: activityLogsDefault.entityType,
        createdAt: activityLogsDefault.createdAt,
      })
      .from(activityLogsDefault)
      .where(eq(activityLogsDefault.organizationId, organizationId))
      .orderBy(sql`${activityLogsDefault.createdAt} DESC`)
      .limit(10),
  ]);

  return {
    totalDepartments: Number(deptCount),
    totalCategories: Number(catCount),
    totalEmployees: Number(empCount),
    activeAuditCycles: Number(activeAudits),
    totalAssets: Number(assetCount),
    activeAllocations: Number(activeAllocs),
    pendingMaintenance: Number(pendingMaint),
    openDiscrepancies: Number(openDiscrep),
    assetsByStatus,
    recentActivity,
  };
}
