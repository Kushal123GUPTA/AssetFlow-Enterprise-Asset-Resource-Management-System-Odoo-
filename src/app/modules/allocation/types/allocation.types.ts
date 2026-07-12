export type AllocationStatus = "active" | "returned" | "overdue";

export interface Allocation {
  id: string;
  organizationId: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  employeeId: string | null;
  employeeName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  allocatedBy: string;
  allocatedByName: string | null;
  allocatedAt: string;
  expectedReturnDate: string | null;
  actualReturnDate: string | null;
  status: AllocationStatus;
  notes: string | null;
  createdAt: string;
}

export interface AllocationFilters {
  search?: string;
  status?: AllocationStatus | "";
  type?: "employee" | "department" | "";
}

export interface EmployeeOption {
  id: string;
  name: string;
  email: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
}

/** Employee-scoped allocation list/detail (My Assets) */
export type MyAllocation = {
  allocationId: string;
  assetId: string;
  assetName: string;
  assetTag: string;
  serialNumber: string | null;
  condition: string | null;
  location: string | null;
  assetStatus: string;
  categoryName: string | null;
  allocatedAt: string;
  expectedReturnDate: string | null;
  allocationStatus: string;
  photoUrl: string | null;
  documents: unknown;
  isOverdue: boolean;
  displayStatus: string;
};

export type MyAllocationDetail = MyAllocation & {
  customFields: unknown;
  allocationHistory: Array<{
    id: string;
    allocatedAt: string;
    expectedReturnDate: string | null;
    actualReturnDate: string | null;
    status: string;
    returnConditionNotes: string | null;
  }>;
  maintenanceHistory: Array<{
    id: string;
    issueTitle: string | null;
    issueDescription: string;
    priority: string;
    status: string;
    createdAt: string;
    rejectionReason: string | null;
    resolutionNotes: string | null;
  }>;
};

export type ReturnRequest = {
  id: string;
  assetId: string;
  allocationId: string;
  reason: string | null;
  conditionNotes: string | null;
  preferredReturnDate: string | null;
  remarks: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  assetName: string;
  assetTag: string;
};

/** Employee-initiated transfer request (My Requests) */
export type TransferRequest = {
  id: string;
  assetId: string;
  currentAllocationId: string | null;
  toEmployeeId: string | null;
  toDepartmentId: string | null;
  reason: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  assetName: string;
  assetTag: string;
  toEmployeeName: string | null;
  toDepartmentName: string | null;
};

export type TransferTargets = {
  employees: Array<{
    id: string;
    name: string;
    email: string;
    departmentId: string | null;
  }>;
  departments: Array<{ id: string; name: string }>;
};
