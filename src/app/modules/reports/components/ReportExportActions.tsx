"use client";

import { Button, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

type Props = {
  utilization?: unknown[];
  maintenance?: unknown[];
  assets?: { mostUsed?: unknown[]; idleAssets?: unknown[] };
};

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join(
    "\n"
  );
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportExportActions({
  utilization = [],
  maintenance = [],
  assets = {},
}: Props) {
  const onExportJson = () => {
    downloadJson(`assetflow-analytics-${new Date().toISOString().slice(0, 10)}.json`, {
      exportedAt: new Date().toISOString(),
      utilization,
      maintenance,
      mostUsed: assets.mostUsed ?? [],
      idleAssets: assets.idleAssets ?? [],
    });
    message.success("Analytics JSON exported");
  };

  const onExportCsv = () => {
    const utilRows = (utilization as Record<string, unknown>[]) ?? [];
    const maintRows = (maintenance as Record<string, unknown>[]) ?? [];
    if (utilRows.length) {
      downloadCsv("utilization-by-department.csv", utilRows);
    }
    if (maintRows.length) {
      downloadCsv("maintenance-frequency.csv", maintRows);
    }
    const mostUsed = (assets.mostUsed as Record<string, unknown>[]) ?? [];
    const idle = (assets.idleAssets as Record<string, unknown>[]) ?? [];
    if (mostUsed.length) downloadCsv("most-used-assets.csv", mostUsed);
    if (idle.length) downloadCsv("idle-assets.csv", idle);
    if (!utilRows.length && !maintRows.length && !mostUsed.length && !idle.length) {
      message.warning("No analytics rows to export");
      return;
    }
    message.success("Analytics CSV exported");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button icon={<DownloadOutlined />} onClick={onExportCsv}>
        Export CSV
      </Button>
      <Button type="primary" icon={<DownloadOutlined />} onClick={onExportJson}>
        Export JSON
      </Button>
    </div>
  );
}
