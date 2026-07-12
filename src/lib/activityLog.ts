import { db } from "@/db";
import { activityLogsDefault } from "@/db/schema";

export type ActivityLogInput = {
  organizationId: string;
  employeeId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
};

/** Safe activity log insert — never throws to callers. */
export async function logActivity(input: ActivityLogInput): Promise<void> {
  try {
    if (!input.organizationId || !input.action?.trim() || !input.entityType?.trim()) {
      return;
    }
    await db.insert(activityLogsDefault).values({
      organizationId: input.organizationId,
      employeeId: input.employeeId ?? null,
      action: input.action.trim(),
      entityType: input.entityType.trim(),
      entityId: input.entityId ?? null,
      details: input.details ?? {},
    });
  } catch (error) {
    console.error("logActivity failed:", error);
  }
}
