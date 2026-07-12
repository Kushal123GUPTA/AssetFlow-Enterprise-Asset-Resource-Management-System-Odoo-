import { NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { verifyPasswordResetToken } from "@/lib/passwordReset";

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = String(body?.token ?? "").trim();
    const password = String(body?.password ?? "");

    if (!token) {
      return NextResponse.json({ error: "Reset token is required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Peek email from token without verifying fingerprint first — need hash from DB
    let emailFromToken: string | null = null;
    try {
      const payloadB64 = token.split(".")[0];
      if (payloadB64) {
        const parsed = JSON.parse(
          Buffer.from(payloadB64, "base64url").toString("utf8")
        ) as { email?: string };
        emailFromToken = parsed.email?.toLowerCase().trim() ?? null;
      }
    } catch {
      emailFromToken = null;
    }

    if (!emailFromToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select({
        id: employees.id,
        email: employees.email,
        passwordHash: employees.passwordHash,
        status: employees.status,
      })
      .from(employees)
      .where(and(eq(employees.email, emailFromToken), isNull(employees.deletedAt)))
      .limit(1);

    if (!user || user.status !== "active") {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    const verified = verifyPasswordResetToken(token, user.passwordHash);
    if (!verified || verified.email !== String(user.email).toLowerCase()) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db
      .update(employees)
      .set({
        passwordHash,
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
      })
      .where(eq(employees.id, user.id));

    return NextResponse.json({
      success: true,
      message: "Password updated. You can sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
