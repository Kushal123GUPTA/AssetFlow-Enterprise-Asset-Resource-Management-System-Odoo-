// ── Department ──────────────────────────────────────────────────────────────
export interface Department {
  id: string;
  organizationId: string;
  name: string;
  parentDepartmentId: string | null;
  headEmployeeId: string | null;
  headEmployeeName?: string | null;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentDto {
  name: string;
  parentDepartmentId?: string | null;
  headEmployeeId?: string | null;
}

export interface UpdateDepartmentDto extends Partial<CreateDepartmentDto> {
  status?: "active" | "inactive";
}

// ── Asset Category ───────────────────────────────────────────────────────────
export interface AssetCategory {
  id: string;
  organizationId: string;
  name: string;
  parentCategoryId: string | null;
  customFieldsSchema: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  parentCategoryId?: string | null;
  customFieldsSchema?: Record<string, unknown>;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

// ── Audit Cycle ──────────────────────────────────────────────────────────────
export interface AuditCycle {
  id: string;
  organizationId: string;
  name: string;
  scopeDepartmentId: string | null;
  scopeLocation: string | null;
  startDate: string;
  endDate: string;
  status: "planned" | "in_progress" | "closed";
  closedBy: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAuditCycleDto {
  name: string;
  startDate: string;
  endDate: string;
  scopeDepartmentId?: string | null;
  scopeLocation?: string | null;
}

export interface UpdateAuditCycleDto extends Partial<CreateAuditCycleDto> {
  status?: "planned" | "in_progress" | "closed";
}

// ── Employee ─────────────────────────────────────────────────────────────────
export type UserRole = "admin" | "asset_manager" | "department_head" | "employee";
export type UserStatus = "active" | "inactive";

export interface Employee {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  departmentId: string | null;
  departmentName?: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

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

// ── Analytics ────────────────────────────────────────────────────────────────
export interface AdminAnalytics {
  totalDepartments: number;
  totalCategories: number;
  totalEmployees: number;
  activeAuditCycles: number;
  totalAssets: number;
  activeAllocations: number;
  overdueAllocations: number;
  pendingMaintenance: number;
  openDiscrepancies: number;
  departmentUtilization: { departmentName: string; totalAssets: number; allocatedAssets: number; utilization: number }[];
  assetsByStatus: { status: string; count: number }[];
  recentActivity: { action: string; entityType: string; createdAt: string }[];
}
