import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { auditItems, auditCycles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/assets/audit/verify-item — Verify/flag an asset during active audit cycle
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { auditItemId, status, notes } = await req.json();

    if (!auditItemId || !status) {
      return NextResponse.json({ error: "Audit Item ID and status are required" }, { status: 400 });
    }

    // Verify target audit item belongs to an active cycle
    const itemRecord = await db
      .select({ id: auditItems.id, auditCycleId: auditItems.auditCycleId })
      .from(auditItems)
      .where(eq(auditItems.id, auditItemId))
      .limit(1);

    if (itemRecord.length === 0) {
      return NextResponse.json({ error: "Audit item not found" }, { status: 404 });
    }

    const cycle = await db
      .select({ status: auditCycles.status })
      .from(auditCycles)
      .where(eq(auditCycles.id, itemRecord[0].auditCycleId))
      .limit(1);

    if (cycle[0]?.status === "closed") {
      return NextResponse.json({ error: "Audit campaign is closed and locked" }, { status: 400 });
    }

    // Update item verification
    const updated = await db
      .update(auditItems)
      .set({
        status,
        notes: notes || null,
        verifiedBy: session.user.id,
        verifiedAt: new Date().toISOString(),
        updatedBy: session.user.id,
      })
      .where(eq(auditItems.id, auditItemId))
      .returning();

    return NextResponse.json({ data: updated[0] });
  } catch (error: any) {
    console.error("VERIFY audit item error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
