import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetAllocations, transferRequests, assetStatusHistory } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { notifyEmployee, notifyEmployees } from "@/lib/notifications";

// POST /api/assets/transfer-approve — Approve and process a transfer request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transferId } = await req.json();
    if (!transferId) {
      return NextResponse.json({ error: "Transfer ID is required" }, { status: 400 });
    }

    const organizationId = session.user.organizationId;

    // Fetch transfer request
    const requestRecord = await db
      .select({
        id: transferRequests.id,
        assetId: transferRequests.assetId,
        currentAllocationId: transferRequests.currentAllocationId,
        fromEmployeeId: transferRequests.fromEmployeeId,
        fromDepartmentId: transferRequests.fromDepartmentId,
        toEmployeeId: transferRequests.toEmployeeId,
        toDepartmentId: transferRequests.toDepartmentId,
        status: transferRequests.status,
      })
      .from(transferRequests)
      .innerJoin(assets, eq(transferRequests.assetId, assets.id))
      .where(
        and(
          eq(transferRequests.id, transferId),
          eq(assets.organizationId, organizationId),
          isNull(transferRequests.deletedAt)
        )
      )
      .limit(1);

    if (requestRecord.length === 0) {
      return NextResponse.json({ error: "Transfer request not found" }, { status: 404 });
    }

    const transfer = requestRecord[0];
    if (transfer.status !== "requested") {
      return NextResponse.json({ error: `Transfer request is already ${transfer.status}` }, { status: 400 });
    }

    const timestampNow = new Date().toISOString();

    // 1. Close current allocation if active
    if (transfer.currentAllocationId) {
      await db
        .update(assetAllocations)
        .set({
          status: "returned",
          actualReturnDate: timestampNow,
          returnConditionNotes: "Transferred to another custodian",
        })
        .where(eq(assetAllocations.id, transfer.currentAllocationId));
    }

    // 2. Create new allocation
    const newAlloc = await db
      .insert(assetAllocations)
      .values({
        assetId: transfer.assetId,
        employeeId: transfer.toEmployeeId,
        departmentId: transfer.toDepartmentId,
        allocatedBy: session.user.id,
        status: "active",
      })
      .returning();
    // Wait, let's verify again if organizationId was in assetAllocations. It was not! So we must NOT include organizationId here. Let's remove it.

    const newAllocId = newAlloc[0].id;

    // 3. Approve transfer request
    await db
      .update(transferRequests)
      .set({
        status: "approved",
        approvedBy: session.user.id,
        approvedAt: timestampNow,
        resultingAllocationId: newAllocId,
      })
      .where(eq(transferRequests.id, transferId));

    // 4. Update asset custodian/updatedBy
    await db
      .update(assets)
      .set({
        status: "allocated",
        departmentId: transfer.toDepartmentId || null,
        updatedBy: session.user.id,
      })
      .where(eq(assets.id, transfer.assetId));

    // 5. Log asset status history
    await db.insert(assetStatusHistory).values({
      assetId: transfer.assetId,
      fromStatus: "allocated",
      toStatus: "allocated",
      changedBy: session.user.id,
      reason: `Custodian transfer approved. Request #${transferId}`,
    });

    const [assetMeta] = await db
      .select({ name: assets.name, assetTag: assets.assetTag })
      .from(assets)
      .where(eq(assets.id, transfer.assetId))
      .limit(1);

    const recipients = [transfer.fromEmployeeId, transfer.toEmployeeId].filter(
      (id): id is string => Boolean(id)
    );
    await notifyEmployees(recipients, {
      type: "transfer_approved",
      message: `Transfer approved for ${assetMeta?.assetTag ?? "asset"} — ${assetMeta?.name ?? "item"}.`,
      relatedEntityType: "transfer_request",
      relatedEntityId: transferId,
    });

    return NextResponse.json({ data: { success: true, allocationId: newAllocId } });
  } catch (error: any) {
    console.error("APPROVE transfer request error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
