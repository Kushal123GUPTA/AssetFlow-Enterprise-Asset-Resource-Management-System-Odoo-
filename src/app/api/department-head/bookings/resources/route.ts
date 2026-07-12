import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "department_head") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db
      .select({
        id: assets.id,
        name: assets.name,
        assetTag: assets.assetTag,
        serialNumber: assets.serialNumber,
        location: assets.location,
        status: assets.status,
      })
      .from(assets)
      .where(and(eq(assets.isBookable, true), isNull(assets.deletedAt)));

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Fetch bookable resources error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
