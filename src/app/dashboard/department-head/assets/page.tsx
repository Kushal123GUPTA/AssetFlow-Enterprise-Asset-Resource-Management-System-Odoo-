"use client";

import { useEffect, useState } from "react";
import { Package, Search, RotateCcw } from "lucide-react";
import { useDepartmentHeadStore } from "@/store/departmentHeadStore";
import { Table, Input, Select, Tag, Button, Spin } from "antd";

const STATUS_COLOR_MAP: Record<string, string> = {
  available: "green",
  allocated: "blue",
  reserved: "orange",
  under_maintenance: "warning",
  lost: "error",
  retired: "default",
  disposed: "default",
};

export default function DepartmentAssetsPage() {
  const { assetsList, isLoading, fetchAssetsList } = useDepartmentHeadStore();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchAssetsList();
  }, [fetchAssetsList]);

  const filteredAssets = assetsList.filter((asset) => {
    const matchesSearch =
      asset.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      asset.assetTag?.toLowerCase().includes(searchText.toLowerCase()) ||
      (asset.serialNumber &&
        asset.serialNumber.toLowerCase().includes(searchText.toLowerCase()));

    const matchesStatus = statusFilter ? asset.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: "Asset Tag",
      dataIndex: "assetTag",
      key: "assetTag",
      className: "whitespace-normal break-words leading-tight",
      render: (text: string) => <span className="font-bold text-[#10b981]">{text}</span>,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      className: "whitespace-normal break-words leading-tight font-bold text-gray-100",
    },
    {
      title: "Serial Number",
      dataIndex: "serialNumber",
      key: "serialNumber",
      className: "whitespace-normal break-words leading-tight text-gray-200 font-medium",
      render: (text: string) => text || "—",
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      className: "whitespace-normal break-words leading-tight text-gray-200 font-medium",
      render: (text: string) => text || "—",
    },
    {
      title: "Condition",
      dataIndex: "condition",
      key: "condition",
      className: "whitespace-normal break-words leading-tight text-gray-200 font-medium",
      render: (text: string) => text || "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text: string) => (
        <Tag color={STATUS_COLOR_MAP[text] || "default"} className="capitalize font-semibold">
          {text?.replace("_", " ")}
        </Tag>
      ),
    },
    {
      title: "Currently Held By",
      key: "holder",
      className: "whitespace-normal break-words leading-tight",
      render: (_: any, record: any) => {
        if (record.allocatedEmployeeName) {
          return <span className="text-gray-100 font-semibold">👤 {record.allocatedEmployeeName}</span>;
        }
        if (record.allocatedDepartmentId) {
          return <span className="text-gray-200 font-semibold">🏢 Department Pool</span>;
        }
        return <span className="text-gray-500 italic">—</span>;
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-500" />
            Department Assets
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            View all assets assigned to or currently allocated within your department.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchAssetsList()}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-none text-sm font-semibold transition-all disabled:opacity-50 !bg-gray-800/80 !text-gray-200 hover:!bg-gray-700/80 cursor-pointer"
        >
          <RotateCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-900 border border-gray-800 p-5 rounded-2xl">
        <div>
          <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Search</label>
          <Input
            prefix={<Search className="w-4 h-4 text-gray-400 mr-1.5" />}
            placeholder="Search by tag, name, or serial..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="rounded-xl w-full"
            size="large"
          />
        </div>
        <div>
          <label className="block text-gray-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Status</label>
          <Select
            placeholder="Filter by status"
            allowClear
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            className="w-full rounded-xl"
            style={{ width: "100%" }}
            size="large"
            options={Object.keys(STATUS_COLOR_MAP).map((status) => ({
              label: status.replace("_", " ").toUpperCase(),
              value: status,
            }))}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Spin />
          </div>
        ) : (
          <Table
            dataSource={filteredAssets}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
            bordered={false}
            className="overflow-hidden"
          />
        )}
      </div>
    </div>
  );
}
