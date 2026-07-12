import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { employees, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, organizationName } = body;

    if (!name || !email || !password || !organizationName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.select().from(employees).where(eq(employees.email, email.toLowerCase())).limit(1);
    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create organization and user in a transaction or sequentially
    // Drizzle with Neon HTTP doesn't fully support traditional transactions if not using WebSocket, but we can do sequential inserts
    const newOrg = await db.insert(organizations).values({
      name: organizationName,
    }).returning({ id: organizations.id });

    const orgId = newOrg[0].id;

    const newUser = await db.insert(employees).values({
      name,
      email: email.toLowerCase(),
      passwordHash,
      organizationId: orgId,
      role: 'admin' // First user in an org is admin
    }).returning({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      role: employees.role
    });

    return NextResponse.json({ success: true, user: newUser[0] }, { status: 201 });

  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
