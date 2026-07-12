"use client";

import { useEffect, useState } from "react";
import { Button, Table, Tabs, Tag, Alert, Progress, Tooltip, Input, message } from "antd";
import { ArrowLeft, CheckCircle, AlertTriangle, AlertCircle, HelpCircle, FileText, Search, Lock } from "lucide-react";
import { useAuditStore, type AuditItem } from "../hooks/useAudit";
import { VerifyAssetModal } from "../components/AuditModals";

interface Props {
  auditCycleId: string;
  onBack: () => void;
}

export default function AuditDetailsPage({ auditCycleId, onBack }: Props) {
  const { currentDetails, loading, fetchDetails, verifyItem, closeCycle } = useAuditStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AuditItem | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    fetchDetails(auditCycleId);
  }, [auditCycleId, fetchDetails]);

  if (loading && !currentDetails) {
    return <div className="p-8 text-center text-gray-500">Loading campaign details...</div>;
  }

  if (!currentDetails) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Campaign not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const { cycle, auditors, items } = currentDetails;

  const handleOpenVerify = (item: AuditItem) => {
    setSelectedItem(item);
    setVerifyModalOpen(true);
  };

  const handleVerifySubmit = async (status: string, notes?: string) => {
    if (!selectedItem) return false;
    const success = await verifyItem({
      auditItemId: selectedItem.id,
      status,
      notes,
    });
    if (success) {
      message.success("Asset status logged successfully");
    } else {
      message.error("Failed to log status");
    }
    return success;
  };

  const handleCloseCampaign = async () => {
    const confirmClose = window.confirm(
      "Are you sure you want to CLOSE this campaign? This will lock all audit entries and reconcile discrepancies (Missing items will mark assets as LOST; Damaged items will transition assets to UNDER MAINTENANCE)."
    );
    if (!confirmClose) return;

    setClosing(true);
    const success = await closeCycle(auditCycleId);
    setClosing(false);

    if (success) {
      message.success("Audit campaign successfully closed and reconciled");
    } else {
      message.error("Failed to close audit campaign");
    }
  };

  const total = items.length;
  const verified = items.filter((i) => i.status === "verified").length;
  const missing = items.filter((i) => i.status === "missing").length;
  const damaged = items.filter((i) => i.status === "damaged").length;
  const pending = items.filter((i) => i.status === "pending").length;
  const rate = total > 0 ? Math.round(((total - pending) / total) * 100) : 0;

  // Filter items based on query
  const filteredItems = items.filter((i) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return i.assetName.toLowerCase().includes(q) || i.assetTag.toLowerCase().includes(q) || i.assetLocation.toLowerCase().includes(q);
  });

  const discrepancyItems = items.filter((i) => i.status === "missing" || i.status === "damaged");

  const columns = [
    {
      title: "Asset",
      key: "asset",
      render: (_: unknown, record: AuditItem) => (
        <div>
          <span className="font-mono font-bold text-primary mr-2">{record.assetTag}</span>
          <span className="text-sm font-semibold text-gray-200">{record.assetName}</span>
        </div>
      ),
    },
    {
      title: "Expected Location",
      dataIndex: "assetLocation",
      key: "assetLocation",
      render: (loc: string) => <span className="text-sm text-gray-300">{loc || "Office / HQ"}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: AuditItem["status"]) => {
        const config = {
          pending: { color: "gold", label: "Pending", icon: <HelpCircle className="w-3 h-3 inline mr-1" /> },
          verified: { color: "green", label: "Verified", icon: <CheckCircle className="w-3 h-3 inline mr-1" /> },
          missing: { color: "red", label: "Missing", icon: <AlertTriangle className="w-3 h-3 inline mr-1" /> },
          damaged: { color: "pink", label: "Damaged", icon: <AlertCircle className="w-3 h-3 inline mr-1" /> },
        }[status];
        return (
          <Tag color={config.color} className="flex items-center w-max gap-1">
            {config.icon}
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Verification Notes",
      dataIndex: "notes",
      key: "notes",
      render: (notes: string | null) => (
        <span className="text-xs text-gray-400 font-medium italic">{notes || "—"}</span>
      ),
    },
    {
      title: "Verified By",
      dataIndex: "verifiedByName",
      key: "verifiedByName",
      render: (name: string | null) => (
        <span className="text-xs text-gray-400">{name || "—"}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: AuditItem) => {
        if (cycle.status === "closed") return <Lock className="w-4 h-4 text-gray-600" />;

        return (
          <Button type="primary" size="small" onClick={() => handleOpenVerify(record)}>
            Verify
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button icon={<ArrowLeft className="w-4 h-4" />} onClick={onBack} />
          <div>
            <h1 className="text-2xl font-bold text-gray-200">{cycle.name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Audit Campaign Details &middot; Status:{" "}
              <Tag color={cycle.status === "closed" ? "red" : "green"} className="ml-1 font-bold">
                {cycle.status.toUpperCase()}
              </Tag>
            </p>
          </div>
        </div>
        {cycle.status !== "closed" && (
          <Button
            type="primary"
            danger
            icon={<Lock className="w-4 h-4 mr-1" />}
            onClick={handleCloseCampaign}
            loading={closing}
            className="flex items-center bg-red-600 hover:bg-red-700 border-none"
          >
            Close & Reconcile Campaign
          </Button>
        )}
      </div>

      {/* Campaign Summary Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Campaign Info */}
        <div className="rounded-2xl border border-gray-700 bg-gray-900 p-5 space-y-3">
          <h3 className="font-bold text-gray-300 text-sm uppercase tracking-wide">Audit Scope & Time</h3>
          <div className="text-sm space-y-1">
            <p className="text-gray-400">
              Duration: <span className="text-gray-200 font-semibold">{cycle.startDate} to {cycle.endDate}</span>
            </p>
            <p className="text-gray-400">
              Location target: <span className="text-gray-200 font-semibold">{cycle.scopeLocation || "All locations"}</span>
            </p>
            <p className="text-gray-400">
              Assigned Auditors:{" "}
              <span className="text-gray-200 font-semibold">
                {auditors.map((a) => a.employeeName).join(", ") || "None"}
              </span>
            </p>
          </div>
        </div>

        {/* Progress Rates */}
        <div className="rounded-2xl border border-gray-700 bg-gray-900 p-5 flex flex-col justify-center items-center gap-3">
          <div className="w-full flex items-center justify-between">
            <span className="font-bold text-gray-300 text-sm uppercase tracking-wide">Audit Completion</span>
            <span className="text-xs text-gray-500">
              {total - pending} / {total} Assets
            </span>
          </div>
          <Progress percent={rate} strokeColor="#ff6b00" trailColor="#1f2937" className="w-full" />
        </div>

        {/* Campaign Statistics Box */}
        <div className="rounded-2xl border border-gray-700 bg-gray-900 p-5 grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col justify-center border-r border-gray-800">
            <span className="text-2xl font-bold text-green-500">{verified}</span>
            <span className="text-[10px] text-gray-500 uppercase font-semibold mt-1">Verified</span>
          </div>
          <div className="flex flex-col justify-center border-r border-gray-800">
            <span className="text-2xl font-bold text-red-500">{missing}</span>
            <span className="text-[10px] text-gray-500 uppercase font-semibold mt-1">Missing</span>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-2xl font-bold text-pink-500">{damaged}</span>
            <span className="text-[10px] text-gray-500 uppercase font-semibold mt-1">Damaged</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden p-5">
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: (
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  All Scoped Assets ({items.length})
                </span>
              ),
              children: (
                <div className="space-y-4 pt-3">
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="Search by asset tag, name, location..."
                      prefix={<Search className="w-4 h-4 text-gray-400" />}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      allowClear
                      className="!w-72"
                    />
                  </div>
                  <Table
                    dataSource={filteredItems}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 800 }}
                  />
                </div>
              ),
            },
            {
              key: "2",
              label: (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Discrepancy Report ({discrepancyItems.length})
                </span>
              ),
              children: (
                <div className="space-y-4 pt-3">
                  {discrepancyItems.length === 0 ? (
                    <Alert
                      message="No discrepancies found"
                      description="All verified assets are accounted for. No missing or damaged assets reported."
                      type="success"
                      showIcon
                    />
                  ) : (
                    <>
                      <Alert
                        message={`${discrepancyItems.length} Discrepancies Flagged`}
                        description="Closing the campaign will auto-reconcile these assets. Missing assets will be set to Lost. Damaged assets will be sent to Maintenance."
                        type="warning"
                        showIcon
                      />
                      <Table
                        dataSource={discrepancyItems}
                        columns={[
                          {
                            title: "Asset",
                            key: "asset",
                            render: (_: unknown, record: AuditItem) => (
                              <div>
                                <span className="font-mono font-bold text-primary mr-2">{record.assetTag}</span>
                                <span className="text-sm font-semibold text-gray-200">{record.assetName}</span>
                              </div>
                            ),
                          },
                          {
                            title: "Audit Finding",
                            dataIndex: "status",
                            key: "status",
                            render: (status: AuditItem["status"]) => (
                              <Tag color={status === "missing" ? "red" : "pink"}>
                                {status.toUpperCase()}
                              </Tag>
                            ),
                          },
                          {
                            title: "Audit Logs & Findings",
                            dataIndex: "notes",
                            key: "notes",
                            render: (notes: string | null) => (
                              <span className="text-sm text-gray-300 italic">{notes || "No notes logged"}</span>
                            ),
                          },
                          {
                            title: "Logged By",
                            dataIndex: "verifiedByName",
                            key: "verifiedByName",
                            render: (name: string | null) => <span className="text-xs text-gray-400">{name}</span>,
                          },
                        ]}
                        rowKey="id"
                        pagination={false}
                      />
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Verify modal popup */}
      {selectedItem && (
        <VerifyAssetModal
          open={verifyModalOpen}
          onClose={() => { setVerifyModalOpen(false); setSelectedItem(null); }}
          onSubmit={handleVerifySubmit}
          assetName={selectedItem.assetName}
          assetTag={selectedItem.assetTag}
        />
      )}
    </div>
  );
}
