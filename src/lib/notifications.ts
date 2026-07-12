import { db } from "@/db";
import { notifications } from "@/db/schema";

export type NotifyInput = {
  employeeId: string;
  type: string;
  message: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
};

/** Fire-and-forget safe insert — never throws to callers. */
export async function notifyEmployee(input: NotifyInput): Promise<void> {
  try {
    if (!input.employeeId || !input.message?.trim()) return;
    await db.insert(notifications).values({
      employeeId: input.employeeId,
      type: input.type,
      message: input.message.trim(),
      relatedEntityType: input.relatedEntityType ?? null,
      relatedEntityId: input.relatedEntityId ?? null,
      isRead: false,
    });
  } catch (error) {
    console.error("notifyEmployee failed:", error);
  }
}

export async function notifyEmployees(
  employeeIds: string[],
  payload: Omit<NotifyInput, "employeeId">
): Promise<void> {
  const unique = [...new Set(employeeIds.filter(Boolean))];
  await Promise.all(unique.map((employeeId) => notifyEmployee({ ...payload, employeeId })));
}
