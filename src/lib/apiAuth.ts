import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";

export type SessionEmployee = {
  id: string;
  role: string;
  organizationId: string;
  departmentId: string | null;
  name?: string | null;
  email?: string | null;
};

export async function requireSessionEmployee(): Promise<
  { employee: SessionEmployee } | { error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return {
    employee: {
      id: session.user.id,
      role: session.user.role,
      organizationId: session.user.organizationId,
      departmentId: session.user.departmentId,
      name: session.user.name,
      email: session.user.email,
    },
  };
}

export function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string }; message?: string };
  return (
    e?.code === "23505" ||
    e?.cause?.code === "23505" ||
    Boolean(e?.message?.includes("duplicate key")) ||
    Boolean(e?.message?.includes("uq_one_open"))
  );
}

export function isExclusionViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string }; message?: string };
  return (
    e?.code === "23P01" ||
    e?.cause?.code === "23P01" ||
    Boolean(e?.message?.toLowerCase().includes("excl_no_overlapping")) ||
    Boolean(e?.message?.toLowerCase().includes("exclusion"))
  );
}
