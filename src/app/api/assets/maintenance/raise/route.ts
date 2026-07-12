import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, maintenanceRequests } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Raise a ticket only — asset stays as-is until approval (spec). */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assetId, issueDescription, priority, photoUrl } = await req.json();

    if (!assetId || !issueDescription) {
      return NextResponse.json(
        { error: "Asset ID and issue description are required" },
        { status: 400 }
      );
    }

    const [asset] = await db
      .select({ id: assets.id, name: assets.name, assetTag: assets.assetTag })
      .from(assets)
      .where(eq(assets.id, assetId))
      .limit(1);

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const [ticket] = await db
      .insert(maintenanceRequests)
      .values({
        assetId,
        raisedBy: session.user.id,
        issueDescription,
        priority: priority || "medium",
        photoUrl: photoUrl || null,
        status: "pending",
        createdBy: session.user.id,
        updatedBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ data: ticket });
  } catch (error: any) {
    console.error("RAISE maintenance error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
