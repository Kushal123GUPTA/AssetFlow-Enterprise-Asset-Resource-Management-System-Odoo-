import { db } from "@/db";
import { auditCycles, departments } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import type { CreateAuditCycleDto, UpdateAuditCycleDto } from "../dto/AuditDto";

export async function getAuditCycles(organizationId: string) {
  return db
    .select({
      id: auditCycles.id,
      organizationId: auditCycles.organizationId,
      name: auditCycles.name,
      scopeDepartmentId: auditCycles.scopeDepartmentId,
      scopeDepartmentName: departments.name,
      scopeLocation: auditCycles.scopeLocation,
      startDate: auditCycles.startDate,
      endDate: auditCycles.endDate,
      status: auditCycles.status,
      closedBy: auditCycles.closedBy,
      closedAt: auditCycles.closedAt,
      createdAt: auditCycles.createdAt,
      updatedAt: auditCycles.updatedAt,
    })
    .from(auditCycles)
    .leftJoin(departments, eq(auditCycles.scopeDepartmentId, departments.id))
    .where(
      and(
        eq(auditCycles.organizationId, organizationId),
        isNull(auditCycles.deletedAt)
      )
    )
    .orderBy(auditCycles.startDate);
}

export async function getAuditCycleById(id: string, organizationId: string) {
  const rows = await db
    .select()
    .from(auditCycles)
    .where(
      and(
        eq(auditCycles.id, id),
        eq(auditCycles.organizationId, organizationId),
        isNull(auditCycles.deletedAt)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function createAuditCycle(
  organizationId: string,
  dto: CreateAuditCycleDto,
  createdBy: string
) {
  const [row] = await db
    .insert(auditCycles)
    .values({
      organizationId,
      name: dto.name.trim(),
      startDate: dto.startDate,
      endDate: dto.endDate,
      scopeDepartmentId: dto.scopeDepartmentId ?? null,
      scopeLocation: dto.scopeLocation ?? null,
      createdBy,
      updatedBy: createdBy,
    })
    .returning();
  return row;
}

export async function updateAuditCycle(
  id: string,
  organizationId: string,
  dto: UpdateAuditCycleDto,
  updatedBy: string
) {
  const updateData: Record<string, unknown> = { ...dto, updatedBy };
  // If closing, record closedBy/closedAt
  if (dto.status === "closed") {
    updateData.closedBy = updatedBy;
    updateData.closedAt = new Date().toISOString();
  }

  const [row] = await db
    .update(auditCycles)
    .set(updateData as any)
    .where(
      and(
        eq(auditCycles.id, id),
        eq(auditCycles.organizationId, organizationId),
        isNull(auditCycles.deletedAt)
      )
    )
    .returning();
  return row ?? null;
}

export async function softDeleteAuditCycle(
  id: string,
  organizationId: string,
  deletedBy: string
) {
  const [row] = await db
    .update(auditCycles)
    .set({ deletedAt: new Date().toISOString(), deletedBy })
    .where(
      and(
        eq(auditCycles.id, id),
        eq(auditCycles.organizationId, organizationId),
        isNull(auditCycles.deletedAt)
      )
    )
    .returning({ id: auditCycles.id });
  return row ?? null;
}
