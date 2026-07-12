/**
 * Unit + DB integration tests for notification endpoints/helpers.
 *
 * Usage:
 *   npx tsx scripts/test-notifications.ts
 *
 * Requires DATABASE_URL in .env for the integration section.
 * Unit section always runs.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import assert from "node:assert/strict";
import {
  isUuid,
  matchesFilterTab,
  typesForFilterTab,
} from "../src/lib/notificationTypes";

let passed = 0;
let failed = 0;

function check(name: string, fn: () => void | Promise<void>) {
  return (async () => {
    try {
      await fn();
      passed += 1;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      failed += 1;
      console.error(`  ✗ ${name}`);
      console.error(err);
    }
  })();
}

async function runUnitTests() {
  console.log("\n== Unit: notificationTypes ==");

  await check("isUuid accepts valid uuid", () => {
    assert.equal(isUuid("550e8400-e29b-41d4-a716-446655440000"), true);
  });

  await check("isUuid rejects garbage", () => {
    assert.equal(isUuid("not-a-uuid"), false);
    assert.equal(isUuid(""), false);
    assert.equal(isUuid(null), false);
    assert.equal(isUuid(123), false);
  });

  await check("filter tabs map to type sets", () => {
    assert.equal(typesForFilterTab("all"), null);
    assert.ok(typesForFilterTab("bookings")?.includes("booking_reminder"));
    assert.ok(typesForFilterTab("alerts")?.includes("overdue_return"));
    assert.ok(typesForFilterTab("approvals")?.includes("transfer_approved"));
  });

  await check("matchesFilterTab classifies types", () => {
    assert.equal(matchesFilterTab("booking_confirmed", "bookings"), true);
    assert.equal(matchesFilterTab("booking_confirmed", "alerts"), false);
    assert.equal(matchesFilterTab("overdue_return", "alerts"), true);
    assert.equal(matchesFilterTab("asset_assigned", "all"), true);
  });
}

async function runIntegrationTests() {
  console.log("\n== Integration: NotificationService + DB ==");

  if (!process.env.DATABASE_URL) {
    console.log("  ⊘ Skipped (DATABASE_URL not set)");
    return;
  }

  const { db } = await import("../src/db");
  const { employees, notifications } = await import("../src/db/schema");
  const { eq, and, isNull, like } = await import("drizzle-orm");
  const { NotificationService } = await import(
    "../src/app/api/modules/notifications/services/NotificationService"
  );

  const service = new NotificationService();
  const marker = `notif-test-${Date.now()}`;

  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(isNull(employees.deletedAt))
    .limit(1);

  if (!employee) {
    console.log("  ⊘ Skipped (no employees in database)");
    return;
  }

  const createdIds: string[] = [];

  try {
    await check("create notification", async () => {
      const row = await service.createForEmployee({
        employeeId: employee.id,
        type: "booking_confirmed",
        message: `${marker} booking confirmed`,
        relatedEntityType: "booking",
        relatedEntityId: "550e8400-e29b-41d4-a716-446655440000",
      });
      assert.ok(row.id);
      assert.equal(row.isRead, false);
      createdIds.push(row.id);
    });

    await check("create second notification (alert)", async () => {
      const row = await service.createForEmployee({
        employeeId: employee.id,
        type: "overdue_return",
        message: `${marker} overdue`,
      });
      createdIds.push(row.id);
    });

    await check("listMine returns created rows", async () => {
      const res = await service.listMine(employee.id, { limit: 50 });
      const mine = res.data.filter((n) => n.message.includes(marker));
      assert.ok(mine.length >= 2);
      assert.ok(res.unreadCount >= 2);
    });

    await check("listMine filter bookings", async () => {
      const res = await service.listMine(employee.id, {
        types: typesForFilterTab("bookings"),
        limit: 50,
      });
      const mine = res.data.filter((n) => n.message.includes(marker));
      assert.ok(mine.every((n) => n.type.startsWith("booking_")));
      assert.ok(mine.some((n) => n.type === "booking_confirmed"));
    });

    await check("getUnreadCount >= 2", async () => {
      const count = await service.getUnreadCount(employee.id);
      assert.ok(count >= 2);
    });

    await check("markRead flips isRead", async () => {
      const id = createdIds[0];
      const updated = await service.markRead(employee.id, id);
      assert.ok(updated);
      assert.equal(updated!.isRead, true);
    });

    await check("markRead with bad id returns null", async () => {
      const updated = await service.markRead(employee.id, "not-uuid");
      assert.equal(updated, null);
    });

    await check("markAllRead clears remaining unread test rows", async () => {
      const before = await service.getUnreadCount(employee.id);
      const updatedCount = await service.markAllRead(employee.id);
      assert.ok(updatedCount >= 1);
      const after = await service.getUnreadCount(employee.id);
      assert.equal(after, 0);
      assert.ok(before >= after);
    });

    await check("softDelete hides notification from list", async () => {
      const id = createdIds[1];
      const deleted = await service.softDelete(employee.id, id);
      assert.ok(deleted);
      const res = await service.listMine(employee.id, { limit: 100 });
      assert.equal(
        res.data.some((n) => n.id === id),
        false
      );
    });

    await check("softDelete unknown uuid returns null", async () => {
      const deleted = await service.softDelete(
        employee.id,
        "550e8400-e29b-41d4-a716-446655440099"
      );
      assert.equal(deleted, null);
    });
  } finally {
    // Cleanup any leftover test notifications
    if (createdIds.length > 0) {
      for (const id of createdIds) {
        await db
          .update(notifications)
          .set({
            deletedAt: new Date().toISOString(),
            deletedBy: employee.id,
          })
          .where(eq(notifications.id, id));
      }
    }
    await db
      .update(notifications)
      .set({
        deletedAt: new Date().toISOString(),
        deletedBy: employee.id,
      })
      .where(
        and(
          eq(notifications.employeeId, employee.id),
          like(notifications.message, `${marker}%`),
          isNull(notifications.deletedAt)
        )
      );
  }
}

async function main() {
  console.log("AssetFlow notification endpoint tests");
  await runUnitTests();
  await runIntegrationTests();
  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
