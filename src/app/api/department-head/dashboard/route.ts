import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetAllocations, transferRequests, resourceBookings, employees } from "@/db/schema";
import { eq, and, or, isNull, count, inArray, desc } from "drizzle-orm";
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

    // 1. Get employees in the department
    const deptEmployees = await db
      .select({ id: employees.id, name: employees.name })
      .from(employees)
      .where(and(eq(employees.departmentId, departmentId), isNull(employees.deletedAt)));
    
    const employeeIds = deptEmployees.map((e) => e.id);

    // 2. Count department assets
    const [deptAssetsCount] = await db
      .select({ value: count() })
      .from(assets)
      .where(and(eq(assets.departmentId, departmentId), isNull(assets.deletedAt)));

    // 3. Count assets allocated to department or its members
    let allocatedCount = 0;
    if (employeeIds.length > 0) {
      const [res] = await db
        .select({ value: count() })
        .from(assetAllocations)
        .where(
          and(
            eq(assetAllocations.status, "active"),
            isNull(assetAllocations.deletedAt),
            or(
              eq(assetAllocations.departmentId, departmentId),
              inArray(assetAllocations.employeeId, employeeIds)
            )
          )
        );
      allocatedCount = res.value;
    } else {
      const [res] = await db
        .select({ value: count() })
        .from(assetAllocations)
        .where(
          and(
            eq(assetAllocations.status, "active"),
            isNull(assetAllocations.deletedAt),
            eq(assetAllocations.departmentId, departmentId)
          )
        );
      allocatedCount = res.value;
    }

    // 4. Count pending allocation / transfer requests
    let pendingRequestsCount = 0;
    if (employeeIds.length > 0) {
      const [res] = await db
        .select({ value: count() })
        .from(transferRequests)
        .where(
          and(
            eq(transferRequests.status, "requested"),
            isNull(transferRequests.deletedAt),
            or(
              eq(transferRequests.toDepartmentId, departmentId),
              inArray(transferRequests.toEmployeeId, employeeIds)
            )
          )
        );
      pendingRequestsCount = res.value;
    } else {
      const [res] = await db
        .select({ value: count() })
        .from(transferRequests)
        .where(
          and(
            eq(transferRequests.status, "requested"),
            isNull(transferRequests.deletedAt),
            eq(transferRequests.toDepartmentId, departmentId)
          )
        );
      pendingRequestsCount = res.value;
    }

    // 5. Count active resource bookings
    const [activeBookingsCount] = await db
      .select({ value: count() })
      .from(resourceBookings)
      .where(
        and(
          or(eq(resourceBookings.status, "upcoming"), eq(resourceBookings.status, "ongoing")),
          eq(resourceBookings.departmentId, departmentId),
          isNull(resourceBookings.deletedAt)
        )
      );

    // 6. Fetch pending request list (limit 10)
    const fromEmployee = alias(employees, "from_employee");
    const toEmployee = alias(employees, "to_employee");

    let pendingRequestsList: any[] = [];
    if (employeeIds.length > 0 || departmentId) {
      const conditions: any[] = [
        eq(transferRequests.status, "requested"),
        isNull(transferRequests.deletedAt)
      ];

      if (employeeIds.length > 0) {
        conditions.push(
          or(
            eq(transferRequests.toDepartmentId, departmentId),
            inArray(transferRequests.toEmployeeId, employeeIds)
          )
        );
      } else {
        conditions.push(eq(transferRequests.toDepartmentId, departmentId));
      }

      pendingRequestsList = await db
        .select({
          id: transferRequests.id,
          assetId: transferRequests.assetId,
          assetName: assets.name,
          assetTag: assets.assetTag,
          fromEmployeeName: fromEmployee.name,
          toEmployeeName: toEmployee.name,
          status: transferRequests.status,
          createdAt: transferRequests.createdAt,
        })
        .from(transferRequests)
        .innerJoin(assets, eq(transferRequests.assetId, assets.id))
        .leftJoin(fromEmployee, eq(transferRequests.fromEmployeeId, fromEmployee.id))
        .leftJoin(toEmployee, eq(transferRequests.toEmployeeId, toEmployee.id))
        .where(and(...conditions))
        .orderBy(desc(transferRequests.createdAt))
        .limit(10);
    }

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          deptAssets: deptAssetsCount.value,
          allocatedMembers: allocatedCount,
          pendingRequests: pendingRequestsCount,
          activeBookings: activeBookingsCount,
        },
        pendingRequests: pendingRequestsList.map(req => ({
          ...req,
          type: req.fromEmployeeName ? "Transfer" : "Allocation"
        })),
      }
    });

  } catch (error: any) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
