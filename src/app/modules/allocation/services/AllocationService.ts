import { fetchJson } from "@/lib/fetchJson";
import type {
  MyAllocation,
  MyAllocationDetail,
  ReturnRequest,
  TransferRequest,
  TransferTargets,
} from "../types/allocation.types";

export class AllocationService {
  async listMine() {
    const res = await fetchJson<{ data: MyAllocation[] }>("/api/allocation/mine");
    return res.data;
  }

  async getMine(allocationId: string) {
    const res = await fetchJson<{ data: MyAllocationDetail }>(
      `/api/allocation/mine/${allocationId}`
    );
    return res.data;
  }

  async listReturns() {
    const res = await fetchJson<{ data: ReturnRequest[] }>("/api/allocation/returns");
    return res.data;
  }

  async createReturn(body: {
    allocationId: string;
    reason?: string;
    conditionNotes?: string;
    preferredReturnDate?: string;
    attachmentUrl?: string;
    remarks?: string;
  }) {
    const res = await fetchJson<{ data: ReturnRequest }>("/api/allocation/returns", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return res.data;
  }

  async listTransfers() {
    const res = await fetchJson<{ data: TransferRequest[] }>("/api/allocation/transfers");
    return res.data;
  }

  async createTransfer(body: {
    allocationId: string;
    toEmployeeId?: string;
    toDepartmentId?: string;
    reason?: string;
    notes?: string;
  }) {
    const res = await fetchJson<{ data: TransferRequest }>("/api/allocation/transfers", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return res.data;
  }

  async listTransferTargets() {
    const res = await fetchJson<{ data: TransferTargets }>(
      "/api/allocation/transfer-targets"
    );
    return res.data;
  }
}

export const allocationService = new AllocationService();
