"use client";

import { useEffect, useState } from "react";
import { Button, Table, Progress, Tag, message } from "antd";
import { RefreshCw, Plus, ClipboardCheck, ArrowRight, Eye } from "lucide-react";
import { useAuditStore, type AuditCycle } from "../hooks/useAudit";
import { useAllocationStore } from "../../allocation/hooks/useAllocation";
import { CreateAuditCycleModal } from "../components/AuditModals";
import AuditDetailsPage from "./AuditDetailsPage";

export default function AuditCampaignsPage() {
  const { cycles, loading, fetchCycles, createCycle } = useAuditStore();
  const { employees, departments, fetchOptions } = useAllocationStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  useEffect(() => {
    fetchCycles();
    fetchOptions();
  }, [fetchCycles, fetchOptions]);

  const handleCreateSubmit = async (data: any) => {
    return await createCycle(data);
  };

  if (selectedCycleId) {
    return (
      <AuditDetailsPage
        auditCycleId={selectedCycleId}
        onBack={() => {
          setSelectedCycleId(null);
          fetchCycles();
        }}
      />
    );
  }

  const columns = [
    {
      title: "Campaign Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: AuditCycle) => (
        <div>
          <span className="font-bold text-gray-200 block text-sm">{name}</span>
          <span className="text-xs text-gray-500">
            Scope: {record.departmentName ? `Dept: ${record.departmentName}` : ""}
            {record.departmentName && record.scopeLocation ? " / " : ""}
            {record.scopeLocation ? `Location: ${record.scopeLocation}` : ""}
            {!record.departmentName && !record.scopeLocation ? "Organization-wide" : ""}
          </span>
        </div>
      ),
    },
    {
      title: "Audit Duration",
      key: "duration",
      render: (_: unknown, record: AuditCycle) => (
        <span className="text-xs text-gray-400">
          {record.startDate} &rarr; {record.endDate}
        </span>
      ),
    },
    {
      title: "Audit Progress",
      key: "progress",
      width: 250,
      render: (_: unknown, record: AuditCycle) => {
        const m = record.metrics;
        return (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>{m.total - m.pending} of {m.total} Verified</span>
              <span>{record.metrics.completionRate}%</span>
            </div>
            <Progress percent={record.metrics.completionRate} strokeColor="#ff6b00" size="small" showInfo={false} />
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: AuditCycle["status"]) => {
        const config = {
          planned: { color: "gold", label: "Planned" },
          in_progress: { color: "blue", label: "In Progress" },
          closed: { color: "red", label: "Closed / Reconciled" },
        }[status];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      render: (_: unknown, record: AuditCycle) => (
        <Button
          type="primary"
          size="small"
          icon={<Eye className="w-3.5 h-3.5 mr-1" />}
          onClick={() => setSelectedCycleId(record.id)}
          className="flex items-center"
        >
          View details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-200">Asset Audit & Verification</h1>
          <p className="text-gray-500 text-sm mt-1">Initialize physical inventory verification cycles, resolve missing or damaged items, and audit scopes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<RefreshCw className="w-4 h-4" />} onClick={fetchCycles}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Create Audit Campaign
          </Button>
        </div>
      </div>

      {/* Campaigns list */}
      <div className="rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden">
        <Table
          dataSource={cycles}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </div>

      {/* Campaign setup Modal */}
      <CreateAuditCycleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        employees={employees}
        departments={departments}
      />
    </div>
  );
}
