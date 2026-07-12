"use client";

import { useEffect, useState } from "react";
import { GitMerge, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { useDepartmentHeadStore } from "@/store/departmentHeadStore";
import { Table, Button, Spin, Modal, Input, message, ConfigProvider, theme } from "antd";

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
      render: (text: string) => <span className="font-semibold text-emerald-400">{text}</span>,
    },
    {
      title: "Asset Name",
      dataIndex: "assetName",
      key: "assetName",
      className: "whitespace-normal break-words leading-tight text-white",
    },
    {
      title: "Target Recipient",
      dataIndex: "toEmployeeName",
      key: "toEmployeeName",
      className: "whitespace-normal break-words leading-tight text-white",
      render: (text: string) => text ? `👤 ${text}` : "🏢 Department Pool",
    },
    {
      title: "Requested Date",
      dataIndex: "createdAt",
      key: "createdAt",
      className: "whitespace-normal break-words leading-tight text-gray-400",
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
            className="bg-emerald-600 hover:bg-emerald-500 border-none rounded-lg flex items-center"
          >
            Approve
          </Button>
          <Button
            danger
            icon={<XCircle className="w-3.5 h-3.5 mr-1" />}
            onClick={() => setRejectId(record.id)}
            className="bg-red-950/40 hover:bg-red-900/60 border-red-800/80 rounded-lg flex items-center text-red-400"
          >
            Reject
          </Button>
        </div>
      ),
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
              <GitMerge className="w-6 h-6 text-emerald-400" />
              Pending Allocation Requests
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Approve or reject pending asset allocation requests within your department.
            </p>
          </div>
          <Button
            onClick={() => fetchPendingRequests()}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="bg-gray-800 text-gray-300 hover:text-white border-gray-700 w-fit rounded-xl"
          >
            Refresh
          </Button>
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
                showSizeChanger: false,
                className: "p-4",
              }}
              className="custom-table"
              locale={{ emptyText: "No pending allocation requests" }}
            />
          )}
        </div>

        {/* Reject Reason Modal */}
        <Modal
          title="Reject Request"
          open={rejectId !== null}
          onOk={handleRejectSubmit}
          onCancel={() => {
            setRejectId(null);
            setRejectReason("");
          }}
          okText="Confirm Reject"
          cancelText="Cancel"
        >
          <div className="space-y-3 py-3">
            <p className="text-sm text-gray-400">Please provide a reason for rejecting this allocation request:</p>
            <Input.TextArea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="E.g., Device is currently needed for a critical task / Incorrect recipient."
              className="bg-gray-900 border-gray-850 text-white placeholder-gray-500 rounded-xl"
            />
          </div>
        </Modal>
      </div>
    </ConfigProvider>
  );
}
