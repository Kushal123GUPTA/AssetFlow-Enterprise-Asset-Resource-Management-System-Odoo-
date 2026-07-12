"use client";

import { useMemo } from "react";
import { Button, Tag, Tooltip, Empty } from "antd";
import {
  CheckCircle,
  XCircle,
  UserCheck,
  Wrench,
  Play,
} from "lucide-react";
import type { MaintenanceRequest } from "../hooks/useMaintenance";

const COLUMNS: Array<{
  key: MaintenanceRequest["status"];
  title: string;
}> = [
  { key: "pending", title: "Pending" },
  { key: "approved", title: "Approved" },
  { key: "technician_assigned", title: "Technician assigned" },
  { key: "in_progress", title: "In progress" },
  { key: "resolved", title: "Resolved" },
];

const priorityColor: Record<MaintenanceRequest["priority"], string> = {
  low: "blue",
  medium: "orange",
  high: "pink",
  critical: "red",
};

type Props = {
  requests: MaintenanceRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onAssign: (req: MaintenanceRequest) => void;
  onStart: (id: string) => void;
  onResolve: (req: MaintenanceRequest) => void;
};

export default function MaintenanceKanban({
  requests,
  onApprove,
  onReject,
  onAssign,
  onStart,
  onResolve,
}: Props) {
  const byStatus = useMemo(() => {
    const map: Record<string, MaintenanceRequest[]> = {};
    for (const col of COLUMNS) map[col.key] = [];
    for (const req of requests) {
      if (req.status === "rejected") continue;
      if (!map[req.status]) map[req.status] = [];
      map[req.status].push(req);
    }
    return map;
  }, [requests]);

  return (
    <div className="grid grid-cols-1 gap-3 overflow-x-auto md:grid-cols-2 xl:grid-cols-5">
      {COLUMNS.map((col) => (
        <div
          key={col.key}
          className="min-w-[220px] rounded-2xl border border-gray-800 bg-gray-950 p-3"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-100">
              {col.title}
            </h3>
            <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-gray-400">
              {byStatus[col.key]?.length ?? 0}
            </span>
          </div>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {(byStatus[col.key] ?? []).length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span className="text-xs text-gray-500">None</span>}
              />
            ) : (
              (byStatus[col.key] ?? []).map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-3 shadow-sm"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="font-mono text-xs font-bold text-primary">
                      {req.assetTag}
                    </p>
                    <Tag color={priorityColor[req.priority]} className="m-0 text-[10px]">
                      {req.priority}
                    </Tag>
                  </div>
                  <p className="text-sm font-semibold text-gray-100 line-clamp-1">
                    {req.assetName}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-3">
                    {req.issueDescription}
                  </p>
                  <p className="mt-2 text-[11px] text-gray-500">
                    Raised by {req.raisedByName}
                    {req.technicianName ? ` · ${req.technicianName}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {req.status === "pending" && (
                      <>
                        <Tooltip title="Approve">
                          <Button
                            type="primary"
                            size="small"
                            icon={<CheckCircle className="h-3.5 w-3.5" />}
                            onClick={() => onApprove(req.id)}
                            className="border-none bg-emerald-600"
                          />
                        </Tooltip>
                        <Tooltip title="Reject">
                          <Button
                            danger
                            type="primary"
                            size="small"
                            icon={<XCircle className="h-3.5 w-3.5" />}
                            onClick={() => onReject(req.id)}
                          />
                        </Tooltip>
                      </>
                    )}
                    {req.status === "approved" && (
                      <Button
                        type="primary"
                        size="small"
                        icon={<UserCheck className="h-3.5 w-3.5" />}
                        onClick={() => onAssign(req)}
                      >
                        Assign
                      </Button>
                    )}
                    {req.status === "technician_assigned" && (
                      <>
                        <Button
                          type="primary"
                          size="small"
                          icon={<Play className="h-3.5 w-3.5" />}
                          onClick={() => onStart(req.id)}
                        >
                          Start
                        </Button>
                        <Button
                          size="small"
                          icon={<Wrench className="h-3.5 w-3.5" />}
                          onClick={() => onResolve(req)}
                        >
                          Resolve
                        </Button>
                      </>
                    )}
                    {req.status === "in_progress" && (
                      <Button
                        type="primary"
                        size="small"
                        icon={<Wrench className="h-3.5 w-3.5" />}
                        onClick={() => onResolve(req)}
                        className="border-none bg-emerald-600"
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
