import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { transferRequests, activityLogsDefault } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "department_head") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, reason } = await req.json();
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

    // 2. Validate department authority
    if (
      request.toDepartmentId !== departmentId &&
      request.fromDepartmentId !== departmentId
    ) {
      return NextResponse.json({ error: "You cannot reject requests outside your department" }, { status: 403 });
    }

    // 3. Update DB
    await db.transaction(async (tx) => {
      await tx
        .update(transferRequests)
        .set({
          status: "rejected",
          updatedBy: session.user.id,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(transferRequests.id, requestId));

      await tx.insert(activityLogsDefault).values({
        organizationId: session.user.organizationId,
        employeeId: session.user.id,
        action: "asset.transfer_rejected",
        entityType: "transfer_request",
        entityId: requestId,
        details: {
          requestId,
          reason: reason || "No reason provided",
        },
      });
    });

    return NextResponse.json({ success: true, message: "Request rejected successfully" });
  } catch (error: any) {
    console.error("Reject request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
