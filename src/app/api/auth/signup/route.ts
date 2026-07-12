import { NextResponse } from "next/server";
import { db } from "@/db";
import { employees, organizations } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";

/**
 * Signup rules (AssetFlow spec):
 * - Creating a brand-new organization: first user is admin (bootstrap only).
 * - Joining an existing organization by name: always employee (no self-elevation).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, organizationName } = body;

    if (!name || !email || !password || !organizationName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailNorm = String(email).toLowerCase().trim();
    const orgName = String(organizationName).trim();

    const existingUser = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.email, emailNorm))
      .limit(1);
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const existingOrg = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(ilike(organizations.name, orgName))
      .limit(1);

    let orgId: string;
    let role: "admin" | "employee";

    if (existingOrg.length > 0) {
      orgId = existingOrg[0].id;
      role = "employee";
    } else {
      const [newOrg] = await db
        .insert(organizations)
        .values({ name: orgName })
        .returning({ id: organizations.id });
      orgId = newOrg.id;
      // First account for a new organization bootstraps as admin.
      role = "admin";
    }

    const [newUser] = await db
      .insert(employees)
      .values({
        name: String(name).trim(),
        email: emailNorm,
        passwordHash,
        organizationId: orgId,
        role,
      })
      .returning({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        role: employees.role,
      });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: unknown) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
