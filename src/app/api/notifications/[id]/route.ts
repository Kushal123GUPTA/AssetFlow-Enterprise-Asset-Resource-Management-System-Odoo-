import { NextRequest, NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { NotificationService } from "@/app/api/modules/notifications/services/NotificationService";
import { isUuid } from "@/lib/notificationTypes";

const service = new NotificationService();

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/notifications/[id] — soft-delete own notification */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid notification id" }, { status: 400 });
    }

    const deleted = await service.softDelete(auth.employee.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    return NextResponse.json({ data: { ok: true, id: deleted.id } });
  } catch (error) {
    console.error("DELETE /api/notifications/[id]", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}

/** PATCH /api/notifications/[id] — mark this notification read */
export async function PATCH(_req: NextRequest, ctx: Ctx) {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await ctx.params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid notification id" }, { status: 400 });
    }

    const updated = await service.markRead(auth.employee.id, id);
    if (!updated) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/notifications/[id]", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
