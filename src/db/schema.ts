import { pgTable, uuid, text, timestamp, type AnyPgColumn, index, uniqueIndex, foreignKey, jsonb, date, numeric, boolean, check, primaryKey, pgEnum, customType } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

const citext = customType<{ data: string }>({ dataType() { return 'citext'; } });

export const allocationStatus = pgEnum("allocation_status", ['active', 'returned', 'overdue'])
export const assetStatus = pgEnum("asset_status", ['available', 'allocated', 'reserved', 'under_maintenance', 'lost', 'retired', 'disposed'])
export const auditCycleStatus = pgEnum("audit_cycle_status", ['planned', 'in_progress', 'closed'])
export const auditItemStatus = pgEnum("audit_item_status", ['pending', 'verified', 'missing', 'damaged'])
export const bookingStatus = pgEnum("booking_status", ['upcoming', 'ongoing', 'completed', 'cancelled'])
export const maintenancePriority = pgEnum("maintenance_priority", ['low', 'medium', 'high', 'critical'])
export const maintenanceStatus = pgEnum("maintenance_status", ['pending', 'approved', 'rejected', 'technician_assigned', 'in_progress', 'resolved'])
export const transferStatus = pgEnum("transfer_status", ['requested', 'approved', 'rejected'])
export const returnRequestStatus = pgEnum("return_request_status", ['requested', 'approved', 'rejected', 'completed'])
export const userRole = pgEnum("user_role", ['admin', 'asset_manager', 'department_head', 'employee'])
export const userStatus = pgEnum("user_status", ['active', 'inactive'])


export const organizations = pgTable("organizations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: uuid("updated_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: uuid("deleted_by"),
});

export const departments = pgTable("departments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	name: text().notNull(),
	parentDepartmentId: uuid("parent_department_id"),
	headEmployeeId: uuid("head_employee_id"),
	status: userStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: uuid("updated_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: uuid("deleted_by"),
}, (table): any => [
	index("idx_departments_org").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_departments_parent").using("btree", table.parentDepartmentId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	uniqueIndex("uq_departments_org_name").using("btree", table.organizationId.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "departments_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentDepartmentId],
			foreignColumns: [table.id],
			name: "departments_parent_department_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.headEmployeeId],
			foreignColumns: [employees.id],
			name: "fk_departments_head"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [employees.id],
			name: "fk_departments_created_by"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [employees.id],
			name: "fk_departments_updated_by"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [employees.id],
			name: "fk_departments_deleted_by"
		}),
]);

export const employees = pgTable("employees", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	name: text().notNull(),
	// TODO: failed to parse database type 'citext'
	email: citext("email").notNull(),
	passwordHash: text("password_hash").notNull(),
	departmentId: uuid("department_id"),
	role: userRole().default('employee').notNull(),
	status: userStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: uuid("updated_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: uuid("deleted_by"),
}, (table) => [
	index("idx_employees_department").using("btree", table.departmentId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_employees_org").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_employees_role").using("btree", table.role.asc().nullsLast().op("enum_ops")).where(sql`(deleted_at IS NULL)`),
	uniqueIndex("uq_employees_org_email").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops"), table.email.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "employees_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departments.id],
			name: "employees_department_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [table.id],
			name: "employees_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [table.id],
			name: "employees_updated_by_fkey"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [table.id],
			name: "employees_deleted_by_fkey"
		}),
]);

export const roleAssignmentLog = pgTable("role_assignment_log", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	employeeId: uuid("employee_id").notNull(),
	oldRole: userRole("old_role").notNull(),
	newRole: userRole("new_role").notNull(),
	changedBy: uuid("changed_by").notNull(),
	changedAt: timestamp("changed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_role_log_employee").using("btree", table.employeeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "role_assignment_log_employee_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.changedBy],
			foreignColumns: [employees.id],
			name: "role_assignment_log_changed_by_fkey"
		}),
]);

export const assetCategories = pgTable("asset_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	name: text().notNull(),
	parentCategoryId: uuid("parent_category_id"),
	customFieldsSchema: jsonb("custom_fields_schema").default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: uuid("updated_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: uuid("deleted_by"),
}, (table) => [
	index("idx_categories_org").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	uniqueIndex("uq_categories_org_name").using("btree", table.organizationId.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "asset_categories_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentCategoryId],
			foreignColumns: [table.id],
			name: "asset_categories_parent_category_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [employees.id],
			name: "asset_categories_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [employees.id],
			name: "asset_categories_updated_by_fkey"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [employees.id],
			name: "asset_categories_deleted_by_fkey"
		}),
]);

export const assets = pgTable("assets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	assetTag: text("asset_tag").notNull(),
	name: text().notNull(),
	categoryId: uuid("category_id").notNull(),
	serialNumber: text("serial_number"),
	qrCode: text("qr_code"),
	acquisitionDate: date("acquisition_date"),
	acquisitionCost: numeric("acquisition_cost", { precision: 14, scale:  2 }),
	condition: text(),
	location: text(),
	departmentId: uuid("department_id"),
	isBookable: boolean("is_bookable").default(false).notNull(),
	status: assetStatus().default('available').notNull(),
	customFields: jsonb("custom_fields").default({}).notNull(),
	photoUrl: text("photo_url"),
	documents: jsonb().default([]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: uuid("updated_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: uuid("deleted_by"),
}, (table) => [
	index("idx_assets_bookable").using("btree", table.isBookable.asc().nullsLast().op("bool_ops")).where(sql`((is_bookable = true) AND (deleted_at IS NULL))`),
	index("idx_assets_category").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_assets_department").using("btree", table.departmentId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_assets_org").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_assets_search").using("gin", sql`to_tsvector('english'::regconfig, ((((COALESCE(name, ''::text) `).where(sql`(deleted_at IS NULL)`),
	index("idx_assets_serial").using("btree", table.serialNumber.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_assets_status").using("btree", table.status.asc().nullsLast().op("enum_ops")).where(sql`(deleted_at IS NULL)`),
	uniqueIndex("uq_assets_org_tag").using("btree", table.organizationId.asc().nullsLast().op("text_ops"), table.assetTag.asc().nullsLast().op("text_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "assets_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [assetCategories.id],
			name: "assets_category_id_fkey"
		}),
	foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departments.id],
			name: "assets_department_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [employees.id],
			name: "assets_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [employees.id],
			name: "assets_updated_by_fkey"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [employees.id],
			name: "assets_deleted_by_fkey"
		}),
]);

export const assetStatusHistory = pgTable("asset_status_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assetId: uuid("asset_id").notNull(),
	fromStatus: assetStatus("from_status"),
	toStatus: assetStatus("to_status").notNull(),
	changedBy: uuid("changed_by"),
	reason: text(),
	changedAt: timestamp("changed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_asset_status_history_asset").using("btree", table.assetId.asc().nullsLast().op("timestamptz_ops"), table.changedAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.assetId],
			foreignColumns: [assets.id],
			name: "asset_status_history_asset_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.changedBy],
			foreignColumns: [employees.id],
			name: "asset_status_history_changed_by_fkey"
		}),
]);

export const assetAllocations = pgTable("asset_allocations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assetId: uuid("asset_id").notNull(),
	employeeId: uuid("employee_id"),
	departmentId: uuid("department_id"),
	allocatedBy: uuid("allocated_by").notNull(),
	allocatedAt: timestamp("allocated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expectedReturnDate: date("expected_return_date"),
	actualReturnDate: timestamp("actual_return_date", { withTimezone: true, mode: 'string' }),
	returnConditionNotes: text("return_condition_notes"),
	returnedApprovedBy: uuid("returned_approved_by"),
	status: allocationStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: uuid("updated_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: uuid("deleted_by"),
}, (table) => [
	index("idx_allocations_asset").using("btree", table.assetId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_allocations_department").using("btree", table.departmentId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_allocations_employee").using("btree", table.employeeId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_allocations_overdue").using("btree", table.expectedReturnDate.asc().nullsLast().op("date_ops")).where(sql`((status = 'active'::allocation_status) AND (deleted_at IS NULL))`),
	uniqueIndex("uq_one_active_allocation_per_asset").using("btree", table.assetId.asc().nullsLast().op("uuid_ops")).where(sql`((status = 'active'::allocation_status) AND (deleted_at IS NULL))`),
	foreignKey({
			columns: [table.assetId],
			foreignColumns: [assets.id],
			name: "asset_allocations_asset_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "asset_allocations_employee_id_fkey"
		}),
	foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departments.id],
			name: "asset_allocations_department_id_fkey"
		}),
	foreignKey({
			columns: [table.allocatedBy],
			foreignColumns: [employees.id],
			name: "asset_allocations_allocated_by_fkey"
		}),
	foreignKey({
			columns: [table.returnedApprovedBy],
			foreignColumns: [employees.id],
			name: "asset_allocations_returned_approved_by_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [employees.id],
			name: "asset_allocations_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [employees.id],
			name: "asset_allocations_updated_by_fkey"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [employees.id],
			name: "asset_allocations_deleted_by_fkey"
		}),
	check("asset_allocations_check", sql`(employee_id IS NOT NULL) OR (department_id IS NOT NULL)`),
]);

export const transferRequests = pgTable("transfer_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assetId: uuid("asset_id").notNull(),
	currentAllocationId: uuid("current_allocation_id"),
	fromEmployeeId: uuid("from_employee_id"),
	fromDepartmentId: uuid("from_department_id"),
	toEmployeeId: uuid("to_employee_id"),
	toDepartmentId: uuid("to_department_id"),
	requestedBy: uuid("requested_by").notNull(),
	reason: text(),
	notes: text(),
	status: transferStatus().default('requested').notNull(),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	resultingAllocationId: uuid("resulting_allocation_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: uuid("updated_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: uuid("deleted_by"),
}, (table) => [
	index("idx_transfers_asset").using("btree", table.assetId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_transfers_status").using("btree", table.status.asc().nullsLast().op("enum_ops")).where(sql`(deleted_at IS NULL)`),
	uniqueIndex("uq_one_open_transfer_per_allocation").using("btree", table.currentAllocationId.asc().nullsLast().op("uuid_ops")).where(sql`((status = 'requested'::transfer_status) AND (deleted_at IS NULL) AND (current_allocation_id IS NOT NULL))`),
	foreignKey({
			columns: [table.assetId],
			foreignColumns: [assets.id],
			name: "transfer_requests_asset_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.currentAllocationId],
			foreignColumns: [assetAllocations.id],
			name: "transfer_requests_current_allocation_id_fkey"
		}),
	foreignKey({
			columns: [table.fromEmployeeId],
			foreignColumns: [employees.id],
			name: "transfer_requests_from_employee_id_fkey"
		}),
	foreignKey({
			columns: [table.fromDepartmentId],
			foreignColumns: [departments.id],
			name: "transfer_requests_from_department_id_fkey"
		}),
	foreignKey({
			columns: [table.toEmployeeId],
			foreignColumns: [employees.id],
			name: "transfer_requests_to_employee_id_fkey"
		}),
	foreignKey({
			columns: [table.toDepartmentId],
			foreignColumns: [departments.id],
			name: "transfer_requests_to_department_id_fkey"
		}),
	foreignKey({
			columns: [table.requestedBy],
			foreignColumns: [employees.id],
			name: "transfer_requests_requested_by_fkey"
		}),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [employees.id],
			name: "transfer_requests_approved_by_fkey"
		}),
	foreignKey({
			columns: [table.resultingAllocationId],
			foreignColumns: [assetAllocations.id],
			name: "transfer_requests_resulting_allocation_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [employees.id],
			name: "transfer_requests_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [employees.id],
			name: "transfer_requests_updated_by_fkey"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [employees.id],
			name: "transfer_requests_deleted_by_fkey"
		}),
	check("transfer_requests_check", sql`(to_employee_id IS NOT NULL) OR (to_department_id IS NOT NULL)`),
]);

export const returnRequests = pgTable("return_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assetId: uuid("asset_id").notNull(),
	allocationId: uuid("allocation_id").notNull(),
	requestedBy: uuid("requested_by").notNull(),
	reason: text(),
	conditionNotes: text("condition_notes"),
	preferredReturnDate: date("preferred_return_date"),
	attachmentUrl: text("attachment_url"),
	remarks: text(),
	status: returnRequestStatus().default('requested').notNull(),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: uuid("updated_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: uuid("deleted_by"),
}, (table) => [
	index("idx_return_requests_asset").using("btree", table.assetId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_return_requests_status").using("btree", table.status.asc().nullsLast().op("enum_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_return_requests_requested_by").using("btree", table.requestedBy.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	uniqueIndex("uq_one_open_return_per_allocation").using("btree", table.allocationId.asc().nullsLast().op("uuid_ops")).where(sql`((status = 'requested'::return_request_status) AND (deleted_at IS NULL))`),
	foreignKey({
			columns: [table.assetId],
			foreignColumns: [assets.id],
			name: "return_requests_asset_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.allocationId],
			foreignColumns: [assetAllocations.id],
			name: "return_requests_allocation_id_fkey"
		}),
	foreignKey({
			columns: [table.requestedBy],
			foreignColumns: [employees.id],
			name: "return_requests_requested_by_fkey"
		}),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [employees.id],
			name: "return_requests_approved_by_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [employees.id],
			name: "return_requests_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [employees.id],
			name: "return_requests_updated_by_fkey"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [employees.id],
			name: "return_requests_deleted_by_fkey"
		}),
]);

export const resourceBookings = pgTable("resource_bookings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assetId: uuid("asset_id").notNull(),
	bookedByEmployeeId: uuid("booked_by_employee_id").notNull(),
	departmentId: uuid("department_id"),
	startTime: timestamp("start_time", { withTimezone: true, mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { withTimezone: true, mode: 'string' }).notNull(),
	status: bookingStatus().default('upcoming').notNull(),
	cancelledReason: text("cancelled_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: uuid("updated_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: uuid("deleted_by"),
}, (table) => [
	index("idx_bookings_asset_time").using("btree", table.assetId.asc().nullsLast().op("uuid_ops"), table.startTime.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_bookings_employee").using("btree", table.bookedByEmployeeId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_bookings_status").using("btree", table.status.asc().nullsLast().op("enum_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.assetId],
			foreignColumns: [assets.id],
			name: "resource_bookings_asset_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.bookedByEmployeeId],
			foreignColumns: [employees.id],
			name: "resource_bookings_booked_by_employee_id_fkey"
		}),
	foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departments.id],
			name: "resource_bookings_department_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [employees.id],
			name: "resource_bookings_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [employees.id],
			name: "resource_bookings_updated_by_fkey"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [employees.id],
			name: "resource_bookings_deleted_by_fkey"
		}),
	check("resource_bookings_check", sql`end_time > start_time`),
]);

export const maintenanceRequests = pgTable("maintenance_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assetId: uuid("asset_id").notNull(),
	raisedBy: uuid("raised_by").notNull(),
	issueTitle: text("issue_title"),
	issueDescription: text("issue_description").notNull(),
	priority: maintenancePriority().default('medium').notNull(),
	photoUrl: text("photo_url"),
	status: maintenanceStatus().default('pending').notNull(),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	technicianName: text("technician_name"),
	technicianAssignedAt: timestamp("technician_assigned_at", { withTimezone: true, mode: 'string' }),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
	resolutionNotes: text("resolution_notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: uuid("updated_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: uuid("deleted_by"),
}, (table) => [
	index("idx_maintenance_asset").using("btree", table.assetId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_maintenance_priority").using("btree", table.priority.asc().nullsLast().op("enum_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_maintenance_status").using("btree", table.status.asc().nullsLast().op("enum_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.assetId],
			foreignColumns: [assets.id],
			name: "maintenance_requests_asset_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.raisedBy],
			foreignColumns: [employees.id],
			name: "maintenance_requests_raised_by_fkey"
		}),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [employees.id],
			name: "maintenance_requests_approved_by_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [employees.id],
			name: "maintenance_requests_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [employees.id],
			name: "maintenance_requests_updated_by_fkey"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [employees.id],
			name: "maintenance_requests_deleted_by_fkey"
		}),
]);

export const auditCycles = pgTable("audit_cycles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	name: text().notNull(),
	scopeDepartmentId: uuid("scope_department_id"),
	scopeLocation: text("scope_location"),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	status: auditCycleStatus().default('planned').notNull(),
	closedBy: uuid("closed_by"),
	closedAt: timestamp("closed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: uuid("updated_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: uuid("deleted_by"),
}, (table) => [
	index("idx_audit_cycles_org").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_audit_cycles_status").using("btree", table.status.asc().nullsLast().op("enum_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "audit_cycles_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.scopeDepartmentId],
			foreignColumns: [departments.id],
			name: "audit_cycles_scope_department_id_fkey"
		}),
	foreignKey({
			columns: [table.closedBy],
			foreignColumns: [employees.id],
			name: "audit_cycles_closed_by_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [employees.id],
			name: "audit_cycles_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [employees.id],
			name: "audit_cycles_updated_by_fkey"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [employees.id],
			name: "audit_cycles_deleted_by_fkey"
		}),
	check("audit_cycles_check", sql`end_date >= start_date`),
]);

export const auditCycleAuditors = pgTable("audit_cycle_auditors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	auditCycleId: uuid("audit_cycle_id").notNull(),
	employeeId: uuid("employee_id").notNull(),
	assignedBy: uuid("assigned_by"),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: uuid("deleted_by"),
}, (table) => [
	uniqueIndex("uq_audit_cycle_auditor").using("btree", table.auditCycleId.asc().nullsLast().op("uuid_ops"), table.employeeId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.auditCycleId],
			foreignColumns: [auditCycles.id],
			name: "audit_cycle_auditors_audit_cycle_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "audit_cycle_auditors_employee_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedBy],
			foreignColumns: [employees.id],
			name: "audit_cycle_auditors_assigned_by_fkey"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [employees.id],
			name: "audit_cycle_auditors_deleted_by_fkey"
		}),
]);

export const auditItems = pgTable("audit_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	auditCycleId: uuid("audit_cycle_id").notNull(),
	assetId: uuid("asset_id").notNull(),
	status: auditItemStatus().default('pending').notNull(),
	notes: text(),
	verifiedBy: uuid("verified_by"),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: uuid("updated_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: uuid("deleted_by"),
}, (table) => [
	index("idx_audit_items_asset").using("btree", table.assetId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_audit_items_cycle").using("btree", table.auditCycleId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_audit_items_status").using("btree", table.status.asc().nullsLast().op("enum_ops")).where(sql`((status = ANY (ARRAY['missing'::audit_item_status, 'damaged'::audit_item_status])) AND (deleted_at IS NULL))`),
	uniqueIndex("uq_audit_items_cycle_asset").using("btree", table.auditCycleId.asc().nullsLast().op("uuid_ops"), table.assetId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.auditCycleId],
			foreignColumns: [auditCycles.id],
			name: "audit_items_audit_cycle_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assetId],
			foreignColumns: [assets.id],
			name: "audit_items_asset_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.verifiedBy],
			foreignColumns: [employees.id],
			name: "audit_items_verified_by_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [employees.id],
			name: "audit_items_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [employees.id],
			name: "audit_items_updated_by_fkey"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [employees.id],
			name: "audit_items_deleted_by_fkey"
		}),
]);

export const discrepancyReports = pgTable("discrepancy_reports", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	auditItemId: uuid("audit_item_id").notNull(),
	auditCycleId: uuid("audit_cycle_id").notNull(),
	assetId: uuid("asset_id").notNull(),
	discrepancyType: auditItemStatus("discrepancy_type").notNull(),
	notes: text(),
	resolvedBy: uuid("resolved_by"),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
	resolutionStatus: text("resolution_status").default('open').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: uuid("updated_by"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: uuid("deleted_by"),
}, (table) => [
	index("idx_discrepancy_asset").using("btree", table.assetId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	index("idx_discrepancy_cycle").using("btree", table.auditCycleId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.auditItemId],
			foreignColumns: [auditItems.id],
			name: "discrepancy_reports_audit_item_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.auditCycleId],
			foreignColumns: [auditCycles.id],
			name: "discrepancy_reports_audit_cycle_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assetId],
			foreignColumns: [assets.id],
			name: "discrepancy_reports_asset_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.resolvedBy],
			foreignColumns: [employees.id],
			name: "discrepancy_reports_resolved_by_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [employees.id],
			name: "discrepancy_reports_created_by_fkey"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [employees.id],
			name: "discrepancy_reports_updated_by_fkey"
		}),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [employees.id],
			name: "discrepancy_reports_deleted_by_fkey"
		}),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	employeeId: uuid("employee_id").notNull(),
	type: text().notNull(),
	message: text().notNull(),
	relatedEntityType: text("related_entity_type"),
	relatedEntityId: uuid("related_entity_id"),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedBy: uuid("deleted_by"),
}, (table) => [
	index("idx_notifications_employee_unread").using("btree", table.employeeId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`((is_read = false) AND (deleted_at IS NULL))`),
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "notifications_employee_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [employees.id],
			name: "notifications_deleted_by_fkey"
		}),
]);

export const activityLogsDefault = pgTable("activity_logs_default", {
	id: uuid().defaultRandom().notNull(),
	organizationId: uuid("organization_id").notNull(),
	employeeId: uuid("employee_id"),
	action: text().notNull(),
	entityType: text("entity_type").notNull(),
	entityId: uuid("entity_id"),
	details: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("activity_logs_default_entity_type_entity_id_idx").using("btree", table.entityType.asc().nullsLast().op("uuid_ops"), table.entityId.asc().nullsLast().op("uuid_ops")),
	index("activity_logs_default_organization_id_created_at_idx").using("btree", table.organizationId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "activity_logs_employee_id_fkey"
		}),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "activity_logs_organization_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.id, table.createdAt], name: "activity_logs_default_pkey"}),
]);
