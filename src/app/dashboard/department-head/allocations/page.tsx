"use client";

import { useEffect, useState } from "react";
import { GitMerge, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { useDepartmentHeadStore } from "@/store/departmentHeadStore";
import { Table, Button, Spin, Modal, Input, message } from "antd";

export default function DepartmentAllocationsPage() {
  const {
    pendingRequestsList,
    isLoading,
    fetchPendingRequests,
    approveRequest,
    rejectRequest,
  } = useDepartmentHeadStore();

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleApprove = async (id: string) => {
    const success = await approveRequest(id);
    if (success) {
      message.success("Request approved successfully");
    } else {
      message.error("Failed to approve request");
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectId) return;
    const success = await rejectRequest(rejectId, rejectReason);
    if (success) {
      message.success("Request rejected successfully");
      setRejectId(null);
      setRejectReason("");
    } else {
      message.error("Failed to reject request");
    }
  };

  // Only show Allocation requests (where fromEmployeeName is null)
  const allocations = pendingRequestsList.filter((req) => !req.fromEmployeeName);

  const columns = [
    {
      title: "Asset Tag",
      dataIndex: "assetTag",
      key: "assetTag",
      className: "whitespace-normal break-words leading-tight",
      render: (text: string) => <span className="font-bold text-[#10b981]">{text}</span>,
    },
    {
      title: "Asset Name",
      dataIndex: "assetName",
      key: "assetName",
      className: "whitespace-normal break-words leading-tight text-gray-100 font-bold",
    },
    {
      title: "Target Recipient",
      dataIndex: "toEmployeeName",
      key: "toEmployeeName",
      className: "whitespace-normal break-words leading-tight text-gray-200 font-medium",
      render: (text: string) => text ? `👤 ${text}` : "🏢 Department Pool",
    },
    {
      title: "Requested Date",
      dataIndex: "createdAt",
      key: "createdAt",
      className: "whitespace-normal break-words leading-tight text-gray-500 font-semibold",
      render: (text: string) => new Date(text).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
            onClick={() => handleApprove(record.id)}
            className="bg-emerald-600 hover:bg-emerald-500 border-none rounded-lg flex items-center text-white"
          >
            Approve
          </Button>
          <Button
            danger
            icon={<XCircle className="w-3.5 h-3.5 mr-1" />}
            onClick={() => setRejectId(record.id)}
            className="bg-red-50 hover:bg-red-600 border-none rounded-lg flex items-center text-white"
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <GitMerge className="w-6 h-6 text-emerald-500" />
            Pending Allocation Requests
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Approve or reject pending asset allocation requests within your department.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchPendingRequests()}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-none text-sm font-semibold transition-all disabled:opacity-50 !bg-gray-800/80 !text-gray-200 hover:!bg-gray-700/80 cursor-pointer"
        >
          <RotateCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Spin />
          </div>
        ) : (
          <Table
            dataSource={allocations}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
            locale={{ emptyText: "No pending allocation requests" }}
          />
        )}
      </div>

      {/* Reject Reason Modal */}
      <Modal
        title={<span className="text-gray-100 font-bold">Reject Request</span>}
        open={rejectId !== null}
        onOk={handleRejectSubmit}
        onCancel={() => {
          setRejectId(null);
          setRejectReason("");
        }}
        okText="Confirm Reject"
        cancelText="Cancel"
        okButtonProps={{ className: "bg-red-500 hover:bg-red-600 border-none text-white font-semibold" }}
      >
        <div className="space-y-3 py-3">
          <p className="text-sm text-gray-500 font-medium">Please provide a reason for rejecting this allocation request:</p>
          <Input.TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="E.g., Device is currently needed for a critical task / Incorrect recipient."
            className="w-full rounded-lg"
          />
        </div>
      </Modal>
    </div>
  );
}
