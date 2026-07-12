import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// POST /api/assets/delete — Soft delete an asset
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    const updated = await db
      .update(assets)
      .set({
        deletedAt: new Date().toISOString(),
        deletedBy: session.user.id,
      })
      .where(and(eq(assets.id, id), isNull(assets.deletedAt)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { id } });
  } catch (error: any) {
    console.error("DELETE asset error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
