import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, auditCycles, auditCycleAuditors, auditItems } from "@/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";

// POST /api/assets/audit/create — Create an audit campaign and auto-generate audit items
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, scopeDepartmentId, scopeLocation, startDate, endDate, auditorIds } = await req.json();

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Name, start date, and end date are required" }, { status: 400 });
    }

    const organizationId = session.user.organizationId;

    // 1. Create audit cycle
    const insertedCycle = await db
      .insert(auditCycles)
      .values({
        organizationId,
        name,
        scopeDepartmentId: scopeDepartmentId || null,
        scopeLocation: scopeLocation || null,
        startDate,
        endDate,
        status: "planned",
        createdBy: session.user.id,
      })
      .returning();

    const cycleId = insertedCycle[0].id;

    // 2. Insert auditors if provided
    if (auditorIds && Array.isArray(auditorIds) && auditorIds.length > 0) {
      const auditorRows = auditorIds.map((empId) => ({
        auditCycleId: cycleId,
        employeeId: empId,
        assignedBy: session.user.id,
      }));
      await db.insert(auditCycleAuditors).values(auditorRows);
    }

    // 3. Select scoped assets to audit
    const assetConditions = [
      eq(assets.organizationId, organizationId),
      ne(assets.status, "retired"),
      ne(assets.status, "disposed"),
      isNull(assets.deletedAt),
    ];

    if (scopeDepartmentId) {
      assetConditions.push(eq(assets.departmentId, scopeDepartmentId));
    }
    if (scopeLocation) {
      assetConditions.push(eq(assets.location, scopeLocation));
    }

    const targetAssets = await db
      .select({ id: assets.id })
      .from(assets)
      .where(and(...assetConditions));

    // 4. Create audit items (if any assets found)
    if (targetAssets.length > 0) {
      const auditItemRows = targetAssets.map((asset) => ({
        auditCycleId: cycleId,
        assetId: asset.id,
        status: "pending" as const,
        createdBy: session.user.id,
      }));
      await db.insert(auditItems).values(auditItemRows);
    }

    return NextResponse.json({ data: { id: cycleId, itemsCreated: targetAssets.length } });
  } catch (error: any) {
    console.error("CREATE audit cycle error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
