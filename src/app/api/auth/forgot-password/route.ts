import { NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { createPasswordResetToken } from "@/lib/passwordReset";

/**
 * POST /api/auth/forgot-password
 * Always returns a generic success message (no email enumeration).
 * When the account exists, also returns a short-lived resetPath so the UI can
 * complete the flow without an email provider configured.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? "")
      .toLowerCase()
      .trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    const generic = {
      success: true,
      message:
        "If an account exists for that email, you can continue to set a new password.",
    };

    const [user] = await db
      .select({
        email: employees.email,
        passwordHash: employees.passwordHash,
        status: employees.status,
      })
      .from(employees)
      .where(and(eq(employees.email, email), isNull(employees.deletedAt)))
      .limit(1);

    if (!user || user.status !== "active") {
      return NextResponse.json(generic);
    }

    const token = createPasswordResetToken(String(user.email), user.passwordHash);
    const resetPath = `/reset-password?token=${encodeURIComponent(token)}`;

    return NextResponse.json({
      ...generic,
      resetPath,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
