import { fetchJson, ApiError } from "@/lib/fetchJson";
import type { MyMaintenanceRequest } from "../types/maintenance.types";

export type AllocatedAssetOption = {
  assetId: string;
  assetName: string;
  assetTag: string;
  allocationId: string;
};

export class MaintenanceService {
  async listAllocatedAssets() {
    const res = await fetchJson<{ data: AllocatedAssetOption[] }>(
      "/api/maintenance/allocated-assets"
    );
    return res.data;
  }

  async listMine() {
    const res = await fetchJson<{ data: MyMaintenanceRequest[] }>(
      "/api/maintenance/mine"
    );
    return res.data;
  }

  async getMine(requestId: string) {
    const res = await fetchJson<{ data: MyMaintenanceRequest }>(
      `/api/maintenance/mine/${requestId}`
    );
    return res.data;
  }

  async create(body: {
    assetId: string;
    issueTitle?: string;
    issueDescription: string;
    priority?: string;
    photoUrl?: string;
  }) {
    const res = await fetchJson<{ data: MyMaintenanceRequest }>(
      "/api/maintenance/mine",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    return res.data;
  }

  async uploadPhoto(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/maintenance/upload", {
      method: "POST",
      body: form,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(
        typeof payload?.error === "string" ? payload.error : "Upload failed",
        res.status
      );
    }
    return (payload as { data: { url: string } }).data.url;
  }
}

export const maintenanceService = new MaintenanceService();
