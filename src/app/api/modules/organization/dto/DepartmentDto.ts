// ── Department DTOs ──────────────────────────────────────────────────────────
export interface CreateDepartmentDto {
  name: string;
  parentDepartmentId?: string | null;
  headEmployeeId?: string | null;
}

export interface UpdateDepartmentDto {
  name?: string;
  parentDepartmentId?: string | null;
  headEmployeeId?: string | null;
  status?: "active" | "inactive";
}
