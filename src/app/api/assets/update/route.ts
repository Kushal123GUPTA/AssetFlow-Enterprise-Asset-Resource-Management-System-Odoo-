import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetStatusHistory } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// POST /api/assets/update — Update an existing asset
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition, location, departmentId, isBookable, status, photoUrl, documents } = body;

    if (!id) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    // If status changed, log it
    if (status) {
      const existing = await db.select({ status: assets.status }).from(assets).where(eq(assets.id, id)).limit(1);
      if (existing.length > 0 && existing[0].status !== status) {
        await db.insert(assetStatusHistory).values({
          assetId: id,
          fromStatus: existing[0].status,
          toStatus: status,
          changedBy: session.user.id,
          reason: `Status updated to ${status}`,
        });
      }
    }

    const updateData: Record<string, unknown> = { updatedBy: session.user.id };
    if (name !== undefined) updateData.name = name;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber || null;
    if (acquisitionDate !== undefined) updateData.acquisitionDate = acquisitionDate || null;
    if (acquisitionCost !== undefined) updateData.acquisitionCost = acquisitionCost || null;
    if (condition !== undefined) updateData.condition = condition || null;
    if (location !== undefined) updateData.location = location || null;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (isBookable !== undefined) updateData.isBookable = isBookable;
    if (status !== undefined) updateData.status = status;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl || null;
    if (documents !== undefined) updateData.documents = Array.isArray(documents) ? documents : [];

    const updated = await db
      .update(assets)
      .set(updateData)
      .where(and(eq(assets.id, id), isNull(assets.deletedAt)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated[0] });
  } catch (error: any) {
    console.error("UPDATE asset error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
