import { NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { dispatchNotificationJobs } from "@/lib/notificationJobs";

/**
 * POST /api/notifications/jobs/dispatch
 * Runs overdue-return + booking-reminder producers for the caller's org.
 * Callable by any authenticated user (typically admin/AM or a cron hitting with session).
 */
export async function POST() {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const result = await dispatchNotificationJobs(auth.employee.organizationId);
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("POST /api/notifications/jobs/dispatch", error);
    return NextResponse.json({ error: "Failed to dispatch notification jobs" }, { status: 500 });
  }
}

/** GET also supported for easy manual/cron probes */
export async function GET() {
  return POST();
}
