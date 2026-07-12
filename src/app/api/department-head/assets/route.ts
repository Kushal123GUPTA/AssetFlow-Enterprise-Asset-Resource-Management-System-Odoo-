import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetAllocations, employees } from "@/db/schema";
import { eq, and, or, isNull, inArray } from "drizzle-orm";

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

    // 1. Get employees in this department
    const deptEmployees = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.departmentId, departmentId), isNull(employees.deletedAt)));
    
    const employeeIds = deptEmployees.map((e) => e.id);

    // 2. Build allocation subquery
    let allocationConditions: any = eq(assetAllocations.departmentId, departmentId);
    if (employeeIds.length > 0) {
      allocationConditions = or(
        eq(assetAllocations.departmentId, departmentId),
        inArray(assetAllocations.employeeId, employeeIds)
      );
    }

    const subqueryAllocatedAssetIds = db
      .select({ assetId: assetAllocations.assetId })
      .from(assetAllocations)
      .where(
        and(
          eq(assetAllocations.status, "active"),
          isNull(assetAllocations.deletedAt),
          allocationConditions
        )
      );

    // 3. Select assets that belong to the department or are allocated to the department / employees
    const result = await db
      .select({
        id: assets.id,
        name: assets.name,
        assetTag: assets.assetTag,
        serialNumber: assets.serialNumber,
        condition: assets.condition,
        location: assets.location,
        status: assets.status,
        isBookable: assets.isBookable,
        allocationId: assetAllocations.id,
        allocatedEmployeeName: employees.name,
        allocatedDepartmentId: assetAllocations.departmentId,
        expectedReturnDate: assetAllocations.expectedReturnDate,
      })
      .from(assets)
      .leftJoin(
        assetAllocations,
        and(
          eq(assets.id, assetAllocations.assetId),
          eq(assetAllocations.status, "active"),
          isNull(assetAllocations.deletedAt)
        )
      )
      .leftJoin(employees, eq(assetAllocations.employeeId, employees.id))
      .where(
        and(
          isNull(assets.deletedAt),
          or(
            eq(assets.departmentId, departmentId),
            inArray(assets.id, subqueryAllocatedAssetIds)
          )
        )
      );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Fetch department assets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
