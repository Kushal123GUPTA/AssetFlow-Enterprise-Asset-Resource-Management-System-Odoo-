import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetStatusHistory } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

// Helper: get next asset tag for org
async function getNextAssetTag(organizationId: string): Promise<string> {
  const result = await db
    .select({ assetTag: assets.assetTag })
    .from(assets)
    .where(eq(assets.organizationId, organizationId))
    .orderBy(desc(assets.createdAt))
    .limit(1);

  if (result.length === 0) return "AF-0001";

  const lastTag = result[0].assetTag;
  const match = lastTag.match(/AF-(\d+)/);
  if (!match) return "AF-0001";

  const nextNum = parseInt(match[1], 10) + 1;
  return `AF-${String(nextNum).padStart(4, "0")}`;
}

// POST /api/assets/add — Register a new asset
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition, location, departmentId, isBookable, photoUrl } = body;

    if (!name || !categoryId) {
      return NextResponse.json({ error: "Name and Category are required" }, { status: 400 });
    }

    const organizationId = session.user.organizationId;
    const assetTag = await getNextAssetTag(organizationId);
    // Auto-generate QR code value from the asset tag for instant scanning
    const qrCode = `ASSETFLOW:${organizationId}:${assetTag}`;

    const inserted = await db
      .insert(assets)
      .values({
        organizationId,
        assetTag,
        name,
        categoryId,
        serialNumber: serialNumber || null,
        qrCode,
        acquisitionDate: acquisitionDate || null,
        acquisitionCost: acquisitionCost || null,
        condition: condition || null,
        location: location || null,
        departmentId: departmentId || null,
        isBookable: isBookable ?? false,
        photoUrl: photoUrl || null,
        status: "available",
        customFields: {},
        documents: [],
        createdBy: session.user.id,
        updatedBy: session.user.id,
      })
      .returning();

    // Log status history
    await db.insert(assetStatusHistory).values({
      assetId: inserted[0].id,
      fromStatus: null,
      toStatus: "available",
      changedBy: session.user.id,
      reason: "Asset registered",
    });

    return NextResponse.json({ data: inserted[0] });
  } catch (error: any) {
    console.error("ADD asset error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
