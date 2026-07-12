import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { maintenanceRequests } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/assets/maintenance/approve — Approve a pending maintenance ticket
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const updated = await db
      .update(maintenanceRequests)
      .set({
        status: "approved",
        approvedBy: session.user.id,
        approvedAt: new Date().toISOString(),
        updatedBy: session.user.id,
      })
      .where(eq(maintenanceRequests.id, requestId))
      .returning();

    return NextResponse.json({ data: updated[0] });
  } catch (error: any) {
    console.error("APPROVE maintenance error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
