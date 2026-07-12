import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  assetAllocations,
  assetCategories,
  assets,
  departments,
  employees,
  maintenanceRequests,
  returnRequests,
  transferRequests,
} from "@/db/schema";
import { isUniqueViolation } from "@/lib/apiAuth";

export class AllocationService {
  async listMine(employeeId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await db
      .select({
        allocationId: assetAllocations.id,
        assetId: assets.id,
        assetName: assets.name,
        assetTag: assets.assetTag,
        serialNumber: assets.serialNumber,
        condition: assets.condition,
        location: assets.location,
        assetStatus: assets.status,
        categoryName: assetCategories.name,
        allocatedAt: assetAllocations.allocatedAt,
        expectedReturnDate: assetAllocations.expectedReturnDate,
        allocationStatus: assetAllocations.status,
        photoUrl: assets.photoUrl,
        documents: assets.documents,
      })
      .from(assetAllocations)
      .innerJoin(assets, eq(assets.id, assetAllocations.assetId))
      .leftJoin(assetCategories, eq(assetCategories.id, assets.categoryId))
      .where(
        and(
          eq(assetAllocations.employeeId, employeeId),
          eq(assetAllocations.status, "active"),
          isNull(assetAllocations.deletedAt),
          isNull(assets.deletedAt)
        )
      )
      .orderBy(desc(assetAllocations.allocatedAt));

    return rows.map((row) => {
      const overdue =
        Boolean(row.expectedReturnDate) &&
        (row.expectedReturnDate as string) < today;
      return {
        ...row,
        isOverdue: overdue,
        displayStatus: overdue ? "overdue" : row.allocationStatus,
      };
    });
  }

  async getMineDetail(employeeId: string, allocationId: string) {
    const [allocation] = await db
      .select({
        allocationId: assetAllocations.id,
        assetId: assets.id,
        assetName: assets.name,
        assetTag: assets.assetTag,
        serialNumber: assets.serialNumber,
        condition: assets.condition,
        location: assets.location,
        assetStatus: assets.status,
        categoryName: assetCategories.name,
        allocatedAt: assetAllocations.allocatedAt,
        expectedReturnDate: assetAllocations.expectedReturnDate,
        allocationStatus: assetAllocations.status,
        photoUrl: assets.photoUrl,
        documents: assets.documents,
        customFields: assets.customFields,
      })
      .from(assetAllocations)
      .innerJoin(assets, eq(assets.id, assetAllocations.assetId))
      .leftJoin(assetCategories, eq(assetCategories.id, assets.categoryId))
      .where(
        and(
          eq(assetAllocations.id, allocationId),
          eq(assetAllocations.employeeId, employeeId),
          isNull(assetAllocations.deletedAt),
          isNull(assets.deletedAt)
        )
      )
      .limit(1);

    if (!allocation) return null;

    const history = await db
      .select({
        id: assetAllocations.id,
        allocatedAt: assetAllocations.allocatedAt,
        expectedReturnDate: assetAllocations.expectedReturnDate,
        actualReturnDate: assetAllocations.actualReturnDate,
        status: assetAllocations.status,
        returnConditionNotes: assetAllocations.returnConditionNotes,
      })
      .from(assetAllocations)
      .where(
        and(
          eq(assetAllocations.assetId, allocation.assetId),
          eq(assetAllocations.employeeId, employeeId),
          isNull(assetAllocations.deletedAt)
        )
      )
      .orderBy(desc(assetAllocations.allocatedAt));

    const maintenanceHistory = await db
      .select({
        id: maintenanceRequests.id,
        issueTitle: maintenanceRequests.issueTitle,
        issueDescription: maintenanceRequests.issueDescription,
        priority: maintenanceRequests.priority,
        status: maintenanceRequests.status,
        createdAt: maintenanceRequests.createdAt,
        rejectionReason: maintenanceRequests.rejectionReason,
        resolutionNotes: maintenanceRequests.resolutionNotes,
      })
      .from(maintenanceRequests)
      .where(
        and(
          eq(maintenanceRequests.assetId, allocation.assetId),
          eq(maintenanceRequests.raisedBy, employeeId),
          isNull(maintenanceRequests.deletedAt)
        )
      )
      .orderBy(desc(maintenanceRequests.createdAt));

    const today = new Date().toISOString().slice(0, 10);
    const isOverdue =
      allocation.allocationStatus === "active" &&
      Boolean(allocation.expectedReturnDate) &&
      (allocation.expectedReturnDate as string) < today;

    return {
      ...allocation,
      isOverdue,
      displayStatus: isOverdue ? "overdue" : allocation.allocationStatus,
      allocationHistory: history,
      maintenanceHistory,
    };
  }

  async listMyReturnRequests(employeeId: string) {
    return db
      .select({
        id: returnRequests.id,
        assetId: returnRequests.assetId,
        allocationId: returnRequests.allocationId,
        reason: returnRequests.reason,
        conditionNotes: returnRequests.conditionNotes,
        preferredReturnDate: returnRequests.preferredReturnDate,
        remarks: returnRequests.remarks,
        status: returnRequests.status,
        rejectionReason: returnRequests.rejectionReason,
        createdAt: returnRequests.createdAt,
        assetName: assets.name,
        assetTag: assets.assetTag,
      })
      .from(returnRequests)
      .innerJoin(assets, eq(assets.id, returnRequests.assetId))
      .where(
        and(
          eq(returnRequests.requestedBy, employeeId),
          isNull(returnRequests.deletedAt)
        )
      )
      .orderBy(desc(returnRequests.createdAt));
  }

  async createReturnRequest(
    employeeId: string,
    input: {
      allocationId: string;
      reason?: string;
      conditionNotes?: string;
      preferredReturnDate?: string;
      attachmentUrl?: string;
      remarks?: string;
    }
  ) {
    const [allocation] = await db
      .select()
      .from(assetAllocations)
      .where(
        and(
          eq(assetAllocations.id, input.allocationId),
          eq(assetAllocations.employeeId, employeeId),
          eq(assetAllocations.status, "active"),
          isNull(assetAllocations.deletedAt)
        )
      )
      .limit(1);

    if (!allocation) {
      return { error: "Allocation not found or no longer active", status: 404 as const };
    }

    try {
      const [created] = await db
        .insert(returnRequests)
        .values({
          assetId: allocation.assetId,
          allocationId: allocation.id,
          requestedBy: employeeId,
          reason: input.reason ?? null,
          conditionNotes: input.conditionNotes ?? null,
          preferredReturnDate: input.preferredReturnDate ?? null,
          attachmentUrl: input.attachmentUrl ?? null,
          remarks: input.remarks ?? null,
          status: "requested",
          createdBy: employeeId,
          updatedBy: employeeId,
        })
        .returning();
      return { data: created };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return {
          error: "An active return request already exists for this allocation",
          status: 409 as const,
        };
      }
      throw error;
    }
  }

  async listMyTransferRequests(employeeId: string) {
    return db
      .select({
        id: transferRequests.id,
        assetId: transferRequests.assetId,
        currentAllocationId: transferRequests.currentAllocationId,
        toEmployeeId: transferRequests.toEmployeeId,
        toDepartmentId: transferRequests.toDepartmentId,
        reason: transferRequests.reason,
        notes: transferRequests.notes,
        status: transferRequests.status,
        createdAt: transferRequests.createdAt,
        assetName: assets.name,
        assetTag: assets.assetTag,
        toEmployeeName: employees.name,
        toDepartmentName: departments.name,
      })
      .from(transferRequests)
      .innerJoin(assets, eq(assets.id, transferRequests.assetId))
      .leftJoin(employees, eq(employees.id, transferRequests.toEmployeeId))
      .leftJoin(departments, eq(departments.id, transferRequests.toDepartmentId))
      .where(
        and(
          or(
            eq(transferRequests.requestedBy, employeeId),
            eq(transferRequests.fromEmployeeId, employeeId)
          ),
          isNull(transferRequests.deletedAt)
        )
      )
      .orderBy(desc(transferRequests.createdAt));
  }

  async createTransferRequest(
    employeeId: string,
    organizationId: string,
    input: {
      allocationId: string;
      toEmployeeId?: string;
      toDepartmentId?: string;
      reason?: string;
      notes?: string;
    }
  ) {
    if (!input.toEmployeeId && !input.toDepartmentId) {
      return {
        error: "Destination employee or department is required",
        status: 400 as const,
      };
    }

    const [allocation] = await db
      .select()
      .from(assetAllocations)
      .where(
        and(
          eq(assetAllocations.id, input.allocationId),
          eq(assetAllocations.employeeId, employeeId),
          eq(assetAllocations.status, "active"),
          isNull(assetAllocations.deletedAt)
        )
      )
      .limit(1);

    if (!allocation) {
      return { error: "Allocation not found or no longer active", status: 404 as const };
    }

    if (input.toEmployeeId) {
      if (input.toEmployeeId === employeeId) {
        return { error: "Cannot transfer an asset to yourself", status: 400 as const };
      }
      const [target] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(
          and(
            eq(employees.id, input.toEmployeeId),
            eq(employees.organizationId, organizationId),
            eq(employees.status, "active"),
            isNull(employees.deletedAt)
          )
        )
        .limit(1);
      if (!target) {
        return { error: "Destination employee not found", status: 400 as const };
      }
    }

    if (input.toDepartmentId) {
      const [dept] = await db
        .select({ id: departments.id })
        .from(departments)
        .where(
          and(
            eq(departments.id, input.toDepartmentId),
            eq(departments.organizationId, organizationId),
            eq(departments.status, "active"),
            isNull(departments.deletedAt)
          )
        )
        .limit(1);
      if (!dept) {
        return { error: "Destination department not found", status: 400 as const };
      }
    }

    try {
      const [created] = await db
        .insert(transferRequests)
        .values({
          assetId: allocation.assetId,
          currentAllocationId: allocation.id,
          fromEmployeeId: employeeId,
          fromDepartmentId: allocation.departmentId,
          toEmployeeId: input.toEmployeeId ?? null,
          toDepartmentId: input.toDepartmentId ?? null,
          requestedBy: employeeId,
          reason: input.reason ?? null,
          notes: input.notes ?? null,
          status: "requested",
          createdBy: employeeId,
          updatedBy: employeeId,
        })
        .returning();
      return { data: created };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return {
          error: "An active transfer request already exists for this allocation",
          status: 409 as const,
        };
      }
      throw error;
    }
  }

  async listTransferTargets(organizationId: string, employeeId: string) {
    const [people, depts] = await Promise.all([
      db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          departmentId: employees.departmentId,
        })
        .from(employees)
        .where(
          and(
            eq(employees.organizationId, organizationId),
            eq(employees.status, "active"),
            isNull(employees.deletedAt),
            sql`${employees.id} <> ${employeeId}`
          )
        )
        .orderBy(employees.name),
      db
        .select({
          id: departments.id,
          name: departments.name,
        })
        .from(departments)
        .where(
          and(
            eq(departments.organizationId, organizationId),
            eq(departments.status, "active"),
            isNull(departments.deletedAt)
          )
        )
        .orderBy(departments.name),
    ]);

    return { employees: people, departments: depts };
  }
}
