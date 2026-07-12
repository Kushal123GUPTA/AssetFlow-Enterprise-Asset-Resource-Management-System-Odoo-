import { relations } from "drizzle-orm/relations";
import { organizations, departments, employees, roleAssignmentLog, assetCategories, assets, assetStatusHistory, assetAllocations, transferRequests, resourceBookings, maintenanceRequests, auditCycles, auditCycleAuditors, auditItems, discrepancyReports, notifications, activityLogsDefault } from "./schema";

export const departmentsRelations = relations(departments, ({one, many}) => ({
	organization: one(organizations, {
		fields: [departments.organizationId],
		references: [organizations.id]
	}),
	department: one(departments, {
		fields: [departments.parentDepartmentId],
		references: [departments.id],
		relationName: "departments_parentDepartmentId_departments_id"
	}),
	departments: many(departments, {
		relationName: "departments_parentDepartmentId_departments_id"
	}),
	employee_headEmployeeId: one(employees, {
		fields: [departments.headEmployeeId],
		references: [employees.id],
		relationName: "departments_headEmployeeId_employees_id"
	}),
	employee_createdBy: one(employees, {
		fields: [departments.createdBy],
		references: [employees.id],
		relationName: "departments_createdBy_employees_id"
	}),
	employee_updatedBy: one(employees, {
		fields: [departments.updatedBy],
		references: [employees.id],
		relationName: "departments_updatedBy_employees_id"
	}),
	employee_deletedBy: one(employees, {
		fields: [departments.deletedBy],
		references: [employees.id],
		relationName: "departments_deletedBy_employees_id"
	}),
	employees: many(employees, {
		relationName: "employees_departmentId_departments_id"
	}),
	assets: many(assets),
	assetAllocations: many(assetAllocations),
	transferRequests_fromDepartmentId: many(transferRequests, {
		relationName: "transferRequests_fromDepartmentId_departments_id"
	}),
	transferRequests_toDepartmentId: many(transferRequests, {
		relationName: "transferRequests_toDepartmentId_departments_id"
	}),
	resourceBookings: many(resourceBookings),
	auditCycles: many(auditCycles),
}));

export const organizationsRelations = relations(organizations, ({many}) => ({
	departments: many(departments),
	employees: many(employees),
	assetCategories: many(assetCategories),
	assets: many(assets),
	auditCycles: many(auditCycles),
	activityLogsDefaults: many(activityLogsDefault),
}));

export const employeesRelations = relations(employees, ({one, many}) => ({
	departments_headEmployeeId: many(departments, {
		relationName: "departments_headEmployeeId_employees_id"
	}),
	departments_createdBy: many(departments, {
		relationName: "departments_createdBy_employees_id"
	}),
	departments_updatedBy: many(departments, {
		relationName: "departments_updatedBy_employees_id"
	}),
	departments_deletedBy: many(departments, {
		relationName: "departments_deletedBy_employees_id"
	}),
	organization: one(organizations, {
		fields: [employees.organizationId],
		references: [organizations.id]
	}),
	department: one(departments, {
		fields: [employees.departmentId],
		references: [departments.id],
		relationName: "employees_departmentId_departments_id"
	}),
	employee_createdBy: one(employees, {
		fields: [employees.createdBy],
		references: [employees.id],
		relationName: "employees_createdBy_employees_id"
	}),
	employees_createdBy: many(employees, {
		relationName: "employees_createdBy_employees_id"
	}),
	employee_updatedBy: one(employees, {
		fields: [employees.updatedBy],
		references: [employees.id],
		relationName: "employees_updatedBy_employees_id"
	}),
	employees_updatedBy: many(employees, {
		relationName: "employees_updatedBy_employees_id"
	}),
	employee_deletedBy: one(employees, {
		fields: [employees.deletedBy],
		references: [employees.id],
		relationName: "employees_deletedBy_employees_id"
	}),
	employees_deletedBy: many(employees, {
		relationName: "employees_deletedBy_employees_id"
	}),
	roleAssignmentLogs_employeeId: many(roleAssignmentLog, {
		relationName: "roleAssignmentLog_employeeId_employees_id"
	}),
	roleAssignmentLogs_changedBy: many(roleAssignmentLog, {
		relationName: "roleAssignmentLog_changedBy_employees_id"
	}),
	assetCategories_createdBy: many(assetCategories, {
		relationName: "assetCategories_createdBy_employees_id"
	}),
	assetCategories_updatedBy: many(assetCategories, {
		relationName: "assetCategories_updatedBy_employees_id"
	}),
	assetCategories_deletedBy: many(assetCategories, {
		relationName: "assetCategories_deletedBy_employees_id"
	}),
	assets_createdBy: many(assets, {
		relationName: "assets_createdBy_employees_id"
	}),
	assets_updatedBy: many(assets, {
		relationName: "assets_updatedBy_employees_id"
	}),
	assets_deletedBy: many(assets, {
		relationName: "assets_deletedBy_employees_id"
	}),
	assetStatusHistories: many(assetStatusHistory),
	assetAllocations_employeeId: many(assetAllocations, {
		relationName: "assetAllocations_employeeId_employees_id"
	}),
	assetAllocations_allocatedBy: many(assetAllocations, {
		relationName: "assetAllocations_allocatedBy_employees_id"
	}),
	assetAllocations_returnedApprovedBy: many(assetAllocations, {
		relationName: "assetAllocations_returnedApprovedBy_employees_id"
	}),
	assetAllocations_createdBy: many(assetAllocations, {
		relationName: "assetAllocations_createdBy_employees_id"
	}),
	assetAllocations_updatedBy: many(assetAllocations, {
		relationName: "assetAllocations_updatedBy_employees_id"
	}),
	assetAllocations_deletedBy: many(assetAllocations, {
		relationName: "assetAllocations_deletedBy_employees_id"
	}),
	transferRequests_fromEmployeeId: many(transferRequests, {
		relationName: "transferRequests_fromEmployeeId_employees_id"
	}),
	transferRequests_toEmployeeId: many(transferRequests, {
		relationName: "transferRequests_toEmployeeId_employees_id"
	}),
	transferRequests_requestedBy: many(transferRequests, {
		relationName: "transferRequests_requestedBy_employees_id"
	}),
	transferRequests_approvedBy: many(transferRequests, {
		relationName: "transferRequests_approvedBy_employees_id"
	}),
	transferRequests_createdBy: many(transferRequests, {
		relationName: "transferRequests_createdBy_employees_id"
	}),
	transferRequests_updatedBy: many(transferRequests, {
		relationName: "transferRequests_updatedBy_employees_id"
	}),
	transferRequests_deletedBy: many(transferRequests, {
		relationName: "transferRequests_deletedBy_employees_id"
	}),
	resourceBookings_bookedByEmployeeId: many(resourceBookings, {
		relationName: "resourceBookings_bookedByEmployeeId_employees_id"
	}),
	resourceBookings_createdBy: many(resourceBookings, {
		relationName: "resourceBookings_createdBy_employees_id"
	}),
	resourceBookings_updatedBy: many(resourceBookings, {
		relationName: "resourceBookings_updatedBy_employees_id"
	}),
	resourceBookings_deletedBy: many(resourceBookings, {
		relationName: "resourceBookings_deletedBy_employees_id"
	}),
	maintenanceRequests_raisedBy: many(maintenanceRequests, {
		relationName: "maintenanceRequests_raisedBy_employees_id"
	}),
	maintenanceRequests_approvedBy: many(maintenanceRequests, {
		relationName: "maintenanceRequests_approvedBy_employees_id"
	}),
	maintenanceRequests_createdBy: many(maintenanceRequests, {
		relationName: "maintenanceRequests_createdBy_employees_id"
	}),
	maintenanceRequests_updatedBy: many(maintenanceRequests, {
		relationName: "maintenanceRequests_updatedBy_employees_id"
	}),
	maintenanceRequests_deletedBy: many(maintenanceRequests, {
		relationName: "maintenanceRequests_deletedBy_employees_id"
	}),
	auditCycles_closedBy: many(auditCycles, {
		relationName: "auditCycles_closedBy_employees_id"
	}),
	auditCycles_createdBy: many(auditCycles, {
		relationName: "auditCycles_createdBy_employees_id"
	}),
	auditCycles_updatedBy: many(auditCycles, {
		relationName: "auditCycles_updatedBy_employees_id"
	}),
	auditCycles_deletedBy: many(auditCycles, {
		relationName: "auditCycles_deletedBy_employees_id"
	}),
	auditCycleAuditors_employeeId: many(auditCycleAuditors, {
		relationName: "auditCycleAuditors_employeeId_employees_id"
	}),
	auditCycleAuditors_assignedBy: many(auditCycleAuditors, {
		relationName: "auditCycleAuditors_assignedBy_employees_id"
	}),
	auditCycleAuditors_deletedBy: many(auditCycleAuditors, {
		relationName: "auditCycleAuditors_deletedBy_employees_id"
	}),
	auditItems_verifiedBy: many(auditItems, {
		relationName: "auditItems_verifiedBy_employees_id"
	}),
	auditItems_createdBy: many(auditItems, {
		relationName: "auditItems_createdBy_employees_id"
	}),
	auditItems_updatedBy: many(auditItems, {
		relationName: "auditItems_updatedBy_employees_id"
	}),
	auditItems_deletedBy: many(auditItems, {
		relationName: "auditItems_deletedBy_employees_id"
	}),
	discrepancyReports_resolvedBy: many(discrepancyReports, {
		relationName: "discrepancyReports_resolvedBy_employees_id"
	}),
	discrepancyReports_createdBy: many(discrepancyReports, {
		relationName: "discrepancyReports_createdBy_employees_id"
	}),
	discrepancyReports_updatedBy: many(discrepancyReports, {
		relationName: "discrepancyReports_updatedBy_employees_id"
	}),
	discrepancyReports_deletedBy: many(discrepancyReports, {
		relationName: "discrepancyReports_deletedBy_employees_id"
	}),
	notifications_employeeId: many(notifications, {
		relationName: "notifications_employeeId_employees_id"
	}),
	notifications_deletedBy: many(notifications, {
		relationName: "notifications_deletedBy_employees_id"
	}),
	activityLogsDefaults: many(activityLogsDefault),
}));

export const roleAssignmentLogRelations = relations(roleAssignmentLog, ({one}) => ({
	employee_employeeId: one(employees, {
		fields: [roleAssignmentLog.employeeId],
		references: [employees.id],
		relationName: "roleAssignmentLog_employeeId_employees_id"
	}),
	employee_changedBy: one(employees, {
		fields: [roleAssignmentLog.changedBy],
		references: [employees.id],
		relationName: "roleAssignmentLog_changedBy_employees_id"
	}),
}));

export const assetCategoriesRelations = relations(assetCategories, ({one, many}) => ({
	organization: one(organizations, {
		fields: [assetCategories.organizationId],
		references: [organizations.id]
	}),
	assetCategory: one(assetCategories, {
		fields: [assetCategories.parentCategoryId],
		references: [assetCategories.id],
		relationName: "assetCategories_parentCategoryId_assetCategories_id"
	}),
	assetCategories: many(assetCategories, {
		relationName: "assetCategories_parentCategoryId_assetCategories_id"
	}),
	employee_createdBy: one(employees, {
		fields: [assetCategories.createdBy],
		references: [employees.id],
		relationName: "assetCategories_createdBy_employees_id"
	}),
	employee_updatedBy: one(employees, {
		fields: [assetCategories.updatedBy],
		references: [employees.id],
		relationName: "assetCategories_updatedBy_employees_id"
	}),
	employee_deletedBy: one(employees, {
		fields: [assetCategories.deletedBy],
		references: [employees.id],
		relationName: "assetCategories_deletedBy_employees_id"
	}),
	assets: many(assets),
}));

export const assetsRelations = relations(assets, ({one, many}) => ({
	organization: one(organizations, {
		fields: [assets.organizationId],
		references: [organizations.id]
	}),
	assetCategory: one(assetCategories, {
		fields: [assets.categoryId],
		references: [assetCategories.id]
	}),
	department: one(departments, {
		fields: [assets.departmentId],
		references: [departments.id]
	}),
	employee_createdBy: one(employees, {
		fields: [assets.createdBy],
		references: [employees.id],
		relationName: "assets_createdBy_employees_id"
	}),
	employee_updatedBy: one(employees, {
		fields: [assets.updatedBy],
		references: [employees.id],
		relationName: "assets_updatedBy_employees_id"
	}),
	employee_deletedBy: one(employees, {
		fields: [assets.deletedBy],
		references: [employees.id],
		relationName: "assets_deletedBy_employees_id"
	}),
	assetStatusHistories: many(assetStatusHistory),
	assetAllocations: many(assetAllocations),
	transferRequests: many(transferRequests),
	resourceBookings: many(resourceBookings),
	maintenanceRequests: many(maintenanceRequests),
	auditItems: many(auditItems),
	discrepancyReports: many(discrepancyReports),
}));

export const assetStatusHistoryRelations = relations(assetStatusHistory, ({one}) => ({
	asset: one(assets, {
		fields: [assetStatusHistory.assetId],
		references: [assets.id]
	}),
	employee: one(employees, {
		fields: [assetStatusHistory.changedBy],
		references: [employees.id]
	}),
}));

export const assetAllocationsRelations = relations(assetAllocations, ({one, many}) => ({
	asset: one(assets, {
		fields: [assetAllocations.assetId],
		references: [assets.id]
	}),
	employee_employeeId: one(employees, {
		fields: [assetAllocations.employeeId],
		references: [employees.id],
		relationName: "assetAllocations_employeeId_employees_id"
	}),
	department: one(departments, {
		fields: [assetAllocations.departmentId],
		references: [departments.id]
	}),
	employee_allocatedBy: one(employees, {
		fields: [assetAllocations.allocatedBy],
		references: [employees.id],
		relationName: "assetAllocations_allocatedBy_employees_id"
	}),
	employee_returnedApprovedBy: one(employees, {
		fields: [assetAllocations.returnedApprovedBy],
		references: [employees.id],
		relationName: "assetAllocations_returnedApprovedBy_employees_id"
	}),
	employee_createdBy: one(employees, {
		fields: [assetAllocations.createdBy],
		references: [employees.id],
		relationName: "assetAllocations_createdBy_employees_id"
	}),
	employee_updatedBy: one(employees, {
		fields: [assetAllocations.updatedBy],
		references: [employees.id],
		relationName: "assetAllocations_updatedBy_employees_id"
	}),
	employee_deletedBy: one(employees, {
		fields: [assetAllocations.deletedBy],
		references: [employees.id],
		relationName: "assetAllocations_deletedBy_employees_id"
	}),
	transferRequests_currentAllocationId: many(transferRequests, {
		relationName: "transferRequests_currentAllocationId_assetAllocations_id"
	}),
	transferRequests_resultingAllocationId: many(transferRequests, {
		relationName: "transferRequests_resultingAllocationId_assetAllocations_id"
	}),
}));

export const transferRequestsRelations = relations(transferRequests, ({one}) => ({
	asset: one(assets, {
		fields: [transferRequests.assetId],
		references: [assets.id]
	}),
	assetAllocation_currentAllocationId: one(assetAllocations, {
		fields: [transferRequests.currentAllocationId],
		references: [assetAllocations.id],
		relationName: "transferRequests_currentAllocationId_assetAllocations_id"
	}),
	employee_fromEmployeeId: one(employees, {
		fields: [transferRequests.fromEmployeeId],
		references: [employees.id],
		relationName: "transferRequests_fromEmployeeId_employees_id"
	}),
	department_fromDepartmentId: one(departments, {
		fields: [transferRequests.fromDepartmentId],
		references: [departments.id],
		relationName: "transferRequests_fromDepartmentId_departments_id"
	}),
	employee_toEmployeeId: one(employees, {
		fields: [transferRequests.toEmployeeId],
		references: [employees.id],
		relationName: "transferRequests_toEmployeeId_employees_id"
	}),
	department_toDepartmentId: one(departments, {
		fields: [transferRequests.toDepartmentId],
		references: [departments.id],
		relationName: "transferRequests_toDepartmentId_departments_id"
	}),
	employee_requestedBy: one(employees, {
		fields: [transferRequests.requestedBy],
		references: [employees.id],
		relationName: "transferRequests_requestedBy_employees_id"
	}),
	employee_approvedBy: one(employees, {
		fields: [transferRequests.approvedBy],
		references: [employees.id],
		relationName: "transferRequests_approvedBy_employees_id"
	}),
	assetAllocation_resultingAllocationId: one(assetAllocations, {
		fields: [transferRequests.resultingAllocationId],
		references: [assetAllocations.id],
		relationName: "transferRequests_resultingAllocationId_assetAllocations_id"
	}),
	employee_createdBy: one(employees, {
		fields: [transferRequests.createdBy],
		references: [employees.id],
		relationName: "transferRequests_createdBy_employees_id"
	}),
	employee_updatedBy: one(employees, {
		fields: [transferRequests.updatedBy],
		references: [employees.id],
		relationName: "transferRequests_updatedBy_employees_id"
	}),
	employee_deletedBy: one(employees, {
		fields: [transferRequests.deletedBy],
		references: [employees.id],
		relationName: "transferRequests_deletedBy_employees_id"
	}),
}));

export const resourceBookingsRelations = relations(resourceBookings, ({one}) => ({
	asset: one(assets, {
		fields: [resourceBookings.assetId],
		references: [assets.id]
	}),
	employee_bookedByEmployeeId: one(employees, {
		fields: [resourceBookings.bookedByEmployeeId],
		references: [employees.id],
		relationName: "resourceBookings_bookedByEmployeeId_employees_id"
	}),
	department: one(departments, {
		fields: [resourceBookings.departmentId],
		references: [departments.id]
	}),
	employee_createdBy: one(employees, {
		fields: [resourceBookings.createdBy],
		references: [employees.id],
		relationName: "resourceBookings_createdBy_employees_id"
	}),
	employee_updatedBy: one(employees, {
		fields: [resourceBookings.updatedBy],
		references: [employees.id],
		relationName: "resourceBookings_updatedBy_employees_id"
	}),
	employee_deletedBy: one(employees, {
		fields: [resourceBookings.deletedBy],
		references: [employees.id],
		relationName: "resourceBookings_deletedBy_employees_id"
	}),
}));

export const maintenanceRequestsRelations = relations(maintenanceRequests, ({one}) => ({
	asset: one(assets, {
		fields: [maintenanceRequests.assetId],
		references: [assets.id]
	}),
	employee_raisedBy: one(employees, {
		fields: [maintenanceRequests.raisedBy],
		references: [employees.id],
		relationName: "maintenanceRequests_raisedBy_employees_id"
	}),
	employee_approvedBy: one(employees, {
		fields: [maintenanceRequests.approvedBy],
		references: [employees.id],
		relationName: "maintenanceRequests_approvedBy_employees_id"
	}),
	employee_createdBy: one(employees, {
		fields: [maintenanceRequests.createdBy],
		references: [employees.id],
		relationName: "maintenanceRequests_createdBy_employees_id"
	}),
	employee_updatedBy: one(employees, {
		fields: [maintenanceRequests.updatedBy],
		references: [employees.id],
		relationName: "maintenanceRequests_updatedBy_employees_id"
	}),
	employee_deletedBy: one(employees, {
		fields: [maintenanceRequests.deletedBy],
		references: [employees.id],
		relationName: "maintenanceRequests_deletedBy_employees_id"
	}),
}));

export const auditCyclesRelations = relations(auditCycles, ({one, many}) => ({
	organization: one(organizations, {
		fields: [auditCycles.organizationId],
		references: [organizations.id]
	}),
	department: one(departments, {
		fields: [auditCycles.scopeDepartmentId],
		references: [departments.id]
	}),
	employee_closedBy: one(employees, {
		fields: [auditCycles.closedBy],
		references: [employees.id],
		relationName: "auditCycles_closedBy_employees_id"
	}),
	employee_createdBy: one(employees, {
		fields: [auditCycles.createdBy],
		references: [employees.id],
		relationName: "auditCycles_createdBy_employees_id"
	}),
	employee_updatedBy: one(employees, {
		fields: [auditCycles.updatedBy],
		references: [employees.id],
		relationName: "auditCycles_updatedBy_employees_id"
	}),
	employee_deletedBy: one(employees, {
		fields: [auditCycles.deletedBy],
		references: [employees.id],
		relationName: "auditCycles_deletedBy_employees_id"
	}),
	auditCycleAuditors: many(auditCycleAuditors),
	auditItems: many(auditItems),
	discrepancyReports: many(discrepancyReports),
}));

export const auditCycleAuditorsRelations = relations(auditCycleAuditors, ({one}) => ({
	auditCycle: one(auditCycles, {
		fields: [auditCycleAuditors.auditCycleId],
		references: [auditCycles.id]
	}),
	employee_employeeId: one(employees, {
		fields: [auditCycleAuditors.employeeId],
		references: [employees.id],
		relationName: "auditCycleAuditors_employeeId_employees_id"
	}),
	employee_assignedBy: one(employees, {
		fields: [auditCycleAuditors.assignedBy],
		references: [employees.id],
		relationName: "auditCycleAuditors_assignedBy_employees_id"
	}),
	employee_deletedBy: one(employees, {
		fields: [auditCycleAuditors.deletedBy],
		references: [employees.id],
		relationName: "auditCycleAuditors_deletedBy_employees_id"
	}),
}));

export const auditItemsRelations = relations(auditItems, ({one, many}) => ({
	auditCycle: one(auditCycles, {
		fields: [auditItems.auditCycleId],
		references: [auditCycles.id]
	}),
	asset: one(assets, {
		fields: [auditItems.assetId],
		references: [assets.id]
	}),
	employee_verifiedBy: one(employees, {
		fields: [auditItems.verifiedBy],
		references: [employees.id],
		relationName: "auditItems_verifiedBy_employees_id"
	}),
	employee_createdBy: one(employees, {
		fields: [auditItems.createdBy],
		references: [employees.id],
		relationName: "auditItems_createdBy_employees_id"
	}),
	employee_updatedBy: one(employees, {
		fields: [auditItems.updatedBy],
		references: [employees.id],
		relationName: "auditItems_updatedBy_employees_id"
	}),
	employee_deletedBy: one(employees, {
		fields: [auditItems.deletedBy],
		references: [employees.id],
		relationName: "auditItems_deletedBy_employees_id"
	}),
	discrepancyReports: many(discrepancyReports),
}));

export const discrepancyReportsRelations = relations(discrepancyReports, ({one}) => ({
	auditItem: one(auditItems, {
		fields: [discrepancyReports.auditItemId],
		references: [auditItems.id]
	}),
	auditCycle: one(auditCycles, {
		fields: [discrepancyReports.auditCycleId],
		references: [auditCycles.id]
	}),
	asset: one(assets, {
		fields: [discrepancyReports.assetId],
		references: [assets.id]
	}),
	employee_resolvedBy: one(employees, {
		fields: [discrepancyReports.resolvedBy],
		references: [employees.id],
		relationName: "discrepancyReports_resolvedBy_employees_id"
	}),
	employee_createdBy: one(employees, {
		fields: [discrepancyReports.createdBy],
		references: [employees.id],
		relationName: "discrepancyReports_createdBy_employees_id"
	}),
	employee_updatedBy: one(employees, {
		fields: [discrepancyReports.updatedBy],
		references: [employees.id],
		relationName: "discrepancyReports_updatedBy_employees_id"
	}),
	employee_deletedBy: one(employees, {
		fields: [discrepancyReports.deletedBy],
		references: [employees.id],
		relationName: "discrepancyReports_deletedBy_employees_id"
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	employee_employeeId: one(employees, {
		fields: [notifications.employeeId],
		references: [employees.id],
		relationName: "notifications_employeeId_employees_id"
	}),
	employee_deletedBy: one(employees, {
		fields: [notifications.deletedBy],
		references: [employees.id],
		relationName: "notifications_deletedBy_employees_id"
	}),
}));

export const activityLogsDefaultRelations = relations(activityLogsDefault, ({one}) => ({
	employee: one(employees, {
		fields: [activityLogsDefault.employeeId],
		references: [employees.id]
	}),
	organization: one(organizations, {
		fields: [activityLogsDefault.organizationId],
		references: [organizations.id]
	}),
}));