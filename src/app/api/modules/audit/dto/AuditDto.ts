export interface CreateAuditCycleDto {
  name: string;
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string;
  scopeDepartmentId?: string | null;
  scopeLocation?: string | null;
}

export interface UpdateAuditCycleDto {
  name?: string;
  startDate?: string;
  endDate?: string;
  scopeDepartmentId?: string | null;
  scopeLocation?: string | null;
  status?: "planned" | "in_progress" | "closed";
}
