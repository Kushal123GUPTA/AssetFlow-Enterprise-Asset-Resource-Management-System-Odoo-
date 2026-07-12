import { NextRequest, NextResponse } from "next/server";
import { requireSessionEmployee } from "@/lib/apiAuth";
import { NotificationService } from "@/app/api/modules/notifications/services/NotificationService";
import {
  isUuid,
  typesForFilterTab,
  type NotificationFilterTab,
} from "@/lib/notificationTypes";

const service = new NotificationService();

const FILTER_TABS = new Set<NotificationFilterTab>([
  "all",
  "alerts",
  "approvals",
  "bookings",
]);

/**
 * GET /api/notifications/mine
 * Query: unread=1|true, filter=all|alerts|approvals|bookings, type=, limit=, offset=
 */
export async function GET(req: NextRequest) {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = req.nextUrl;
    const unreadRaw = searchParams.get("unread");
    const unreadOnly = unreadRaw === "1" || unreadRaw === "true";
    const filterRaw = (searchParams.get("filter") ?? "all").toLowerCase();
    const filter = FILTER_TABS.has(filterRaw as NotificationFilterTab)
      ? (filterRaw as NotificationFilterTab)
      : "all";
    const type = searchParams.get("type")?.trim() || null;
    const limit = Number(searchParams.get("limit") ?? 100);
    const offset = Number(searchParams.get("offset") ?? 0);

    const typesFromFilter = typesForFilterTab(filter);
    const types = type ? [type] : typesFromFilter;

    const result = await service.listMine(auth.employee.id, {
      unreadOnly,
      types,
      limit: Number.isFinite(limit) ? limit : 100,
      offset: Number.isFinite(offset) ? offset : 0,
    });

    return NextResponse.json({
      data: result.data,
      meta: {
        total: result.total,
        unreadCount: result.unreadCount,
        limit: Math.min(Math.max(Math.floor(Number.isFinite(limit) ? limit : 100), 1), 200),
        offset: Math.max(Math.floor(Number.isFinite(offset) ? offset : 0), 0),
        filter,
      },
    });
  } catch (error) {
    console.error("GET /api/notifications/mine", error);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications/mine
 * Body:
 *  { action: "mark_read", notificationId }
 *  { action: "mark_all_read" }
 *  { action: "soft_delete", notificationId }
 */
export async function PATCH(req: Request) {
  const auth = await requireSessionEmployee();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const action = String((body as { action?: string }).action ?? "");

    if (action === "mark_all_read") {
      const updatedCount = await service.markAllRead(auth.employee.id);
      return NextResponse.json({ data: { ok: true, updatedCount } });
    }

    if (action === "mark_read") {
      const notificationId = (body as { notificationId?: string }).notificationId;
      if (!isUuid(notificationId)) {
        return NextResponse.json(
          { error: "Valid notificationId is required" },
          { status: 400 }
        );
      }
      const updated = await service.markRead(auth.employee.id, notificationId);
      if (!updated) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }
      return NextResponse.json({ data: updated });
    }

    if (action === "soft_delete") {
      const notificationId = (body as { notificationId?: string }).notificationId;
      if (!isUuid(notificationId)) {
        return NextResponse.json(
          { error: "Valid notificationId is required" },
          { status: 400 }
        );
      }
      const deleted = await service.softDelete(auth.employee.id, notificationId);
      if (!deleted) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }
      return NextResponse.json({ data: { ok: true, id: deleted.id } });
    }

    return NextResponse.json(
      {
        error:
          "Unknown action. Use mark_read, mark_all_read, or soft_delete.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/notifications/mine", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
