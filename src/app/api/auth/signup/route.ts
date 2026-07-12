import { NextResponse } from "next/server";
import { db } from "@/db";
import { employees, organizations } from "@/db/schema";
import { eq, isNull, asc } from "drizzle-orm";
import bcrypt from "bcryptjs";

/**
 * Signup always creates an Employee.
 * For now, all signups join the first organization in the DB
 * (single-tenant until multi-org picker is needed).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const emailNorm = String(email).toLowerCase().trim();

    const [org] = await db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(isNull(organizations.deletedAt))
      .orderBy(asc(organizations.createdAt))
      .limit(1);

    if (!org) {
      return NextResponse.json(
        {
          error:
            "No organization exists yet. Run the admin seed first (npx tsx scripts/seed-admin.ts).",
        },
        { status: 400 }
      );
    }

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

    const [newUser] = await db
      .insert(employees)
      .values({
        name: String(name).trim(),
        email: emailNorm,
        passwordHash,
        organizationId: org.id,
        role: "employee",
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
