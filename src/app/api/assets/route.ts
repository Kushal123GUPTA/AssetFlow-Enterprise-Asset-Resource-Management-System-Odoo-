import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/db";
import { assets, assetCategories, departments, employees, assetAllocations, maintenanceRequests, assetStatusHistory } from "@/db/schema";
import { eq, and, isNull, ilike, sql, inArray, desc, asc, or } from "drizzle-orm";

// Helper: get next asset tag for org
async function getNextAssetTag(organizationId: string): Promise<string> {
  const result = await db
    .select({ assetTag: assets.assetTag })
    .from(assets)
    .where(and(eq(assets.organizationId, organizationId)))
    .orderBy(desc(assets.createdAt))
    .limit(1);

  if (result.length === 0) return "AF-0001";

  const lastTag = result[0].assetTag;
  const match = lastTag.match(/AF-(\d+)/);
  if (!match) return "AF-0001";

  const nextNum = parseInt(match[1], 10) + 1;
  return `AF-${String(nextNum).padStart(4, "0")}`;
}

// POST /api/assets — Get all assets (with filters)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { search, status, categoryId, departmentId, location, isBookable } = body;
    const organizationId = session.user.organizationId;

    const conditions = [
      eq(assets.organizationId, organizationId),
      isNull(assets.deletedAt),
    ];

    if (status) conditions.push(eq(assets.status, status));
    if (categoryId) conditions.push(eq(assets.categoryId, categoryId));
    if (departmentId) conditions.push(eq(assets.departmentId, departmentId));
    if (location) conditions.push(ilike(assets.location, `%${location}%`));
    if (typeof isBookable === 'boolean') conditions.push(eq(assets.isBookable, isBookable));
    if (search) {
      conditions.push(
        or(
          ilike(assets.name, `%${search}%`),
          ilike(assets.assetTag, `%${search}%`),
          ilike(assets.serialNumber, `%${search}%`),
          ilike(assets.qrCode, `%${search}%`),
          ilike(assets.location, `%${search}%`),
        )!
      );
    }

    const rows = await db
      .select({
        id: assets.id,
        organizationId: assets.organizationId,
        assetTag: assets.assetTag,
        name: assets.name,
        categoryId: assets.categoryId,
        serialNumber: assets.serialNumber,
        qrCode: assets.qrCode,
        acquisitionDate: assets.acquisitionDate,
        acquisitionCost: assets.acquisitionCost,
        condition: assets.condition,
        location: assets.location,
        departmentId: assets.departmentId,
        isBookable: assets.isBookable,
        status: assets.status,
        customFields: assets.customFields,
        photoUrl: assets.photoUrl,
        documents: assets.documents,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
      })
      .from(assets)
      .where(and(...conditions))
      .orderBy(desc(assets.createdAt));

    // Resolve category and department names in a single pass
    const categoryIds = [...new Set(rows.map((r) => r.categoryId))];
    const departmentIds = [...new Set(rows.map((r) => r.departmentId).filter(Boolean))] as string[];

    const [cats, depts] = await Promise.all([
      categoryIds.length > 0
        ? db.select({ id: assetCategories.id, name: assetCategories.name }).from(assetCategories).where(inArray(assetCategories.id, categoryIds))
        : [],
      departmentIds.length > 0
        ? db.select({ id: departments.id, name: departments.name }).from(departments).where(inArray(departments.id, departmentIds))
        : [],
    ]);

    const catMap = new Map(cats.map((c) => [c.id, c.name]));
    const deptMap = new Map(depts.map((d) => [d.id, d.name]));

    const enriched = rows.map((r) => ({
      ...r,
      categoryName: catMap.get(r.categoryId) ?? "Unknown",
      departmentName: r.departmentId ? deptMap.get(r.departmentId) ?? null : null,
    }));

    return NextResponse.json({ data: enriched });
  } catch (error: any) {
    console.error("GET assets error:", error);
    return NextResponse.json({ error: error.message ?? "Internal Server Error" }, { status: 500 });
  }
}
