import { db } from "@/db";
import {
  departments,
  assetCategories,
  employees,
  roleAssignmentLog,
} from "@/db/schema";
import { eq, isNull, and, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from "../dto/DepartmentDto";
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../dto/CategoryDto";
import type {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  UpdateEmployeeRoleDto,
} from "../dto/EmployeeDto";

// ── Departments ──────────────────────────────────────────────────────────────

export async function getDepartments(organizationId: string) {
  return db
    .select({
      id: departments.id,
      organizationId: departments.organizationId,
      name: departments.name,
      parentDepartmentId: departments.parentDepartmentId,
      headEmployeeId: departments.headEmployeeId,
      headEmployeeName: employees.name,
      status: departments.status,
      createdAt: departments.createdAt,
      updatedAt: departments.updatedAt,
    })
    .from(departments)
    .leftJoin(employees, eq(departments.headEmployeeId, employees.id))
    .where(
      and(
        eq(departments.organizationId, organizationId),
        isNull(departments.deletedAt)
      )
    )
    .orderBy(departments.name);
}

export async function getDepartmentById(id: string, organizationId: string) {
  const rows = await db
    .select()
    .from(departments)
    .where(
      and(
        eq(departments.id, id),
        eq(departments.organizationId, organizationId),
        isNull(departments.deletedAt)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function createDepartment(
  organizationId: string,
  dto: CreateDepartmentDto,
  createdBy: string
) {
  const [row] = await db
    .insert(departments)
    .values({
      organizationId,
      name: dto.name.trim(),
      parentDepartmentId: dto.parentDepartmentId ?? null,
      headEmployeeId: dto.headEmployeeId ?? null,
      createdBy,
      updatedBy: createdBy,
    })
    .returning();
  return row;
}

export async function updateDepartment(
  id: string,
  organizationId: string,
  dto: UpdateDepartmentDto,
  updatedBy: string
) {
  const [row] = await db
    .update(departments)
    .set({ ...dto, updatedBy })
    .where(
      and(
        eq(departments.id, id),
        eq(departments.organizationId, organizationId),
        isNull(departments.deletedAt)
      )
    )
    .returning();
  return row ?? null;
}

export async function softDeleteDepartment(
  id: string,
  organizationId: string,
  deletedBy: string
) {
  const [row] = await db
    .update(departments)
    .set({ deletedAt: new Date().toISOString(), deletedBy })
    .where(
      and(
        eq(departments.id, id),
        eq(departments.organizationId, organizationId),
        isNull(departments.deletedAt)
      )
    )
    .returning({ id: departments.id });
  return row ?? null;
}

// ── Asset Categories ─────────────────────────────────────────────────────────

export async function getCategories(organizationId: string) {
  return db
    .select()
    .from(assetCategories)
    .where(
      and(
        eq(assetCategories.organizationId, organizationId),
        isNull(assetCategories.deletedAt)
      )
    )
    .orderBy(assetCategories.name);
}

export async function getCategoryById(id: string, organizationId: string) {
  const rows = await db
    .select()
    .from(assetCategories)
    .where(
      and(
        eq(assetCategories.id, id),
        eq(assetCategories.organizationId, organizationId),
        isNull(assetCategories.deletedAt)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function createCategory(
  organizationId: string,
  dto: CreateCategoryDto,
  createdBy: string
) {
  const [row] = await db
    .insert(assetCategories)
    .values({
      organizationId,
      name: dto.name.trim(),
      parentCategoryId: dto.parentCategoryId ?? null,
      customFieldsSchema: dto.customFieldsSchema ?? {},
      createdBy,
      updatedBy: createdBy,
    })
    .returning();
  return row;
}

export async function updateCategory(
  id: string,
  organizationId: string,
  dto: UpdateCategoryDto,
  updatedBy: string
) {
  const [row] = await db
    .update(assetCategories)
    .set({ ...dto, updatedBy })
    .where(
      and(
        eq(assetCategories.id, id),
        eq(assetCategories.organizationId, organizationId),
        isNull(assetCategories.deletedAt)
      )
    )
    .returning();
  return row ?? null;
}

export async function softDeleteCategory(
  id: string,
  organizationId: string,
  deletedBy: string
) {
  const [row] = await db
    .update(assetCategories)
    .set({ deletedAt: new Date().toISOString(), deletedBy })
    .where(
      and(
        eq(assetCategories.id, id),
        eq(assetCategories.organizationId, organizationId),
        isNull(assetCategories.deletedAt)
      )
    )
    .returning({ id: assetCategories.id });
  return row ?? null;
}

// ── Employees ────────────────────────────────────────────────────────────────

export async function getEmployees(organizationId: string) {
  return db
    .select({
      id: employees.id,
      organizationId: employees.organizationId,
      name: employees.name,
      email: employees.email,
      departmentId: employees.departmentId,
      role: employees.role,
      status: employees.status,
      createdAt: employees.createdAt,
      updatedAt: employees.updatedAt,
    })
    .from(employees)
    .where(
      and(
        eq(employees.organizationId, organizationId),
        isNull(employees.deletedAt)
      )
    )
    .orderBy(employees.name);
}

export async function getEmployeeById(id: string, organizationId: string) {
  const rows = await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.id, id),
        eq(employees.organizationId, organizationId),
        isNull(employees.deletedAt)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function createEmployee(
  organizationId: string,
  dto: CreateEmployeeDto,
  createdBy: string
) {
  const passwordHash = await bcrypt.hash(dto.password, 10);
  const [row] = await db
    .insert(employees)
    .values({
      organizationId,
      name: dto.name.trim(),
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      departmentId: dto.departmentId ?? null,
      role: dto.role ?? "employee",
      createdBy,
      updatedBy: createdBy,
    })
    .returning({
      id: employees.id,
      name: employees.name,
      email: employees.email,
      role: employees.role,
      departmentId: employees.departmentId,
      status: employees.status,
      createdAt: employees.createdAt,
      updatedAt: employees.updatedAt,
    });
  return row;
}

export async function updateEmployee(
  id: string,
  organizationId: string,
  dto: UpdateEmployeeDto,
  updatedBy: string
) {
  const [row] = await db
    .update(employees)
    .set({ ...dto, updatedBy })
    .where(
      and(
        eq(employees.id, id),
        eq(employees.organizationId, organizationId),
        isNull(employees.deletedAt)
      )
    )
    .returning();
  return row ?? null;
}

export async function updateEmployeeRole(
  id: string,
  organizationId: string,
  dto: UpdateEmployeeRoleDto,
  changedBy: string
) {
  // Fetch current role for audit log
  const current = await getEmployeeById(id, organizationId);
  if (!current) return null;

  const [updated] = await db
    .update(employees)
    .set({ role: dto.role, updatedBy: changedBy })
    .where(
      and(
        eq(employees.id, id),
        eq(employees.organizationId, organizationId),
        isNull(employees.deletedAt)
      )
    )
    .returning();

  // Write audit log
  if (updated) {
    await db.insert(roleAssignmentLog).values({
      employeeId: id,
      oldRole: current.role,
      newRole: dto.role,
      changedBy,
    });
  }

  return updated ?? null;
}

export async function softDeleteEmployee(
  id: string,
  organizationId: string,
  deletedBy: string
) {
  const [row] = await db
    .update(employees)
    .set({ deletedAt: new Date().toISOString(), deletedBy })
    .where(
      and(
        eq(employees.id, id),
        eq(employees.organizationId, organizationId),
        isNull(employees.deletedAt)
      )
    )
    .returning({ id: employees.id });
  return row ?? null;
}
