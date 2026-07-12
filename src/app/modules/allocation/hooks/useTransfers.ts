import { create } from "zustand";
import axios from "axios";

export interface TransferRequest {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  currentAllocationId: string | null;
  fromEmployeeId: string | null;
  fromEmployeeName: string | null;
  fromDepartmentId: string | null;
  fromDepartmentName: string | null;
  toEmployeeId: string | null;
  toEmployeeName: string | null;
  toDepartmentId: string | null;
  toDepartmentName: string | null;
  requestedBy: string;
  requestedByName: string;
  status: "requested" | "approved" | "rejected";
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  createdAt: string;
}

interface TransferStore {
  transfers: TransferRequest[];
  loadingTransfers: boolean;
  custodyLoading: boolean;

  fetchTransfers: (status?: string) => Promise<void>;
  createTransferRequest: (data: {
    assetId: string;
    toEmployeeId?: string;
    toDepartmentId?: string;
  }) => Promise<boolean>;
  approveTransfer: (transferId: string) => Promise<boolean>;
  rejectTransfer: (transferId: string) => Promise<boolean>;
  fetchCustodyStatus: (assetId: string) => Promise<{
    id: string;
    employeeName: string | null;
    departmentName: string | null;
    expectedReturnDate: string | null;
  } | null>;
}

export const useTransferStore = create<TransferStore>((set, get) => ({
  transfers: [],
  loadingTransfers: false,
  custodyLoading: false,

  fetchTransfers: async (status) => {
    set({ loadingTransfers: true });
    try {
      const res = await axios.post("/api/assets/transfers", { status });
      set({ transfers: res.data.data, loadingTransfers: false });
    } catch (err: any) {
      console.error("Failed to fetch transfer requests:", err);
      set({ loadingTransfers: false });
    }
  },

  createTransferRequest: async (data) => {
    try {
      await axios.post("/api/assets/transfer-request", data);
      await get().fetchTransfers();
      return true;
    } catch (err: any) {
      console.error("Failed to create transfer request:", err);
      return false;
    }
  },

  approveTransfer: async (transferId) => {
    try {
      await axios.post("/api/assets/transfer-approve", { transferId });
      await get().fetchTransfers();
      return true;
    } catch (err: any) {
      console.error("Failed to approve transfer request:", err);
      return false;
    }
  },

  rejectTransfer: async (transferId) => {
    try {
      await axios.post("/api/assets/transfer-reject", { transferId });
      await get().fetchTransfers();
      return true;
    } catch (err: any) {
      console.error("Failed to reject transfer request:", err);
      return false;
    }
  },

  fetchCustodyStatus: async (assetId) => {
    set({ custodyLoading: true });
    try {
      const res = await axios.post("/api/assets/custody-status", { assetId });
      set({ custodyLoading: false });
      return res.data.data;
    } catch (err: any) {
      console.error("Failed to fetch custody status:", err);
      set({ custodyLoading: false });
      return null;
    }
  },
}));
