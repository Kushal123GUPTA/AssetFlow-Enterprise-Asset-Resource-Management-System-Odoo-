"use client";

import { useEffect, useState } from "react";
import { Table, Button, Input, Select, Tag, Tooltip, message } from "antd";
import { RefreshCw, Search, CheckCircle, XCircle, ArrowLeftRight, User, Building2 } from "lucide-react";
import { useTransferStore, type TransferRequest } from "../hooks/useTransfers";

export default function TransfersPage() {
  const {
    transfers,
    loadingTransfers,
    fetchTransfers,
    approveTransfer,
    rejectTransfer,
  } = useTransferStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("requested");

  useEffect(() => {
    fetchTransfers(statusFilter);
  }, [fetchTransfers, statusFilter]);

  const handleApprove = async (id: string) => {
    const success = await approveTransfer(id);
    if (success) {
      message.success("Transfer approved and asset re-allocated successfully");
      fetchTransfers(statusFilter);
    } else {
      message.error("Failed to approve transfer");
    }
  };

  const handleReject = async (id: string) => {
    const success = await rejectTransfer(id);
    if (success) {
      message.success("Transfer request rejected");
      fetchTransfers(statusFilter);
    } else {
      message.error("Failed to reject transfer");
    }
  };

  // Filter transfers based on search query matching asset name, tag, or people
  const filteredTransfers = transfers.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.assetName.toLowerCase().includes(q) ||
      t.assetTag.toLowerCase().includes(q) ||
      (t.fromEmployeeName && t.fromEmployeeName.toLowerCase().includes(q)) ||
      (t.fromDepartmentName && t.fromDepartmentName.toLowerCase().includes(q)) ||
      (t.toEmployeeName && t.toEmployeeName.toLowerCase().includes(q)) ||
      (t.toDepartmentName && t.toDepartmentName.toLowerCase().includes(q))
    );
  });

  const columns = [
    {
      title: "Asset",
      key: "asset",
      render: (_: unknown, record: TransferRequest) => (
        <div>
          <span className="font-mono font-bold text-primary mr-2">{record.assetTag}</span>
          <span className="text-sm font-semibold text-gray-200">{record.assetName}</span>
        </div>
      ),
    },
    {
      title: "From Custody",
      key: "fromCustodian",
      render: (_: unknown, record: TransferRequest) => (
        <div className="flex items-center gap-2">
          {record.fromEmployeeId ? (
            <>
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-300">{record.fromEmployeeName}</span>
            </>
          ) : record.fromDepartmentId ? (
            <>
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-300">{record.fromDepartmentName}</span>
            </>
          ) : (
            <span className="text-sm text-gray-500">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      title: "To Custody",
      key: "toCustodian",
      render: (_: unknown, record: TransferRequest) => (
        <div className="flex items-center gap-2">
          {record.toEmployeeId ? (
            <>
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-sm text-blue-300">{record.toEmployeeName}</span>
            </>
          ) : (
            <>
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-sm text-purple-300">{record.toDepartmentName}</span>
            </>
          )}
        </div>
      ),
    },
    {
      title: "Requested By",
      dataIndex: "requestedByName",
      key: "requestedByName",
      render: (name: string) => (
        <span className="text-xs text-gray-400">{name}</span>
      ),
    },
    {
      title: "Requested At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <span className="text-xs text-gray-400">{new Date(date).toLocaleDateString()}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: TransferRequest["status"]) => {
        const config = {
          requested: { color: "orange", label: "Requested" },
          approved: { color: "green", label: "Approved" },
          rejected: { color: "red", label: "Rejected" },
        }[status];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_: unknown, record: TransferRequest) => {
        if (record.status !== "requested") return null;

        return (
          <div className="flex gap-2">
            <Tooltip title="Approve Transfer">
              <Button
                type="primary"
                size="small"
                icon={<CheckCircle className="w-3.5 h-3.5" />}
                onClick={() => handleApprove(record.id)}
                className="bg-green-600 hover:bg-green-700 border-none flex items-center"
              />
            </Tooltip>
            <Tooltip title="Reject Transfer">
              <Button
                type="primary"
                danger
                size="small"
                icon={<XCircle className="w-3.5 h-3.5" />}
                onClick={() => handleReject(record.id)}
                className="flex items-center"
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-200">Transfer Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Review and approve asset transfer requests between employees and departments</p>
        </div>
        <Button icon={<RefreshCw className="w-4 h-4" />} onClick={() => fetchTransfers(statusFilter)}>
          Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-gray-700 bg-gray-900 p-5 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by asset tag, name, or custodian..."
          prefix={<Search className="w-4 h-4 text-gray-400" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          className="!w-72"
        />
        <Select
          placeholder="Status"
          value={statusFilter}
          onChange={(val) => setStatusFilter(val || "")}
          className="!w-44"
          options={[
            { label: "All Statuses", value: "" },
            { label: "Requested", value: "requested" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
          ]}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden">
        <Table
          dataSource={filteredTransfers}
          columns={columns}
          rowKey="id"
          loading={loadingTransfers}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 800 }}
        />
      </div>
    </div>
  );
}
