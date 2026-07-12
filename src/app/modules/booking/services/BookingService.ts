import { fetchJson } from "@/lib/fetchJson";
import type { BookableResource, BookingSlot, MyBooking } from "../types/booking.types";

export class BookingService {
  async listResources(search?: string) {
    const q = search ? `?q=${encodeURIComponent(search)}` : "";
    const res = await fetchJson<{ data: BookableResource[] }>(`/api/booking/resources${q}`);
    return res.data;
  }

  async listSlots(assetId: string) {
    const res = await fetchJson<{ data: BookingSlot[] }>(
      `/api/booking/resources/${assetId}/slots`
    );
    return res.data;
  }

  async listMine() {
    const res = await fetchJson<{ data: MyBooking[] }>("/api/booking/mine");
    return res.data;
  }

  async create(body: { assetId: string; startTime: string; endTime: string }) {
    const res = await fetchJson<{ data: MyBooking }>("/api/booking/mine", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return res.data;
  }

  async cancel(bookingId: string, reason?: string) {
    const res = await fetchJson<{ data: MyBooking }>(`/api/booking/${bookingId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "cancel", reason }),
    });
    return res.data;
  }

  async reschedule(
    bookingId: string,
    body: { startTime: string; endTime: string }
  ) {
    const res = await fetchJson<{ data: MyBooking }>(`/api/booking/${bookingId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "reschedule", ...body }),
    });
    return res.data;
  }
}

export const bookingService = new BookingService();
