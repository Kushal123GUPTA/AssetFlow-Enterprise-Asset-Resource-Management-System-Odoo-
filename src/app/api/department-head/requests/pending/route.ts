import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, transferRequests, employees } from "@/db/schema";
import { eq, and, or, isNull, inArray, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "department_head") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const departmentId = session.user.departmentId;
    if (!departmentId) {
      return NextResponse.json({ error: "User is not assigned to a department" }, { status: 400 });
    }

    const deptEmployees = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.departmentId, departmentId), isNull(employees.deletedAt)));
    
    const employeeIds = deptEmployees.map((e) => e.id);

    const fromEmployee = alias(employees, "from_employee");
    const toEmployee = alias(employees, "to_employee");

    const conditions: any[] = [
      eq(transferRequests.status, "requested"),
      isNull(transferRequests.deletedAt)
    ];

    if (employeeIds.length > 0) {
      conditions.push(
        or(
          eq(transferRequests.toDepartmentId, departmentId),
          eq(transferRequests.fromDepartmentId, departmentId),
          inArray(transferRequests.toEmployeeId, employeeIds),
          inArray(transferRequests.fromEmployeeId, employeeIds)
        )
      );
    } else {
      conditions.push(
        or(
          eq(transferRequests.toDepartmentId, departmentId),
          eq(transferRequests.fromDepartmentId, departmentId)
        )
      );
    }

    const result = await db
      .select({
        id: transferRequests.id,
        assetId: transferRequests.assetId,
        assetName: assets.name,
        assetTag: assets.assetTag,
        fromEmployeeId: transferRequests.fromEmployeeId,
        fromEmployeeName: fromEmployee.name,
        fromDepartmentId: transferRequests.fromDepartmentId,
        toEmployeeId: transferRequests.toEmployeeId,
        toEmployeeName: toEmployee.name,
        toDepartmentId: transferRequests.toDepartmentId,
        requestedById: transferRequests.requestedBy,
        status: transferRequests.status,
        createdAt: transferRequests.createdAt,
      })
      .from(transferRequests)
      .innerJoin(assets, eq(transferRequests.assetId, assets.id))
      .leftJoin(fromEmployee, eq(transferRequests.fromEmployeeId, fromEmployee.id))
      .leftJoin(toEmployee, eq(transferRequests.toEmployeeId, toEmployee.id))
      .where(and(...conditions))
      .orderBy(desc(transferRequests.createdAt));

    return NextResponse.json({
      success: true,
      data: result.map(req => ({
        ...req,
        type: req.fromEmployeeName ? "Transfer" : "Allocation"
      }))
    });
  } catch (error: any) {
    console.error("Fetch pending requests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
