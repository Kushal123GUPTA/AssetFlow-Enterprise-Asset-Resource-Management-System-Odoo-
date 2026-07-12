import { NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { NotificationService } from "@/app/api/modules/notifications/services/NotificationService";

const service = new NotificationService();

/** GET /api/notifications/unread-count */
export async function GET() {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const unreadCount = await service.getUnreadCount(auth.employee.id);
    return NextResponse.json({ data: { unreadCount } });
  } catch (error) {
    console.error("GET /api/notifications/unread-count", error);
    return NextResponse.json({ error: "Failed to load unread count" }, { status: 500 });
  }
}
