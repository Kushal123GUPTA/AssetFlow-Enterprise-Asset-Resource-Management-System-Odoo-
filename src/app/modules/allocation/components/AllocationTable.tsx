"use client";

import { Table, Button, Tooltip, Tag } from "antd";
import { User, Building2, Calendar, ClipboardCheck } from "lucide-react";
import type { Allocation } from "../types/allocation.types";

interface Props {
  allocations: Allocation[];
  loading: boolean;
  onReturn: (allocation: Allocation) => void;
}

export default function AllocationTable({ allocations, loading, onReturn }: Props) {
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
      title: "Asset Name",
      dataIndex: "assetName",
      key: "assetName",
      render: (name: string) => (
        <span className="text-sm font-semibold text-gray-200">{name}</span>
      ),
    },
    {
      title: "Custody",
      key: "custody",
      width: 200,
      render: (_: unknown, record: Allocation) => (
        <div className="flex items-center gap-2">
          {record.employeeId ? (
            <>
              <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-sm text-gray-300">{record.employeeName}</span>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-sm text-gray-300">{record.departmentName}</span>
            </>
          )}
        </div>
      ),
    },
    {
      title: "Allocated At",
      dataIndex: "allocatedAt",
      key: "allocatedAt",
      width: 130,
      render: (date: string) => (
        <span className="text-xs text-gray-400">{new Date(date).toLocaleDateString()}</span>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "expectedReturnDate",
      key: "expectedReturnDate",
      width: 130,
      render: (date: string | null) => (
        <span className="text-xs text-gray-400">{date ? new Date(date).toLocaleDateString() : "No limit"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: Allocation["status"]) => {
        const config = {
          active: { color: "blue", label: "Active" },
          overdue: { color: "red", label: "Overdue" },
          returned: { color: "green", label: "Returned" },
        }[status];

        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, record: Allocation) => {
        if (record.status === "returned") return null;

        return (
          <Tooltip title="Process Return">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<ClipboardCheck className="w-3.5 h-3.5" />}
              onClick={() => onReturn(record)}
              className="flex items-center gap-1"
            >
              Return
            </Button>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Table
      dataSource={allocations}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      scroll={{ x: 800 }}
      className="allocation-table"
    />
  );
}
