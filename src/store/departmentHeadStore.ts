import { create } from "zustand";
import axios from "axios";

const API = {
  DASHBOARD: "/api/department-head/dashboard",
  ASSETS: "/api/department-head/assets",
  REQUESTS_PENDING: "/api/department-head/requests/pending",
  REQUESTS_APPROVE: "/api/department-head/requests/approve",
  REQUESTS_REJECT: "/api/department-head/requests/reject",
  BOOKINGS_RESOURCES: "/api/department-head/bookings/resources",
  BOOKINGS_BY_RESOURCE: "/api/department-head/bookings/by-resource",
  BOOKINGS_CREATE: "/api/department-head/bookings/create",
  BOOKINGS_CANCEL: "/api/department-head/bookings/cancel",
};

interface DepartmentHeadState {
  dashboardData: {
    kpis: {
      deptAssets: number;
      allocatedMembers: number;
      pendingRequests: number;
      activeBookings: number;
    };
    pendingRequests: any[];
  } | null;
  assetsList: any[];
  pendingRequestsList: any[];
  bookableResources: any[];
  resourceBookings: any[];
  isLoading: boolean;
  error: string | null;

  fetchDashboardData: () => Promise<void>;
  fetchAssetsList: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  approveRequest: (requestId: string) => Promise<boolean>;
  rejectRequest: (requestId: string, reason?: string) => Promise<boolean>;
  fetchBookableResources: () => Promise<void>;
  fetchResourceBookings: (assetId: string) => Promise<void>;
  createBooking: (assetId: string, startTime: string, endTime: string) => Promise<string | null>;
  cancelBooking: (bookingId: string, reason?: string) => Promise<boolean>;
  clearError: () => void;
}

export const useDepartmentHeadStore = create<DepartmentHeadState>((set, get) => ({
  dashboardData: null,
  assetsList: [],
  pendingRequestsList: [],
  bookableResources: [],
  resourceBookings: [],
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(API.DASHBOARD);
      set({ dashboardData: response.data.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Failed to fetch dashboard data",
        isLoading: false,
      });
    }
  },

  fetchAssetsList: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(API.ASSETS);
      set({ assetsList: response.data.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Failed to fetch assets list",
        isLoading: false,
      });
    }
  },

  fetchPendingRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(API.REQUESTS_PENDING);
      set({ pendingRequestsList: response.data.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Failed to fetch pending requests",
        isLoading: false,
      });
    }
  },

  approveRequest: async (requestId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(API.REQUESTS_APPROVE, { requestId });
      await get().fetchPendingRequests();
      await get().fetchDashboardData();
      return true;
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Failed to approve request",
        isLoading: false,
      });
      return false;
    }
  },

  rejectRequest: async (requestId: string, reason?: string) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(API.REQUESTS_REJECT, { requestId, reason });
      await get().fetchPendingRequests();
      await get().fetchDashboardData();
      return true;
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Failed to reject request",
        isLoading: false,
      });
      return false;
    }
  },

  fetchBookableResources: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(API.BOOKINGS_RESOURCES);
      set({ bookableResources: response.data.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Failed to fetch bookable resources",
        isLoading: false,
      });
    }
  },

  fetchResourceBookings: async (assetId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(API.BOOKINGS_BY_RESOURCE, { assetId });
      set({ resourceBookings: response.data.data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Failed to fetch resource bookings",
        isLoading: false,
      });
    }
  },

  createBooking: async (assetId: string, startTime: string, endTime: string) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(API.BOOKINGS_CREATE, { assetId, startTime, endTime });
      await get().fetchResourceBookings(assetId);
      await get().fetchDashboardData();
      return null;
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Failed to create booking";
      set({ error: errMsg, isLoading: false });
      return errMsg;
    }
  },

  cancelBooking: async (bookingId: string, reason?: string) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(API.BOOKINGS_CANCEL, { bookingId, reason });
      await get().fetchDashboardData();
      return true;
    } catch (err: any) {
      set({
        error: err.response?.data?.error || "Failed to cancel booking",
        isLoading: false,
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
