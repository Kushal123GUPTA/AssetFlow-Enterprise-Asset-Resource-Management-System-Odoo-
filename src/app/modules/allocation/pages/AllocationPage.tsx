"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Input, Select, message } from "antd";
import { Plus, RefreshCw, Search } from "lucide-react";
import { useAllocationStore } from "../hooks/useAllocation";
import AllocationTable from "../components/AllocationTable";
import AllocationFormModal from "../components/AllocationForm";
import ReturnFormModal from "../components/ReturnForm";
import type { Allocation } from "../types/allocation.types";

export default function AllocationPage() {
  const {
    allocations,
    loading,
    filters,
    employees,
    departments,
    setFilters,
    fetchAllocations,
    fetchOptions,
    allocateAsset,
    returnAsset,
  } = useAllocationStore();

  const [allocModalOpen, setAllocModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);

  useEffect(() => {
    fetchAllocations();
    fetchOptions();
  }, [fetchAllocations, fetchOptions]);

  const handleFilterChange = useCallback((patch: any) => {
    const nextFilters = { ...filters, ...patch };
    setFilters(nextFilters);
    fetchAllocations(nextFilters);
  }, [filters, setFilters, fetchAllocations]);

  const handleAllocateSubmit = async (data: any) => {
    return await allocateAsset(data);
  };

  const handleReturnSubmit = async (data: any) => {
    return await returnAsset(data);
  };

  const handleTriggerReturn = (allocation: Allocation) => {
    setSelectedAllocation(allocation);
    setReturnModalOpen(true);
  };

  // Stats
  const activeCount = allocations.filter((a) => a.status === "active").length;
  const overdueCount = allocations.filter((a) => a.status === "overdue").length;
  const returnedCount = allocations.filter((a) => a.status === "returned").length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-200">Asset Allocations</h1>
          <p className="text-gray-500 text-sm mt-1">Track asset custody and return schedules</p>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<RefreshCw className="w-4 h-4" />} onClick={() => fetchAllocations()}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setAllocModalOpen(true)}
          >
            Allocate Asset
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Active Custody", value: activeCount, color: "bg-blue-50 border-blue-200", icon: "text-blue-600" },
          { label: "Overdue Return", value: overdueCount, color: "bg-red-50 border-red-200", icon: "text-red-600" },
          { label: "Returned Items", value: returnedCount, color: "bg-emerald-50 border-emerald-200", icon: "text-emerald-600" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border p-5 ${stat.color}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.icon}`}>{stat.value}</p>
          </div>
        ))}
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
          placeholder="Custody Status"
          value={filters.status || undefined}
          onChange={(val) => handleFilterChange({ status: val || '' })}
          allowClear
          className="!w-44"
          options={[
            { label: "Active", value: "active" },
            { label: "Overdue", value: "overdue" },
            { label: "Returned", value: "returned" },
          ]}
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
          allocations={allocations}
          loading={loading}
          onReturn={handleTriggerReturn}
        />
      </div>

      {/* Allocate Asset Modal */}
      <AllocationFormModal
        open={allocModalOpen}
        onClose={() => setAllocModalOpen(false)}
        onSubmit={handleAllocateSubmit}
        employees={employees}
        departments={departments}
      />

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
