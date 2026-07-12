export const NOTIFICATION_TYPES = [
  "asset_assigned",
  "maintenance_approved",
  "maintenance_rejected",
  "maintenance_technician_assigned",
  "maintenance_in_progress",
  "maintenance_resolved",
  "booking_confirmed",
  "booking_cancelled",
  "booking_reminder",
  "transfer_approved",
  "overdue_return",
  "audit_discrepancy_flagged",
  "audit_cycle_closed",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationFilterTab = "all" | "alerts" | "approvals" | "bookings";

const ALERT_TYPES = new Set<string>([
  "overdue_return",
  "audit_discrepancy_flagged",
  "audit_cycle_closed",
  "maintenance_rejected",
]);

const APPROVAL_TYPES = new Set<string>([
  "maintenance_approved",
  "transfer_approved",
  "maintenance_technician_assigned",
  "maintenance_in_progress",
  "maintenance_resolved",
  "asset_assigned",
]);

const BOOKING_TYPES = new Set<string>([
  "booking_confirmed",
  "booking_cancelled",
  "booking_reminder",
]);

export function typesForFilterTab(tab: NotificationFilterTab): string[] | null {
  if (tab === "all") return null;
  if (tab === "alerts") return [...ALERT_TYPES];
  if (tab === "approvals") return [...APPROVAL_TYPES];
  if (tab === "bookings") return [...BOOKING_TYPES];
  return null;
}

export function matchesFilterTab(type: string, tab: NotificationFilterTab): boolean {
  if (tab === "all") return true;
  const types = typesForFilterTab(tab);
  return types ? types.includes(type) : true;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
