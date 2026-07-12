"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Input, Select } from "antd";
import { RefreshCw, Search } from "lucide-react";
import { useAllocationStore } from "../hooks/useAllocation";
import AllocationTable from "../components/AllocationTable";
import ReturnFormModal from "../components/ReturnForm";
import type { Allocation } from "../types/allocation.types";

export default function ReturnsPage() {
  const {
    allocations,
    loading,
    filters,
    setFilters,
    fetchAllocations,
    fetchOptions,
    returnAsset,
  } = useAllocationStore();

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);

  // Focus returns page only on active/overdue allocations that need processing
  useEffect(() => {
    const activeFilters = { ...filters, status: "active" as const };
    setFilters(activeFilters);
    fetchAllocations(activeFilters);
    fetchOptions();
  }, [fetchAllocations, fetchOptions, setFilters]);

  const handleFilterChange = useCallback((patch: any) => {
    const nextFilters = { ...filters, ...patch };
    setFilters(nextFilters);
    fetchAllocations(nextFilters);
  }, [filters, setFilters, fetchAllocations]);

  const handleReturnSubmit = async (data: any) => {
    return await returnAsset(data);
  };

  const handleTriggerReturn = (allocation: Allocation) => {
    setSelectedAllocation(allocation);
    setReturnModalOpen(true);
  };

  // Only display active or overdue allocations in this returns screen
  const returnableAllocations = allocations.filter((a) => a.status === "active" || a.status === "overdue");

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-200">Asset Returns</h1>
          <p className="text-gray-500 text-sm mt-1">Process check-ins and log condition details for returned resources</p>
        </div>
        <Button icon={<RefreshCw className="w-4 h-4" />} onClick={() => fetchAllocations()}>
          Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-gray-700 bg-gray-900 p-5 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by asset tag, name, or custodian..."
          prefix={<Search className="w-4 h-4 text-gray-400" />}
          value={filters.search || ""}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          allowClear
          className="!w-72"
        />
        <Select
          placeholder="Custody Type"
          value={filters.type || undefined}
          onChange={(val) => handleFilterChange({ type: val || '' })}
          allowClear
          className="!w-44"
          options={[
            { label: "Employee", value: "employee" },
            { label: "Department", value: "department" },
          ]}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden">
        <AllocationTable
          allocations={returnableAllocations}
          loading={loading}
          onReturn={handleTriggerReturn}
        />
      </div>

      {/* Return Asset Modal */}
      <ReturnFormModal
        open={returnModalOpen}
        onClose={() => { setReturnModalOpen(false); setSelectedAllocation(null); }}
        onSubmit={handleReturnSubmit}
        allocation={selectedAllocation}
      />
    </div>
  );
}
