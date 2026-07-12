"use client";

import { Table, Tooltip, Button, Popconfirm, message } from "antd";
import { Eye, Pencil, Trash2, Package } from "lucide-react";
import type { Asset } from "../types";
import AssetStatusBadge from "./AssetStatusBadge";

interface Props {
  assets: Asset[];
  loading: boolean;
  onView: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

export default function AssetTable({ assets, loading, onView, onEdit, onDelete }: Props) {
  const columns = [
    {
      title: "Asset Tag",
      dataIndex: "assetTag",
      key: "assetTag",
      width: 120,
      render: (tag: string) => (
        <span className="font-mono font-bold text-primary">{tag}</span>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Asset) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-200 whitespace-normal break-words leading-tight">{name}</p>
            {record.serialNumber && (
              <p className="text-xs text-gray-500 mt-0.5">SN: {record.serialNumber}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "categoryName",
      key: "categoryName",
      width: 150,
      render: (name: string) => (
        <span className="text-sm text-gray-300 whitespace-normal break-words leading-tight">{name}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status: Asset["status"]) => <AssetStatusBadge status={status} />,
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      width: 150,
      render: (loc: string | null) => (
        <span className="text-sm text-gray-400 whitespace-normal break-words leading-tight">{loc ?? "—"}</span>
      ),
    },
    {
      title: "Department",
      dataIndex: "departmentName",
      key: "departmentName",
      width: 140,
      render: (name: string | null) => (
        <span className="text-sm text-gray-400 whitespace-normal break-words leading-tight">{name ?? "—"}</span>
      ),
    },
    {
      title: "Bookable",
      dataIndex: "isBookable",
      key: "isBookable",
      width: 90,
      render: (b: boolean) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b ? "bg-emerald-50 text-emerald-700" : "bg-gray-600 text-gray-400"}`}>
          {b ? "Yes" : "No"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      render: (_: unknown, record: Asset) => (
        <div className="flex items-center gap-1">
          <Tooltip title="View Details">
            <Button type="text" icon={<Eye className="w-4 h-4" />} onClick={() => onView(record)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" icon={<Pencil className="w-4 h-4" />} onClick={() => onEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Delete this asset?"
            description="This will soft-delete the asset."
            onConfirm={() => onDelete(record.id)}
            okText="Delete"
            okType="danger"
          >
            <Tooltip title="Delete">
              <Button type="text" danger icon={<Trash2 className="w-4 h-4" />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <Table
      dataSource={assets}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} assets` }}
      scroll={{ x: 900 }}
      className="asset-table"
    />
  );
}
