import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetAllocations, transferRequests } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// POST /api/assets/transfer-request — Submit a transfer request for an allocated asset
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assetId, toEmployeeId, toDepartmentId } = await req.json();

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }
    if (!toEmployeeId && !toDepartmentId) {
      return NextResponse.json({ error: "Target custodian must be selected" }, { status: 400 });
    }

    const organizationId = session.user.organizationId;

    // Verify asset and active allocation
    const activeAlloc = await db
      .select({
        id: assetAllocations.id,
        employeeId: assetAllocations.employeeId,
        departmentId: assetAllocations.departmentId,
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

    if (activeAlloc.length === 0) {
      return NextResponse.json(
        { error: "Asset has no active allocation. Allocate directly instead." },
        { status: 400 }
      );
    }

    const currentAlloc = activeAlloc[0];

    // Create transfer request record
    const insertedRequest = await db
      .insert(transferRequests)
      .values({
        assetId,
        currentAllocationId: currentAlloc.id,
        fromEmployeeId: currentAlloc.employeeId,
        fromDepartmentId: currentAlloc.departmentId,
        toEmployeeId: toEmployeeId || null,
        toDepartmentId: toDepartmentId || null,
        requestedBy: session.user.id,
        status: "requested",
      })
      .returning();

    return NextResponse.json({ data: insertedRequest[0] });
  } catch (error: any) {
    console.error("CREATE transfer request error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
