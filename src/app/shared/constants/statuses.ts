export const ASSET_STATUSES = [
  "AVAILABLE",
  "ALLOCATED",
  "RESERVED",
  "UNDER_MAINTENANCE",
  "LOST",
  "RETIRED",
  "DISPOSED",
] as const;

export const ALLOCATION_STATUSES = [
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "RETURNED",
  "OVERDUE",
] as const;

export const BOOKING_STATUSES = [
  "UPCOMING",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
] as const;

export const MAINTENANCE_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "TECHNICIAN_ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
] as const;

export const AUDIT_VERIFICATION_STATUSES = [
  "PENDING",
  "VERIFIED",
  "MISSING",
  "DAMAGED",
] as const;

export type AssetStatus = (typeof ASSET_STATUSES)[number];
export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];
export type AuditVerificationStatus = (typeof AUDIT_VERIFICATION_STATUSES)[number];
