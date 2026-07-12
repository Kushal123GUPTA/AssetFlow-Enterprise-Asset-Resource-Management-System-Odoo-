"use client";

import { useEffect, useState } from "react";
import { Package, Search, RotateCcw } from "lucide-react";
import { useDepartmentHeadStore } from "@/store/departmentHeadStore";
import { Table, Input, Select, Tag, Button, Spin, ConfigProvider, theme } from "antd";

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
      render: (text: string) => <span className="font-semibold text-emerald-400">{text}</span>,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      className: "whitespace-normal break-words leading-tight font-medium",
    },
    {
      title: "Serial Number",
      dataIndex: "serialNumber",
      key: "serialNumber",
      className: "whitespace-normal break-words leading-tight",
      render: (text: string) => text || "—",
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      className: "whitespace-normal break-words leading-tight",
      render: (text: string) => text || "—",
    },
    {
      title: "Condition",
      dataIndex: "condition",
      key: "condition",
      className: "whitespace-normal break-words leading-tight",
      render: (text: string) => text || "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text: string) => (
        <Tag color={STATUS_COLOR_MAP[text] || "default"} className="capitalize">
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
          return <span className="text-gray-300">👤 {record.allocatedEmployeeName}</span>;
        }
        if (record.allocatedDepartmentId) {
          return <span className="text-gray-300">🏢 Department Pool</span>;
        }
        return <span className="text-gray-500">—</span>;
      },
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#10b981", // emerald-500
          colorBgContainer: "#111827", // gray-900
          colorBorder: "#1f2937", // gray-800
        },
      }}
    >
      <div className="space-y-6 max-w-7xl text-white">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-emerald-400" />
              Department Assets
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              View all assets assigned to or currently allocated within your department.
            </p>
          </div>
          <Button
            onClick={() => fetchAssetsList()}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="bg-gray-800 text-gray-300 hover:text-white border-gray-700 w-fit rounded-xl"
          >
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-900 border border-gray-800 p-4 rounded-2xl">
          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Search</label>
            <Input
              prefix={<Search className="w-4 h-4 text-gray-500 mr-2" />}
              placeholder="Search by tag, name, or serial..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 rounded-xl py-2"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Status</label>
            <Select
              placeholder="Filter by status"
              allowClear
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              className="w-full bg-gray-800 border-gray-700 rounded-xl"
              style={{ height: "40px" }}
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
                showSizeChanger: false,
                className: "p-4",
              }}
              className="custom-table"
            />
          )}
        </div>
      </div>
    </ConfigProvider>
  );
}
