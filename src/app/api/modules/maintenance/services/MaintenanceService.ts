import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { assetAllocations, assets, maintenanceRequests } from "@/db/schema";

const PRIORITIES = ["low", "medium", "high", "critical"] as const;

export class MaintenanceService {
  async listAllocatedAssets(employeeId: string) {
    return db
      .select({
        assetId: assets.id,
        assetName: assets.name,
        assetTag: assets.assetTag,
        allocationId: assetAllocations.id,
      })
      .from(assetAllocations)
      .innerJoin(assets, eq(assets.id, assetAllocations.assetId))
      .where(
        and(
          eq(assetAllocations.employeeId, employeeId),
          eq(assetAllocations.status, "active"),
          isNull(assetAllocations.deletedAt),
          isNull(assets.deletedAt)
        )
      );
  }

  async listMine(employeeId: string) {
    return db
      .select({
        id: maintenanceRequests.id,
        assetId: maintenanceRequests.assetId,
        issueTitle: maintenanceRequests.issueTitle,
        issueDescription: maintenanceRequests.issueDescription,
        priority: maintenanceRequests.priority,
        photoUrl: maintenanceRequests.photoUrl,
        status: maintenanceRequests.status,
        rejectionReason: maintenanceRequests.rejectionReason,
        technicianName: maintenanceRequests.technicianName,
        resolutionNotes: maintenanceRequests.resolutionNotes,
        createdAt: maintenanceRequests.createdAt,
        approvedAt: maintenanceRequests.approvedAt,
        resolvedAt: maintenanceRequests.resolvedAt,
        assetName: assets.name,
        assetTag: assets.assetTag,
      })
      .from(maintenanceRequests)
      .innerJoin(assets, eq(assets.id, maintenanceRequests.assetId))
      .where(
        and(
          eq(maintenanceRequests.raisedBy, employeeId),
          isNull(maintenanceRequests.deletedAt)
        )
      )
      .orderBy(desc(maintenanceRequests.createdAt));
  }

  async getMine(employeeId: string, requestId: string) {
    const [row] = await db
      .select({
        id: maintenanceRequests.id,
        assetId: maintenanceRequests.assetId,
        issueTitle: maintenanceRequests.issueTitle,
        issueDescription: maintenanceRequests.issueDescription,
        priority: maintenanceRequests.priority,
        photoUrl: maintenanceRequests.photoUrl,
        status: maintenanceRequests.status,
        rejectionReason: maintenanceRequests.rejectionReason,
        technicianName: maintenanceRequests.technicianName,
        resolutionNotes: maintenanceRequests.resolutionNotes,
        createdAt: maintenanceRequests.createdAt,
        approvedAt: maintenanceRequests.approvedAt,
        resolvedAt: maintenanceRequests.resolvedAt,
        assetName: assets.name,
        assetTag: assets.assetTag,
      })
      .from(maintenanceRequests)
      .innerJoin(assets, eq(assets.id, maintenanceRequests.assetId))
      .where(
        and(
          eq(maintenanceRequests.id, requestId),
          eq(maintenanceRequests.raisedBy, employeeId),
          isNull(maintenanceRequests.deletedAt)
        )
      )
      .limit(1);
    return row ?? null;
  }

  async createMine(
    employeeId: string,
    input: {
      assetId: string;
      issueTitle?: string;
      issueDescription: string;
      priority?: string;
      photoUrl?: string;
    }
  ) {
    if (!input.issueDescription?.trim()) {
      return { error: "Issue description is required", status: 400 as const };
    }

    const priority = (input.priority ?? "medium").toLowerCase();
    if (!PRIORITIES.includes(priority as (typeof PRIORITIES)[number])) {
      return { error: "Invalid priority", status: 400 as const };
    }

    const [allocation] = await db
      .select({ id: assetAllocations.id })
      .from(assetAllocations)
      .where(
        and(
          eq(assetAllocations.assetId, input.assetId),
          eq(assetAllocations.employeeId, employeeId),
          eq(assetAllocations.status, "active"),
          isNull(assetAllocations.deletedAt)
        )
      )
      .limit(1);

    if (!allocation) {
      return {
        error: "You can only raise maintenance for assets currently allocated to you",
        status: 403 as const,
      };
    }

    const [created] = await db
      .insert(maintenanceRequests)
      .values({
        assetId: input.assetId,
        raisedBy: employeeId,
        issueTitle: input.issueTitle?.trim() || null,
        issueDescription: input.issueDescription.trim(),
        priority: priority as (typeof PRIORITIES)[number],
        photoUrl: input.photoUrl ?? null,
        status: "pending",
        createdBy: employeeId,
        updatedBy: employeeId,
      })
      .returning();

    return { data: created };
  }

  async countActiveMine(employeeId: string) {
    const active = await db
      .select({ id: maintenanceRequests.id })
      .from(maintenanceRequests)
      .where(
        and(
          eq(maintenanceRequests.raisedBy, employeeId),
          isNull(maintenanceRequests.deletedAt),
          inArray(maintenanceRequests.status, [
            "pending",
            "approved",
            "technician_assigned",
            "in_progress",
          ])
        )
      );
    return active.length;
  }
}
