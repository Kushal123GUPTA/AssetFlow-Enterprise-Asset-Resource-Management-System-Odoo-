"use client";

import { useEffect, useState, useCallback } from "react";
import { Table, Button, Input, Select, Tag, Tooltip, message, Popconfirm } from "antd";
import { RefreshCw, Plus, Search, Wrench, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { useMaintenanceStore, type MaintenanceRequest } from "../hooks/useMaintenance";
import {
  AssignTechnicianModal,
  ResolveMaintenanceModal,
  RaiseMaintenanceModal,
} from "../components/MaintenanceModals";

export default function MaintenancePage() {
  const {
    requests,
    loading,
    fetchRequests,
    raiseRequest,
    approveRequest,
    rejectRequest,
    assignTechnician,
    resolveRequest,
  } = useMaintenanceStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [priorityFilter, setPriorityFilter] = useState<string>("");

  // Modal States
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  const loadRequests = useCallback(() => {
    fetchRequests({
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
    });
  }, [fetchRequests, statusFilter, priorityFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = async (id: string) => {
    const success = await approveRequest(id);
    if (success) {
      message.success("Ticket approved. Ready for technician assignment.");
      loadRequests();
    } else {
      message.error("Failed to approve ticket");
    }
  };

  const handleReject = async (id: string) => {
    // Prompt rejection reason
    const reason = prompt("Please enter the reason for rejection:");
    if (reason === null) return; // cancelled
    const success = await rejectRequest(id, reason);
    if (success) {
      message.success("Ticket rejected");
      loadRequests();
    } else {
      message.error("Failed to reject ticket");
    }
  };

  const handleAssignSubmit = async (techName: string) => {
    if (!selectedRequest) return false;
    const success = await assignTechnician(selectedRequest.id, techName);
    if (success) {
      loadRequests();
    }
    return success;
  };

  const handleResolveSubmit = async (data: any) => {
    if (!selectedRequest) return false;
    const success = await resolveRequest({
      requestId: selectedRequest.id,
      ...data,
    });
    if (success) {
      loadRequests();
    }
    return success;
  };

  const handleRaiseSubmit = async (data: any) => {
    const success = await raiseRequest(data);
    if (success) {
      loadRequests();
    }
    return success;
  };

  const handleOpenAssign = (req: MaintenanceRequest) => {
    setSelectedRequest(req);
    setAssignOpen(true);
  };

  const handleOpenResolve = (req: MaintenanceRequest) => {
    setSelectedRequest(req);
    setResolveOpen(true);
  };

  // Filter requests locally on search query
  const filteredRequests = requests.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.assetName.toLowerCase().includes(q) ||
      r.assetTag.toLowerCase().includes(q) ||
      r.issueDescription.toLowerCase().includes(q) ||
      r.raisedByName.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      title: "Asset",
      key: "asset",
      render: (_: unknown, record: MaintenanceRequest) => (
        <div>
          <span className="font-mono font-bold text-primary mr-2">{record.assetTag}</span>
          <span className="text-sm font-semibold text-gray-200">{record.assetName}</span>
        </div>
      ),
    },
    {
      title: "Issue",
      dataIndex: "issueDescription",
      key: "issueDescription",
      render: (desc: string) => (
        <span className="text-sm text-gray-300 line-clamp-2">{desc}</span>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority: MaintenanceRequest["priority"]) => {
        const colors = {
          low: "blue",
          medium: "orange",
          high: "pink",
          critical: "red",
        }[priority];
        return <Tag color={colors}>{priority.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Raised By",
      dataIndex: "raisedByName",
      key: "raisedByName",
      render: (name: string) => (
        <span className="text-xs text-gray-400">{name}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: MaintenanceRequest["status"]) => {
        const config = {
          pending: { color: "gold", label: "Pending Approval" },
          approved: { color: "blue", label: "Approved" },
          rejected: { color: "red", label: "Rejected" },
          technician_assigned: { color: "purple", label: "Tech Assigned" },
          in_progress: { color: "cyan", label: "In Progress" },
          resolved: { color: "green", label: "Resolved" },
        }[status];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Assigned Tech",
      dataIndex: "technicianName",
      key: "technicianName",
      render: (name: string | null) => (
        <span className="text-xs text-gray-300 font-medium">{name || "Not Assigned"}</span>
      ),
    },
    {
      title: "Raised At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <span className="text-xs text-gray-400">{new Date(date).toLocaleDateString()}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      render: (_: unknown, record: MaintenanceRequest) => {
        if (record.status === "pending") {
          return (
            <div className="flex gap-2">
              <Tooltip title="Approve Ticket">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircle className="w-3.5 h-3.5" />}
                  onClick={() => handleApprove(record.id)}
                  className="bg-green-600 hover:bg-green-700 border-none flex items-center"
                />
              </Tooltip>
              <Tooltip title="Reject Ticket">
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
        }

        if (record.status === "approved") {
          return (
            <Button
              type="primary"
              size="small"
              icon={<UserCheck className="w-3.5 h-3.5 mr-1" />}
              onClick={() => handleOpenAssign(record)}
              className="flex items-center"
            >
              Assign Tech
            </Button>
          );
        }

        if (record.status === "technician_assigned" || record.status === "in_progress") {
          return (
            <Button
              type="primary"
              size="small"
              icon={<Wrench className="w-3.5 h-3.5 mr-1" />}
              onClick={() => handleOpenResolve(record)}
              className="bg-green-600 hover:bg-green-700 border-none flex items-center"
            >
              Resolve
            </Button>
          );
        }

        return null;
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-200">Maintenance & Repair</h1>
          <p className="text-gray-500 text-sm mt-1">Assign technicians, track repairs, and manage maintenance tickets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<RefreshCw className="w-4 h-4" />} onClick={loadRequests}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setRaiseOpen(true)}
          >
            Create Ticket
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-gray-700 bg-gray-900 p-5 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by asset tag, name, issue, or raiser..."
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
            { label: "Pending Approval", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Tech Assigned", value: "technician_assigned" },
            { label: "Resolved", value: "resolved" },
            { label: "Rejected", value: "rejected" },
          ]}
        />
        <Select
          placeholder="Priority"
          value={priorityFilter}
          onChange={(val) => setPriorityFilter(val || "")}
          allowClear
          className="!w-44"
          options={[
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" },
            { label: "Critical", value: "critical" },
          ]}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden">
        <Table
          dataSource={filteredRequests}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 900 }}
        />
      </div>

      {/* Assign Technician Modal */}
      <AssignTechnicianModal
        open={assignOpen}
        onClose={() => { setAssignOpen(false); setSelectedRequest(null); }}
        onSubmit={handleAssignSubmit}
      />

      {/* Resolve Maintenance Modal */}
      <ResolveMaintenanceModal
        open={resolveOpen}
        onClose={() => { setResolveOpen(false); setSelectedRequest(null); }}
        onSubmit={handleResolveSubmit}
      />

      {/* Create Ticket Modal */}
      <RaiseMaintenanceModal
        open={raiseOpen}
        onClose={() => setRaiseOpen(false)}
        onSubmit={handleRaiseSubmit}
      />
    </div>
  );
}
