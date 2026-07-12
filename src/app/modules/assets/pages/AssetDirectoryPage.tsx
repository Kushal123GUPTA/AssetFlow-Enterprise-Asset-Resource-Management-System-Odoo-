"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, message } from "antd";
import { Plus, Package, RefreshCw } from "lucide-react";
import { useAssetStore } from "../hooks/useAssets";
import AssetFilterBar from "../components/AssetFilters";
import AssetTable from "../components/AssetTable";
import AssetFormModal from "../components/AssetForm";
import AssetDetailsDrawer from "../components/AssetDetails";
import type { Asset, AssetFormData } from "../types";

export default function AssetDirectoryPage() {
  const {
    assets,
    loading,
    filters,
    categories,
    departments,
    setFilters,
    fetchAssets,
    fetchOptions,
    addAsset,
    updateAsset,
    deleteAsset,
  } = useAssetStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewAsset, setViewAsset] = useState<Asset | null>(null);

  useEffect(() => {
    fetchAssets();
    fetchOptions();
  }, [fetchAssets, fetchOptions]);

  // Debounced filter change
  const handleFilterChange = useCallback(
    (newFilters: typeof filters) => {
      setFilters(newFilters);
      fetchAssets(newFilters);
    },
    [setFilters, fetchAssets]
  );

  const handleAdd = async (data: AssetFormData) => {
    return await addAsset(data);
  };

  const handleEdit = async (data: AssetFormData) => {
    if (!editAsset) return false;
    return await updateAsset(editAsset.id, data);
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteAsset(id);
    if (ok) message.success("Asset deleted");
  };

  const handleView = (asset: Asset) => {
    setViewAsset(asset);
    setDetailsOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditAsset(asset);
    setFormOpen(true);
  };

  // Stats cards
  const totalAssets = assets.length;
  const availableCount = assets.filter((a) => a.status === "available").length;
  const allocatedCount = assets.filter((a) => a.status === "allocated").length;
  const maintenanceCount = assets.filter((a) => a.status === "under_maintenance").length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-200">Asset Registration & Directory</h1>
          <p className="text-gray-500 text-sm mt-1">Register, search, and manage all organizational assets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<RefreshCw className="w-4 h-4" />} onClick={() => fetchAssets()}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => { setEditAsset(null); setFormOpen(true); }}
          >
            Register Asset
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Assets", value: totalAssets, color: "bg-blue-50 border-blue-200", icon: "text-blue-600" },
          { label: "Available", value: availableCount, color: "bg-emerald-50 border-emerald-200", icon: "text-emerald-600" },
          { label: "Allocated", value: allocatedCount, color: "bg-violet-50 border-violet-200", icon: "text-violet-600" },
          { label: "Maintenance", value: maintenanceCount, color: "bg-amber-50 border-amber-200", icon: "text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border p-5 ${stat.color}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.icon}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-700 bg-gray-900 p-5">
        <AssetFilterBar
          filters={filters}
          categories={categories}
          departments={departments}
          onChange={handleFilterChange}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden">
        <AssetTable
          assets={assets}
          loading={loading}
          onView={handleView}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Register / Edit Modal */}
      <AssetFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditAsset(null); }}
        onSubmit={editAsset ? handleEdit : handleAdd}
        categories={categories}
        departments={departments}
        editAsset={editAsset}
      />

      {/* Details Drawer */}
      <AssetDetailsDrawer
        open={detailsOpen}
        asset={viewAsset}
        onClose={() => { setDetailsOpen(false); setViewAsset(null); }}
      />
    </div>
  );
}
