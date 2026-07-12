import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetAllocations, employees, departments } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// POST /api/assets/custody-status — Fetch active custodian details for an asset
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assetId } = await req.json();
    if (!assetId) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    const organizationId = session.user.organizationId;

    // Fetch active allocation
    const allocRecord = await db
      .select({
        id: assetAllocations.id,
        employeeId: assetAllocations.employeeId,
        departmentId: assetAllocations.departmentId,
        allocatedAt: assetAllocations.allocatedAt,
        expectedReturnDate: assetAllocations.expectedReturnDate,
        status: assetAllocations.status,
      })
      .from(assetAllocations)
      .innerJoin(assets, eq(assetAllocations.assetId, assets.id))
      .where(
        and(
          eq(assetAllocations.assetId, assetId),
          eq(assets.organizationId, organizationId),
          eq(assetAllocations.status, "active"),
          isNull(assetAllocations.deletedAt)
        )
      )
      .limit(1);

    if (allocRecord.length === 0) {
      return NextResponse.json({ data: null });
    }

    const alloc = allocRecord[0];
    let employeeName = null;
    let departmentName = null;

    if (alloc.employeeId) {
      const emp = await db
        .select({ name: employees.name })
        .from(employees)
        .where(eq(employees.id, alloc.employeeId))
        .limit(1);
      employeeName = emp[0]?.name ?? "Unknown";
    }

    if (alloc.departmentId) {
      const dept = await db
        .select({ name: departments.name })
        .from(departments)
        .where(eq(departments.id, alloc.departmentId))
        .limit(1);
      departmentName = dept[0]?.name ?? "Unknown";
    }

    return NextResponse.json({
      data: {
        ...alloc,
        employeeName,
        departmentName,
      },
    });
  } catch (error: any) {
    console.error("CUSTODY STATUS error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
