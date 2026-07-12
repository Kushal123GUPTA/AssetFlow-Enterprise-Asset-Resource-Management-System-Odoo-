import { create } from "zustand";
import axios from "axios";

export interface AuditCycle {
  id: string;
  name: string;
  scopeDepartmentId: string | null;
  departmentName: string | null;
  scopeLocation: string | null;
  startDate: string;
  endDate: string;
  status: "planned" | "in_progress" | "closed";
  createdAt: string;
  metrics: {
    total: number;
    verified: number;
    missing: number;
    damaged: number;
    pending: number;
    completionRate: number;
  };
}

export interface AuditItem {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  assetLocation: string;
  status: "pending" | "verified" | "missing" | "damaged";
  notes: string | null;
  verifiedBy: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
}

export interface AuditCycleDetails {
  cycle: {
    id: string;
    name: string;
    scopeDepartmentId: string | null;
    scopeLocation: string | null;
    startDate: string;
    endDate: string;
    status: "planned" | "in_progress" | "closed";
  };
  auditors: Array<{ employeeId: string; employeeName: string }>;
  items: AuditItem[];
}

interface AuditStore {
  cycles: AuditCycle[];
  currentDetails: AuditCycleDetails | null;
  loading: boolean;
  error: string | null;

  fetchCycles: () => Promise<void>;
  fetchDetails: (auditCycleId: string) => Promise<void>;
  createCycle: (data: {
    name: string;
    scopeDepartmentId?: string;
    scopeLocation?: string;
    startDate: string;
    endDate: string;
    auditorIds?: string[];
  }) => Promise<boolean>;
  verifyItem: (data: {
    auditItemId: string;
    status: string;
    notes?: string;
  }) => Promise<boolean>;
  closeCycle: (auditCycleId: string) => Promise<boolean>;
}

export const useAuditStore = create<AuditStore>((set, get) => ({
  cycles: [],
  currentDetails: null,
  loading: false,
  error: null,

  fetchCycles: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post("/api/assets/audit/list");
      set({ cycles: res.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to fetch audit cycles", loading: false });
    }
  },

  fetchDetails: async (auditCycleId) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post("/api/assets/audit/details", { auditCycleId });
      set({ currentDetails: res.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to fetch audit details", loading: false });
    }
  },

  createCycle: async (data) => {
    try {
      await axios.post("/api/assets/audit/create", data);
      await get().fetchCycles();
      return true;
    } catch (err: any) {
      console.error("Failed to create audit cycle:", err);
      return false;
    }
  },

  verifyItem: async (data) => {
    try {
      await axios.post("/api/assets/audit/verify-item", data);
      if (get().currentDetails?.cycle?.id) {
        await get().fetchDetails(get().currentDetails!.cycle.id);
      }
      return true;
    } catch (err: any) {
      console.error("Failed to verify audit item:", err);
      return false;
    }
  },

  closeCycle: async (auditCycleId) => {
    try {
      await axios.post("/api/assets/audit/close", { auditCycleId });
      await get().fetchCycles();
      if (get().currentDetails?.cycle?.id === auditCycleId) {
        await get().fetchDetails(auditCycleId);
      }
      return true;
    } catch (err: any) {
      console.error("Failed to close audit cycle:", err);
      return false;
    }
  },
}));
