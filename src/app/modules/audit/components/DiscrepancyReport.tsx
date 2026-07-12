"use client";

import { Alert, Table, Tag } from "antd";
import type { DiscrepancyReportRow } from "../hooks/useAudit";

interface Props {
  reports: DiscrepancyReportRow[];
  cycleClosed: boolean;
}

export default function DiscrepancyReport({ reports, cycleClosed }: Props) {
  if (reports.length === 0) {
    return (
      <Alert
        message="No discrepancies found"
        description="All verified assets are accounted for. No missing or damaged assets have been reported."
        type="success"
        showIcon
      />
    );
  }

  const openCount = reports.filter((r) => r.resolutionStatus === "open").length;

  return (
    <div className="space-y-4">
      <Alert
        message={`${reports.length} Discrepancy Report${reports.length === 1 ? "" : "s"}`}
        description={
          cycleClosed
            ? "Campaign is closed. Missing assets were set to Lost; damaged assets moved to Under Maintenance. Reports below are locked for history."
            : `${openCount} open. Closing the campaign will reconcile these assets (Missing → Lost, Damaged → Under Maintenance).`
        }
        type={cycleClosed ? "info" : "warning"}
        showIcon
      />
      <Table
        dataSource={reports}
        rowKey="id"
        pagination={false}
        columns={[
          {
            title: "Asset",
            key: "asset",
            render: (_: unknown, record: DiscrepancyReportRow) => (
              <div>
                <span className="font-mono font-bold text-primary mr-2">{record.assetTag}</span>
                <span className="text-sm font-semibold text-gray-200">{record.assetName}</span>
              </div>
            ),
          },
          {
            title: "Finding",
            dataIndex: "discrepancyType",
            key: "discrepancyType",
            render: (type: string) => (
              <Tag color={type === "missing" ? "red" : "pink"}>{type.toUpperCase()}</Tag>
            ),
          },
          {
            title: "Notes",
            dataIndex: "notes",
            key: "notes",
            render: (notes: string | null) => (
              <span className="text-sm text-gray-300 italic">{notes || "No notes logged"}</span>
            ),
          },
          {
            title: "Resolution",
            dataIndex: "resolutionStatus",
            key: "resolutionStatus",
            render: (status: string) => {
              const color =
                status === "open" ? "orange" : status === "reconciled" ? "blue" : "default";
              return <Tag color={color}>{status.toUpperCase()}</Tag>;
            },
          },
          {
            title: "Logged By",
            dataIndex: "createdByName",
            key: "createdByName",
            render: (name: string | null) => (
              <span className="text-xs text-gray-400">{name || "—"}</span>
            ),
          },
          {
            title: "Created",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (ts: string) => (
              <span className="text-xs text-gray-400">
                {ts ? new Date(ts).toLocaleString() : "—"}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
