import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assetCategories, departments } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// POST /api/assets/options — Fetch categories + departments for form dropdowns
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    const [categories, depts] = await Promise.all([
      db
        .select({ id: assetCategories.id, name: assetCategories.name })
        .from(assetCategories)
        .where(and(eq(assetCategories.organizationId, organizationId), isNull(assetCategories.deletedAt))),
      db
        .select({ id: departments.id, name: departments.name })
        .from(departments)
        .where(and(eq(departments.organizationId, organizationId), isNull(departments.deletedAt))),
    ]);

    return NextResponse.json({ data: { categories, departments: depts } });
  } catch (error: any) {
    console.error("OPTIONS asset error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
