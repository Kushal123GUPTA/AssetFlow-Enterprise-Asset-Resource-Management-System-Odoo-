import { create } from "zustand";
import axios from "axios";
import type { Asset, AssetFormData, AssetFilters, CategoryOption, DepartmentOption } from "../types";

const API = {
  GET: "/api/assets",
  ADD: "/api/assets/add",
  UPDATE: "/api/assets/update",
  DELETE: "/api/assets/delete",
  DETAILS: "/api/assets/details",
  OPTIONS: "/api/assets/options",
};

interface AssetStore {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  categories: CategoryOption[];
  departments: DepartmentOption[];
  optionsLoaded: boolean;
  selectedAsset: Asset | null;
  assetDetails: {
    asset: Asset | null;
    allocations: any[];
    maintenance: any[];
    statusHistory: any[];
  } | null;
  detailsLoading: boolean;
  filters: AssetFilters;

  setFilters: (filters: AssetFilters) => void;
  fetchAssets: (filters?: AssetFilters) => Promise<void>;
  fetchOptions: () => Promise<void>;
  addAsset: (data: AssetFormData) => Promise<boolean>;
  updateAsset: (id: string, data: Partial<AssetFormData & { status: string }>) => Promise<boolean>;
  deleteAsset: (id: string) => Promise<boolean>;
  fetchAssetDetails: (id: string) => Promise<void>;
  setSelectedAsset: (asset: Asset | null) => void;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  loading: false,
  error: null,
  categories: [],
  departments: [],
  optionsLoaded: false,
  selectedAsset: null,
  assetDetails: null,
  detailsLoading: false,
  filters: {},

  setFilters: (filters) => set({ filters }),

  fetchAssets: async (filters) => {
    set({ loading: true, error: null });
    try {
      const f = filters ?? get().filters;
      const res = await axios.post(API.GET, f);
      set({ assets: res.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to fetch assets", loading: false });
    }
  },

  fetchOptions: async () => {
    if (get().optionsLoaded) return;
    try {
      const res = await axios.post(API.OPTIONS, {});
      set({
        categories: res.data.data.categories,
        departments: res.data.data.departments,
        optionsLoaded: true,
      });
    } catch (err: any) {
      console.error("Failed to fetch options:", err);
    }
  },

  addAsset: async (data) => {
    try {
      const res = await axios.post(API.ADD, data);
      const newAsset = res.data.data;
      set((state) => ({ assets: [newAsset, ...state.assets] }));
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to add asset" });
      return false;
    }
  },

  updateAsset: async (id, data) => {
    try {
      const res = await axios.post(API.UPDATE, { id, ...data });
      const updated = res.data.data;
      set((state) => ({
        assets: state.assets.map((a) => (a.id === id ? { ...a, ...updated } : a)),
      }));
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to update asset" });
      return false;
    }
  },

  deleteAsset: async (id) => {
    try {
      await axios.post(API.DELETE, { id });
      set((state) => ({ assets: state.assets.filter((a) => a.id !== id) }));
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Failed to delete asset" });
      return false;
    }
  },

  fetchAssetDetails: async (id) => {
    set({ detailsLoading: true });
    try {
      const res = await axios.post(API.DETAILS, { id });
      set({ assetDetails: res.data.data, detailsLoading: false });
    } catch (err: any) {
      set({ detailsLoading: false });
      console.error("Failed to fetch asset details:", err);
    }
  },

  setSelectedAsset: (asset) => set({ selectedAsset: asset }),
}));
