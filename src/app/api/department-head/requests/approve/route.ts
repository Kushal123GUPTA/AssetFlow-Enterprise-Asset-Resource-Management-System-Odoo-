import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetAllocations, transferRequests, assetStatusHistory, activityLogsDefault } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "department_head") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    const departmentId = session.user.departmentId;
    if (!departmentId) {
      return NextResponse.json({ error: "User is not assigned to a department" }, { status: 400 });
    }

    // 1. Fetch the request
    const requestRecord = await db
      .select()
      .from(transferRequests)
      .where(and(eq(transferRequests.id, requestId), eq(transferRequests.status, "requested")))
      .limit(1);

    const request = requestRecord[0];
    if (!request) {
      return NextResponse.json({ error: "Pending request not found" }, { status: 404 });
    }

    // 2. Validate department authority:
    // Department Head can approve if the request belongs to their department
    if (
      request.toDepartmentId !== departmentId &&
      request.fromDepartmentId !== departmentId
    ) {
      return NextResponse.json({ error: "You cannot approve requests outside your department" }, { status: 403 });
    }

    // Fetch current asset status
    const assetRecord = await db
      .select()
      .from(assets)
      .where(eq(assets.id, request.assetId))
      .limit(1);
    const asset = assetRecord[0];
    if (!asset) {
      return NextResponse.json({ error: "Associated asset not found" }, { status: 404 });
    }

    // 3. Execute database updates in a transaction
    await db.transaction(async (tx) => {
      // a. Mark old allocation as returned if exists
      if (request.currentAllocationId) {
        await tx
          .update(assetAllocations)
          .set({
            status: "returned",
            actualReturnDate: new Date().toISOString(),
            returnedApprovedBy: session.user.id,
            updatedBy: session.user.id,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(assetAllocations.id, request.currentAllocationId));
      }

      // b. Create new active allocation
      const newAlloc = await tx
        .insert(assetAllocations)
        .values({
          assetId: request.assetId,
          employeeId: request.toEmployeeId,
          departmentId: request.toDepartmentId || departmentId,
          allocatedBy: session.user.id,
          status: "active",
          createdBy: session.user.id,
          updatedBy: session.user.id,
        })
        .returning({ id: assetAllocations.id });

      const newAllocationId = newAlloc[0].id;

      // c. Update transfer request with 'approved' status and reference the new allocation
      await tx
        .update(transferRequests)
        .set({
          status: "approved",
          approvedBy: session.user.id,
          approvedAt: new Date().toISOString(),
          resultingAllocationId: newAllocationId,
          updatedBy: session.user.id,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(transferRequests.id, requestId));

      // d. Update asset status to 'allocated' and update location/department
      await tx
        .update(assets)
        .set({
          status: "allocated",
          departmentId: request.toDepartmentId || departmentId,
          updatedBy: session.user.id,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(assets.id, request.assetId));

      // e. Log status history change
      await tx.insert(assetStatusHistory).values({
        assetId: request.assetId,
        fromStatus: asset.status,
        toStatus: "allocated",
        changedBy: session.user.id,
        reason: "Transfer approved by Department Head",
      });

      // f. Log activity log
      await tx.insert(activityLogsDefault).values({
        organizationId: session.user.organizationId,
        employeeId: session.user.id,
        action: "asset.transfer_approved",
        entityType: "transfer_request",
        entityId: requestId,
        details: {
          requestId,
          assetId: request.assetId,
          newAllocationId,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Request approved successfully" });
  } catch (error: any) {
    console.error("Approve request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
