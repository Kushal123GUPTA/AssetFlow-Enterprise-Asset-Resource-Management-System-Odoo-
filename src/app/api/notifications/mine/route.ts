import { NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { NotificationService } from "@/app/api/modules/notifications/services/NotificationService";

const service = new NotificationService();

export async function GET() {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const data = await service.listMine(auth.employee.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/notifications/mine", error);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    if (body?.action === "mark_all_read") {
      await service.markAllRead(auth.employee.id);
      return NextResponse.json({ data: { ok: true } });
    }
    if (body?.action === "mark_read" && body?.notificationId) {
      const updated = await service.markRead(auth.employee.id, body.notificationId);
      if (!updated) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }
      return NextResponse.json({ data: updated });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/notifications/mine", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
