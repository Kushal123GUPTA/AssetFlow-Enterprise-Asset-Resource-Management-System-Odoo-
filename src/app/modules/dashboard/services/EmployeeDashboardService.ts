import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  assetAllocations,
  returnRequests,
  transferRequests,
} from "@/db/schema";
import { AllocationService } from "@/app/api/modules/allocation/services/AllocationService";
import { BookingService } from "@/app/api/modules/booking/services/BookingService";
import { MaintenanceService } from "@/app/api/modules/maintenance/services/MaintenanceService";

export class EmployeeDashboardService {
  async getSummary(employeeId: string) {
    const allocationService = new AllocationService();
    const bookingService = new BookingService();
    const maintenanceService = new MaintenanceService();

    const today = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();

    const [allocations, bookings, maintenanceCount, pendingReturns, pendingTransfers, upcomingReturns] =
      await Promise.all([
        allocationService.listMine(employeeId),
        bookingService.listMine(employeeId),
        maintenanceService.countActiveMine(employeeId),
        db
          .select({ id: returnRequests.id })
          .from(returnRequests)
          .where(
            and(
              eq(returnRequests.requestedBy, employeeId),
              eq(returnRequests.status, "requested"),
              isNull(returnRequests.deletedAt)
            )
          ),
        db
          .select({ id: transferRequests.id })
          .from(transferRequests)
          .where(
            and(
              eq(transferRequests.requestedBy, employeeId),
              eq(transferRequests.status, "requested"),
              isNull(transferRequests.deletedAt)
            )
          ),
        db
          .select({ id: assetAllocations.id })
          .from(assetAllocations)
          .where(
            and(
              eq(assetAllocations.employeeId, employeeId),
              eq(assetAllocations.status, "active"),
              isNull(assetAllocations.deletedAt),
              gte(assetAllocations.expectedReturnDate, today),
              sql`${assetAllocations.expectedReturnDate} <= (${today}::date + interval '7 days')`
            )
          ),
      ]);

    const overdueCount = allocations.filter((a) => a.isOverdue).length;

    return {
      allocatedAssetsCount: allocations.length,
      upcomingReturnCount: upcomingReturns.length,
      overdueCount,
      upcomingBookingsCount: bookings.filter(
        (b) => b.status === "upcoming" || b.status === "ongoing"
      ).length,
      activeMaintenanceCount: maintenanceCount,
      pendingReturnRequestCount: pendingReturns.length,
      pendingTransferRequestCount: pendingTransfers.length,
      recentAssets: allocations.slice(0, 5),
      upcomingBookings: bookings
        .filter((b) => b.status === "upcoming" || b.status === "ongoing")
        .slice(0, 5),
      asOf: nowIso,
    };
  }
}
