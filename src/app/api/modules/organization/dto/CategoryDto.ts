// ── Category DTOs ────────────────────────────────────────────────────────────
export interface CreateCategoryDto {
  name: string;
  parentCategoryId?: string | null;
  customFieldsSchema?: Record<string, unknown>;
}

export interface UpdateCategoryDto {
  name?: string;
  parentCategoryId?: string | null;
  customFieldsSchema?: Record<string, unknown>;
}
