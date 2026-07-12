import { create } from "zustand";
import axios from "axios";

export interface MaintenanceRequest {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  raisedBy: string;
  raisedByName: string;
  issueDescription: string;
  priority: "low" | "medium" | "high" | "critical";
  photoUrl: string | null;
  status: "pending" | "approved" | "rejected" | "technician_assigned" | "in_progress" | "resolved";
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  technicianName: string | null;
  technicianAssignedAt: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
}

interface MaintenanceStore {
  requests: MaintenanceRequest[];
  loading: boolean;
  error: string | null;

  fetchRequests: (filters?: { status?: string; priority?: string }) => Promise<void>;
  raiseRequest: (data: {
    assetId: string;
    issueDescription: string;
    priority: string;
    photoUrl?: string;
  }) => Promise<boolean>;
  approveRequest: (requestId: string) => Promise<boolean>;
  rejectRequest: (requestId: string, rejectionReason: string) => Promise<boolean>;
  assignTechnician: (requestId: string, technicianName: string) => Promise<boolean>;
  resolveRequest: (data: {
    requestId: string;
    resolutionNotes?: string;
    assetCondition?: string;
    nextAssetStatus?: string;
  }) => Promise<boolean>;
}

export const useMaintenanceStore = create<MaintenanceStore>((set, get) => ({
  requests: [],
  loading: false,
  error: null,

  fetchRequests: async (filters) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post("/api/assets/maintenance/list", filters || {});
      set({ requests: res.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to fetch maintenance list", loading: false });
    }
  },

  raiseRequest: async (data) => {
    try {
      await axios.post("/api/assets/maintenance/raise", data);
      await get().fetchRequests();
      return true;
    } catch (err: any) {
      console.error("Failed to raise maintenance request:", err);
      return false;
    }
  },

  approveRequest: async (requestId) => {
    try {
      await axios.post("/api/assets/maintenance/approve", { requestId });
      await get().fetchRequests();
      return true;
    } catch (err: any) {
      console.error("Failed to approve maintenance request:", err);
      return false;
    }
  },

  rejectRequest: async (requestId, rejectionReason) => {
    try {
      await axios.post("/api/assets/maintenance/reject", { requestId, rejectionReason });
      await get().fetchRequests();
      return true;
    } catch (err: any) {
      console.error("Failed to reject maintenance request:", err);
      return false;
    }
  },

  assignTechnician: async (requestId, technicianName) => {
    try {
      await axios.post("/api/assets/maintenance/assign", { requestId, technicianName });
      await get().fetchRequests();
      return true;
    } catch (err: any) {
      console.error("Failed to assign technician:", err);
      return false;
    }
  },

  resolveRequest: async (data) => {
    try {
      await axios.post("/api/assets/maintenance/resolve", data);
      await get().fetchRequests();
      return true;
    } catch (err: any) {
      console.error("Failed to resolve maintenance request:", err);
      return false;
    }
  },
}));
