"use client";

import { useMemo, useState } from "react";
import { Button, Tooltip, Empty, message } from "antd";
import {
  CheckCircle,
  XCircle,
  UserCheck,
  Wrench,
  Play,
  Calendar,
} from "lucide-react";
import type { MaintenanceRequest } from "../hooks/useMaintenance";

const COLUMNS: Array<{
  key: MaintenanceRequest["status"];
  title: string;
}> = [
  { key: "pending", title: "Pending" },
  { key: "approved", title: "Approved" },
  { key: "technician_assigned", title: "Technician Assigned" },
  { key: "in_progress", title: "In Progress" },
  { key: "resolved", title: "Resolved" },
];

const leftBorderColor: Record<MaintenanceRequest["priority"], string> = {
  low: "border-l-blue-500",
  medium: "border-l-amber-500",
  high: "border-l-rose-500",
  critical: "border-l-red-600",
};

const priorityBadgeStyle: Record<MaintenanceRequest["priority"], string> = {
  low: "bg-blue-50 text-blue-700 border border-blue-100",
  medium: "bg-amber-50 text-amber-700 border border-amber-200",
  high: "bg-rose-50 text-rose-700 border border-rose-100",
  critical: "bg-red-50 text-red-700 border border-red-200 animate-pulse",
};

const COLUMN_STYLES: Record<
  MaintenanceRequest["status"],
  {
    bg: string;
    border: string;
    borderTop: string;
    text: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  pending: {
    bg: "bg-amber-50/30",
    border: "border-amber-200/80",
    borderTop: "border-t-4 border-t-amber-500",
    text: "text-amber-800",
    badgeBg: "bg-amber-100/80",
    badgeText: "text-amber-800",
  },
  approved: {
    bg: "bg-blue-50/30",
    border: "border-blue-200/80",
    borderTop: "border-t-4 border-t-blue-500",
    text: "text-blue-800",
    badgeBg: "bg-blue-100/80",
    badgeText: "text-blue-800",
  },
  technician_assigned: {
    bg: "bg-purple-50/30",
    border: "border-purple-200/80",
    borderTop: "border-t-4 border-t-purple-500",
    text: "text-purple-800",
    badgeBg: "bg-purple-100/80",
    badgeText: "text-purple-800",
  },
  in_progress: {
    bg: "bg-cyan-50/30",
    border: "border-cyan-200/80",
    borderTop: "border-t-4 border-t-cyan-500",
    text: "text-cyan-800",
    badgeBg: "bg-cyan-100/80",
    badgeText: "text-cyan-800",
  },
  resolved: {
    bg: "bg-emerald-50/30",
    border: "border-emerald-200/80",
    borderTop: "border-t-4 border-t-emerald-500",
    text: "text-emerald-800",
    badgeBg: "bg-emerald-100/80",
    badgeText: "text-emerald-800",
  },
  rejected: {
    bg: "bg-rose-50/30",
    border: "border-rose-200/80",
    borderTop: "border-t-4 border-t-rose-500",
    text: "text-rose-800",
    badgeBg: "bg-rose-100/80",
    badgeText: "text-rose-800",
  },
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
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);

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

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDraggedOverCol(status);
  };

  const handleDragLeave = () => {
    setDraggedOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: MaintenanceRequest["status"]) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const requestId = e.dataTransfer.getData("text/plain");
    if (!requestId) return;

    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    const currentStatus = req.status;
    if (currentStatus === targetStatus) return;

    // Check valid transitions and call respective action callbacks
    if (currentStatus === "pending" && targetStatus === "approved") {
      onApprove(req.id);
    } else if (currentStatus === "approved" && targetStatus === "technician_assigned") {
      onAssign(req);
    } else if (currentStatus === "technician_assigned" && targetStatus === "in_progress") {
      onStart(req.id);
    } else if (currentStatus === "technician_assigned" && targetStatus === "resolved") {
      onResolve(req);
    } else if (currentStatus === "in_progress" && targetStatus === "resolved") {
      onResolve(req);
    } else {
      message.warning(`Cannot drag tickets directly from ${currentStatus.replace("_", " ")} to ${targetStatus.replace("_", " ")}`);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 overflow-x-auto md:grid-cols-2 xl:grid-cols-5 py-2 items-start">
      {COLUMNS.map((col) => {
        const styles = COLUMN_STYLES[col.key] || COLUMN_STYLES.pending;
        const isDraggedOver = draggedOverCol === col.key;

        return (
          <div
            key={col.key}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.key)}
            className={`min-w-[240px] rounded-2xl border p-4 transition-all duration-200 flex flex-col min-h-[680px] ${styles.bg} ${styles.border} ${styles.borderTop} ${
              isDraggedOver ? "ring-2 ring-primary ring-offset-2 scale-[1.01]" : ""
            }`}
          >
            {/* Column Header */}
            <div className="mb-4 flex items-center justify-between shrink-0">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${styles.text}`}>
                {col.title}
              </h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${styles.badgeBg} ${styles.badgeText}`}>
                {byStatus[col.key]?.length ?? 0}
              </span>
            </div>

            {/* Cards List / Drop Target Container */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
              {(byStatus[col.key] ?? []).length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center py-12">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<span className="text-xs text-gray-400 font-bold">No tickets</span>}
                  />
                </div>
              ) : (
                (byStatus[col.key] ?? []).map((req) => {
                  const borderL = leftBorderColor[req.priority] || "border-l-slate-350";
                  const priorityStyle = priorityBadgeStyle[req.priority] || "";
                  const dateFormatted = new Date(req.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <div
                      key={req.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, req.id)}
                      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing duration-150 border-l-4 ${borderL}`}
                    >
                      {/* Top Row: Asset Tag & Priority Tag */}
                      <div className="mb-2.5 flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md font-mono text-[10px] font-extrabold">
                          {req.assetTag}
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md ${priorityStyle}`}>
                          {req.priority}
                        </span>
                      </div>

                      {/* Asset Name: bold primary text */}
                      <h4 className="text-sm font-extrabold text-gray-100 leading-snug tracking-tight">
                        {req.assetName}
                      </h4>

                      {/* Description: secondary body text */}
                      <p className="mt-1.5 text-xs text-gray-200 font-medium leading-relaxed line-clamp-2">
                        {req.issueDescription}
                      </p>

                      {/* Metadata Area */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-[10px]">
                        {/* Raiser info */}
                        <div className="flex items-center justify-between text-gray-350 font-semibold">
                          <span className="font-medium text-gray-400">Raiser</span>
                          <span className="text-gray-100 font-bold">{req.raisedByName}</span>
                        </div>

                        {/* Tech info */}
                        <div className="flex items-center justify-between text-gray-350 font-semibold">
                          <span className="font-medium text-gray-400">Tech</span>
                          {req.technicianName ? (
                            <span className="text-gray-100 font-bold">👤 {req.technicianName}</span>
                          ) : (
                            <span className="text-gray-400 italic">Unassigned</span>
                          )}
                        </div>

                        {/* Date info */}
                        <div className="flex items-center justify-between text-gray-350 font-semibold pt-1">
                          <span className="font-medium text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" /> Date
                          </span>
                          <span className="text-gray-400">{dateFormatted}</span>
                        </div>
                      </div>
                      
                      {/* Action buttons footer */}
                      <div className="mt-3 flex flex-wrap gap-1.5 pt-2.5 border-t border-dashed border-slate-100">
                        {req.status === "pending" && (
                          <>
                            <Tooltip title="Approve">
                              <Button
                                type="primary"
                                size="small"
                                icon={<CheckCircle className="h-3.5 w-3.5" />}
                                onClick={(e) => { e.stopPropagation(); onApprove(req.id); }}
                                className="border-none bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center"
                              />
                            </Tooltip>
                            <Tooltip title="Reject">
                              <Button
                                danger
                                type="primary"
                                size="small"
                                icon={<XCircle className="h-3.5 w-3.5" />}
                                onClick={(e) => { e.stopPropagation(); onReject(req.id); }}
                                className="rounded-lg flex items-center justify-center"
                              />
                            </Tooltip>
                          </>
                        )}
                        {req.status === "approved" && (
                          <Button
                            type="primary"
                            size="small"
                            icon={<UserCheck className="h-3.5 w-3.5 mr-1" />}
                            onClick={(e) => { e.stopPropagation(); onAssign(req); }}
                            className="rounded-lg flex items-center bg-blue-600 hover:bg-blue-500 border-none text-white text-xs font-semibold"
                          >
                            Assign Tech
                          </Button>
                        )}
                        {req.status === "technician_assigned" && (
                          <>
                            <Button
                              type="primary"
                              size="small"
                              icon={<Play className="h-3.5 w-3.5 mr-1" />}
                              onClick={(e) => { e.stopPropagation(); onStart(req.id); }}
                              className="rounded-lg flex items-center bg-purple-600 hover:bg-purple-500 border-none text-white text-xs font-semibold"
                            >
                              Start
                            </Button>
                            <Button
                              size="small"
                              icon={<Wrench className="h-3.5 w-3.5 mr-1" />}
                              onClick={(e) => { e.stopPropagation(); onResolve(req); }}
                              className="rounded-lg flex items-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border-none"
                            >
                              Resolve
                            </Button>
                          </>
                        )}
                        {req.status === "in_progress" && (
                          <Button
                            type="primary"
                            size="small"
                            icon={<Wrench className="h-3.5 w-3.5 mr-1" />}
                            onClick={(e) => { e.stopPropagation(); onResolve(req); }}
                            className="border-none bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center text-xs font-semibold"
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
