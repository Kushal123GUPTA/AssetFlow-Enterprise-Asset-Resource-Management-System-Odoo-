export type AllocationStatus = 'active' | 'returned' | 'overdue';

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
  status?: AllocationStatus | '';
  type?: 'employee' | 'department' | '';
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
