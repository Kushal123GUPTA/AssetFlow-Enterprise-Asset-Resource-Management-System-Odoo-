import type { AssetStatus } from "../types";

export const ASSET_STATUS_OPTIONS: { label: string; value: AssetStatus }[] = [
  { label: "Available", value: "available" },
  { label: "Allocated", value: "allocated" },
  { label: "Reserved", value: "reserved" },
  { label: "Under Maintenance", value: "under_maintenance" },
  { label: "Lost", value: "lost" },
  { label: "Retired", value: "retired" },
  { label: "Disposed", value: "disposed" },
];

export const ASSET_STATUS_COLORS: Record<AssetStatus, { bg: string; text: string; dot: string }> = {
  available: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  allocated: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  reserved: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  under_maintenance: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  lost: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  retired: { bg: "bg-gray-600", text: "text-gray-400", dot: "bg-gray-500" },
  disposed: { bg: "bg-gray-600", text: "text-gray-400", dot: "bg-gray-500" },
};

export const CONDITION_OPTIONS = [
  { label: "New", value: "new" },
  { label: "Good", value: "good" },
  { label: "Fair", value: "fair" },
  { label: "Poor", value: "poor" },
  { label: "Damaged", value: "damaged" },
];
