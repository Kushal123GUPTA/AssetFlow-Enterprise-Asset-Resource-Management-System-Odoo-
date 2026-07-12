import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { employees, departments } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// POST /api/assets/allocation-options — Fetch employees and departments for allocation selection
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    const [empRows, deptRows] = await Promise.all([
      db
        .select({ id: employees.id, name: employees.name, email: employees.email })
        .from(employees)
        .where(and(eq(employees.organizationId, organizationId), isNull(employees.deletedAt))),
      db
        .select({ id: departments.id, name: departments.name })
        .from(departments)
        .where(and(eq(departments.organizationId, organizationId), isNull(departments.deletedAt))),
    ]);

    return NextResponse.json({
      data: {
        employees: empRows,
        departments: deptRows,
      },
    });
  } catch (error: any) {
    console.error("GET allocation options error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
