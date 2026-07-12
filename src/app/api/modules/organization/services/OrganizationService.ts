import * as repo from "../repositories/OrganizationRepository";
import type { CreateDepartmentDto, UpdateDepartmentDto } from "../dto/DepartmentDto";
import type { CreateCategoryDto, UpdateCategoryDto } from "../dto/CategoryDto";
import type { CreateEmployeeDto, UpdateEmployeeDto, UpdateEmployeeRoleDto } from "../dto/EmployeeDto";

// ── Departments ──────────────────────────────────────────────────────────────

export async function listDepartments(organizationId: string) {
  return repo.getDepartments(organizationId);
}

export async function getDepartment(id: string, organizationId: string) {
  const dept = await repo.getDepartmentById(id, organizationId);
  if (!dept) throw new Error("Department not found");
  return dept;
}

export async function addDepartment(
  organizationId: string,
  dto: CreateDepartmentDto,
  createdBy: string
) {
  if (!dto.name?.trim()) throw new Error("Department name is required");
  return repo.createDepartment(organizationId, dto, createdBy);
}

export async function editDepartment(
  id: string,
  organizationId: string,
  dto: UpdateDepartmentDto,
  updatedBy: string
) {
  const existing = await repo.getDepartmentById(id, organizationId);
  if (!existing) throw new Error("Department not found");
  return repo.updateDepartment(id, organizationId, dto, updatedBy);
}

export async function removeDepartment(
  id: string,
  organizationId: string,
  deletedBy: string
) {
  const existing = await repo.getDepartmentById(id, organizationId);
  if (!existing) throw new Error("Department not found");
  return repo.softDeleteDepartment(id, organizationId, deletedBy);
}

// ── Asset Categories ─────────────────────────────────────────────────────────

export async function listCategories(organizationId: string) {
  return repo.getCategories(organizationId);
}

export async function getCategory(id: string, organizationId: string) {
  const cat = await repo.getCategoryById(id, organizationId);
  if (!cat) throw new Error("Category not found");
  return cat;
}

export async function addCategory(
  organizationId: string,
  dto: CreateCategoryDto,
  createdBy: string
) {
  if (!dto.name?.trim()) throw new Error("Category name is required");
  return repo.createCategory(organizationId, dto, createdBy);
}

export async function editCategory(
  id: string,
  organizationId: string,
  dto: UpdateCategoryDto,
  updatedBy: string
) {
  const existing = await repo.getCategoryById(id, organizationId);
  if (!existing) throw new Error("Category not found");
  return repo.updateCategory(id, organizationId, dto, updatedBy);
}

export async function removeCategory(
  id: string,
  organizationId: string,
  deletedBy: string
) {
  const existing = await repo.getCategoryById(id, organizationId);
  if (!existing) throw new Error("Category not found");
  return repo.softDeleteCategory(id, organizationId, deletedBy);
}

// ── Employees ────────────────────────────────────────────────────────────────

export async function listEmployees(organizationId: string) {
  return repo.getEmployees(organizationId);
}

export async function getEmployee(id: string, organizationId: string) {
  const emp = await repo.getEmployeeById(id, organizationId);
  if (!emp) throw new Error("Employee not found");
  return emp;
}

export async function addEmployee(
  organizationId: string,
  dto: CreateEmployeeDto,
  createdBy: string
) {
  if (!dto.name?.trim()) throw new Error("Name is required");
  if (!dto.email?.trim()) throw new Error("Email is required");
  if (!dto.password || dto.password.length < 8)
    throw new Error("Password must be at least 8 characters");
  return repo.createEmployee(organizationId, dto, createdBy);
}

export async function editEmployee(
  id: string,
  organizationId: string,
  dto: UpdateEmployeeDto,
  updatedBy: string
) {
  const existing = await repo.getEmployeeById(id, organizationId);
  if (!existing) throw new Error("Employee not found");
  return repo.updateEmployee(id, organizationId, dto, updatedBy);
}

export async function changeEmployeeRole(
  id: string,
  organizationId: string,
  dto: UpdateEmployeeRoleDto,
  changedBy: string
) {
  const validRoles = ["admin", "asset_manager", "department_head", "employee"];
  if (!validRoles.includes(dto.role)) throw new Error("Invalid role");
  const existing = await repo.getEmployeeById(id, organizationId);
  if (!existing) throw new Error("Employee not found");
  return repo.updateEmployeeRole(id, organizationId, dto, changedBy);
}

export async function removeEmployee(
  id: string,
  organizationId: string,
  deletedBy: string
) {
  const existing = await repo.getEmployeeById(id, organizationId);
  if (!existing) throw new Error("Employee not found");
  return repo.softDeleteEmployee(id, organizationId, deletedBy);
}
