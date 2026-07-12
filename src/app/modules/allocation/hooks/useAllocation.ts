import { create } from "zustand";
import axios from "axios";
import type { Allocation, AllocationFilters, EmployeeOption, DepartmentOption } from "../types/allocation.types";

const API = {
  GET: "/api/assets/allocations",
  ALLOCATE: "/api/assets/allocate",
  RETURN: "/api/assets/return",
  OPTIONS: "/api/assets/allocation-options",
};

interface AllocationStore {
  allocations: Allocation[];
  loading: boolean;
  error: string | null;
  employees: EmployeeOption[];
  departments: DepartmentOption[];
  optionsLoaded: boolean;
  filters: AllocationFilters;

  setFilters: (filters: AllocationFilters) => void;
  fetchAllocations: (filters?: AllocationFilters) => Promise<void>;
  fetchOptions: () => Promise<void>;
  allocateAsset: (data: {
    assetId: string;
    employeeId?: string;
    departmentId?: string;
    expectedReturnDate?: string;
    notes?: string;
  }) => Promise<boolean>;
  returnAsset: (data: {
    allocationId: string;
    actualReturnDate: string;
    condition: string;
    checkInNotes?: string;
  }) => Promise<boolean>;
}

export const useAllocationStore = create<AllocationStore>((set, get) => ({
  allocations: [],
  loading: false,
  error: null,
  employees: [],
  departments: [],
  optionsLoaded: false,
  filters: {},

  setFilters: (filters) => set({ filters }),

  fetchAllocations: async (filters) => {
    set({ loading: true, error: null });
    try {
      const f = filters ?? get().filters;
      const res = await axios.post(API.GET, f);
      set({ allocations: res.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to fetch allocations", loading: false });
    }
  },

  fetchOptions: async () => {
    if (get().optionsLoaded) return;
    try {
      const res = await axios.post(API.OPTIONS, {});
      set({
        employees: res.data.data.employees,
        departments: res.data.data.departments,
        optionsLoaded: true,
      });
    } catch (err: any) {
      console.error("Failed to fetch allocation options:", err);
    }
  },

  allocateAsset: async (data) => {
    try {
      await axios.post(API.ALLOCATE, data);
      // Refresh the allocations list after successful allocation
      await get().fetchAllocations();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to allocate asset" });
      return false;
    }
  },

  returnAsset: async (data) => {
    try {
      await axios.post(API.RETURN, data);
      // Refresh allocations list after successful return
      await get().fetchAllocations();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to return asset" });
      return false;
    }
  },
}));
