import { NextResponse } from "next/server";
import { asc, isNull } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";

/**
 * GET /api/auth/organizations — public list for signup org picker.
 * Returns id + name only (no sensitive fields).
 */
export async function GET() {
  try {
    const rows = await db
      .select({
        id: organizations.id,
        name: organizations.name,
      })
      .from(organizations)
      .where(isNull(organizations.deletedAt))
      .orderBy(asc(organizations.name));

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("GET /api/auth/organizations", error);
    return NextResponse.json({ error: "Failed to load organizations" }, { status: 500 });
  }
}
