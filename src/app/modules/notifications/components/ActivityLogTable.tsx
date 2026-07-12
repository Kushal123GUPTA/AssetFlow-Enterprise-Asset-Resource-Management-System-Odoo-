"use client";

import { useEffect, useState } from "react";
import { Input, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Search } from "lucide-react";

type ActivityRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  employeeId: string | null;
  employeeName: string | null;
  employeeEmail: string | null;
};

type Props = {
  limit?: number;
  compact?: boolean;
};

export default function ActivityLogTable({ limit = 50, compact = false }: Props) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          limit: String(limit),
          ...(search ? { search } : {}),
        });
        const res = await fetch(`/api/activity-logs?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load");
        if (!cancelled) {
          setRows(json.data ?? []);
          setTotal(json.meta?.total ?? 0);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [limit, search]);

  const columns: ColumnsType<ActivityRow> = [
    {
      title: "When",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (v: string) => (
        <span className="text-xs text-gray-400">{v ? new Date(v).toLocaleString() : "—"}</span>
      ),
    },
    {
      title: "Who",
      key: "who",
      render: (_: unknown, r) => (
        <div>
          <div className="text-sm font-semibold text-gray-200">{r.employeeName ?? "System"}</div>
          {!compact && (
            <div className="text-[11px] text-gray-500">{r.employeeEmail ?? ""}</div>
          )}
        </div>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: "Entity",
      key: "entity",
      render: (_: unknown, r) => (
        <span className="text-sm text-gray-300">
          {r.entityType}
          {r.entityId ? (
            <span className="ml-1 font-mono text-[10px] text-gray-500">
              {r.entityId.slice(0, 8)}…
            </span>
          ) : null}
        </span>
      ),
    },
    ...(!compact
      ? [
          {
            title: "Details",
            dataIndex: "details",
            key: "details",
            render: (d: Record<string, unknown> | null) => (
              <span className="text-xs text-gray-500 line-clamp-2">
                {d && Object.keys(d).length > 0 ? JSON.stringify(d) : "—"}
              </span>
            ),
          } as ColumnsType<ActivityRow>[number],
        ]
      : []),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Input
          allowClear
          placeholder="Search action, entity, actor…"
          prefix={<Search className="w-4 h-4 text-gray-400" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="!max-w-sm"
        />
        <span className="text-xs text-gray-500">{total} events</span>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">
          {error}
        </div>
      )}
      <Table
        rowKey={(r) => `${r.id}-${r.createdAt}`}
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={compact ? false : { pageSize: limit, total, simple: true }}
        size={compact ? "small" : "middle"}
        scroll={{ x: 700 }}
      />
    </div>
  );
}
