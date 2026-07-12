import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { db } from "@/db";
import { activityLogsDefault, employees } from "@/db/schema";

/**
 * GET /api/activity-logs
 * Query: limit, offset, search, action, entityType
 * Admin + asset_manager can view org activity log.
 */
export async function GET(req: NextRequest) {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  const role = auth.employee.role;
  if (role !== "admin" && role !== "asset_manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 50), 1), 200);
    const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);
    const search = searchParams.get("search")?.trim() || "";
    const action = searchParams.get("action")?.trim() || "";
    const entityType = searchParams.get("entityType")?.trim() || "";

    const conditions = [eq(activityLogsDefault.organizationId, auth.employee.organizationId)];
    if (action) conditions.push(eq(activityLogsDefault.action, action));
    if (entityType) conditions.push(eq(activityLogsDefault.entityType, entityType));
    if (search) {
      conditions.push(
        or(
          ilike(activityLogsDefault.action, `%${search}%`),
          ilike(activityLogsDefault.entityType, `%${search}%`),
          ilike(employees.name, `%${search}%`),
          sql`CAST(${activityLogsDefault.details} AS text) ILIKE ${`%${search}%`}`
        )!
      );
    }

    const rows = await db
      .select({
        id: activityLogsDefault.id,
        action: activityLogsDefault.action,
        entityType: activityLogsDefault.entityType,
        entityId: activityLogsDefault.entityId,
        details: activityLogsDefault.details,
        createdAt: activityLogsDefault.createdAt,
        employeeId: activityLogsDefault.employeeId,
        employeeName: employees.name,
        employeeEmail: employees.email,
      })
      .from(activityLogsDefault)
      .leftJoin(employees, eq(activityLogsDefault.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(activityLogsDefault.createdAt))
      .limit(limit)
      .offset(offset);

    const [countRow] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(activityLogsDefault)
      .leftJoin(employees, eq(activityLogsDefault.employeeId, employees.id))
      .where(and(...conditions));

    return NextResponse.json({
      data: rows,
      meta: { total: Number(countRow?.value ?? 0), limit, offset },
    });
  } catch (error) {
    console.error("GET /api/activity-logs", error);
    return NextResponse.json({ error: "Failed to load activity logs" }, { status: 500 });
  }
}
