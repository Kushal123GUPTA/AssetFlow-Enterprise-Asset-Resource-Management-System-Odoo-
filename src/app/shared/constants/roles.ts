export const ROLES = [
  "ADMIN",
  "ASSET_MANAGER",
  "DEPARTMENT_HEAD",
  "EMPLOYEE",
] as const;

export type Role = (typeof ROLES)[number];
