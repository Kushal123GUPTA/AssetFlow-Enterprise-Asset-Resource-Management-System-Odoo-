export type AssetStatus = 'available' | 'allocated' | 'reserved' | 'under_maintenance' | 'lost' | 'retired' | 'disposed';

export interface Asset {
  id: string;
  organizationId: string;
  assetTag: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  serialNumber: string | null;
  qrCode: string | null;
  acquisitionDate: string | null;
  acquisitionCost: string | null;
  condition: string | null;
  location: string | null;
  departmentId: string | null;
  departmentName?: string;
  isBookable: boolean;
  status: AssetStatus;
  customFields: Record<string, unknown>;
  photoUrl: string | null;
  documents: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface AssetFormData {
  name: string;
  categoryId: string;
  serialNumber?: string;
  acquisitionDate?: string;
  acquisitionCost?: string;
  condition?: string;
  location?: string;
  departmentId?: string;
  isBookable?: boolean;
  photoUrl?: string;
}

export interface AssetFilters {
  search?: string;
  status?: AssetStatus | '';
  categoryId?: string;
  departmentId?: string;
  location?: string;
  isBookable?: boolean | '';
}

export interface AssetStatusHistoryItem {
  id: string;
  fromStatus: AssetStatus | null;
  toStatus: AssetStatus;
  changedBy: string | null;
  changedByName?: string;
  reason: string | null;
  changedAt: string;
}

export interface AssetAllocationHistoryItem {
  id: string;
  employeeName?: string;
  departmentName?: string;
  allocatedByName?: string;
  allocatedAt: string;
  expectedReturnDate: string | null;
  actualReturnDate: string | null;
  status: string;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
}
