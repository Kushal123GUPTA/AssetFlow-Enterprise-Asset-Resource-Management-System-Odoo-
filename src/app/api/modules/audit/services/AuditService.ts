import * as repo from "../repositories/AuditRepository";
import type { CreateAuditCycleDto, UpdateAuditCycleDto } from "../dto/AuditDto";

export async function listAuditCycles(organizationId: string) {
  return repo.getAuditCycles(organizationId);
}

export async function getAuditCycle(id: string, organizationId: string) {
  const cycle = await repo.getAuditCycleById(id, organizationId);
  if (!cycle) throw new Error("Audit cycle not found");
  return cycle;
}

export async function addAuditCycle(
  organizationId: string,
  dto: CreateAuditCycleDto,
  createdBy: string
) {
  if (!dto.name?.trim()) throw new Error("Audit cycle name is required");
  if (!dto.startDate) throw new Error("Start date is required");
  if (!dto.endDate) throw new Error("End date is required");
  if (dto.endDate < dto.startDate) throw new Error("End date must be >= start date");
  return repo.createAuditCycle(organizationId, dto, createdBy);
}

export async function editAuditCycle(
  id: string,
  organizationId: string,
  dto: UpdateAuditCycleDto,
  updatedBy: string
) {
  const existing = await repo.getAuditCycleById(id, organizationId);
  if (!existing) throw new Error("Audit cycle not found");
  if (existing.status === "closed") throw new Error("Cannot modify a closed audit cycle");
  return repo.updateAuditCycle(id, organizationId, dto, updatedBy);
}

export async function removeAuditCycle(
  id: string,
  organizationId: string,
  deletedBy: string
) {
  const existing = await repo.getAuditCycleById(id, organizationId);
  if (!existing) throw new Error("Audit cycle not found");
  if (existing.status === "in_progress")
    throw new Error("Cannot delete an in-progress audit cycle");
  return repo.softDeleteAuditCycle(id, organizationId, deletedBy);
}
