// ── Employee DTOs ────────────────────────────────────────────────────────────
export type UserRole = "admin" | "asset_manager" | "department_head" | "employee";
export type UserStatus = "active" | "inactive";

export interface CreateEmployeeDto {
  name: string;
  email: string;
  password: string;
  departmentId?: string | null;
  role?: UserRole;
}

export interface UpdateEmployeeDto {
  name?: string;
  departmentId?: string | null;
  status?: UserStatus;
}

export interface UpdateEmployeeRoleDto {
  role: UserRole;
}
