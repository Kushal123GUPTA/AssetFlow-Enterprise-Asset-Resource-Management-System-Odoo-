import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, transferRequests } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// POST /api/assets/transfer-reject — Reject a transfer request
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

    // Reject transfer request
    await db
      .update(transferRequests)
      .set({
        status: "rejected",
        updatedBy: session.user.id,
      })
      .where(eq(transferRequests.id, transferId));

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    console.error("REJECT transfer request error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
