"use client";

import { useEffect, useState } from "react";
import { Package, GitMerge, ArrowLeftRight, Calendar, CheckCircle2, Clock, XCircle, ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useDepartmentHeadStore } from "@/store/departmentHeadStore";
import { Spin, Modal, Input, message } from "antd";

const QUICK_LINKS = [
  { label: "Department Assets", href: "/dashboard/department-head/assets", icon: Package, desc: "View all assets assigned to your department" },
  { label: "Allocation Requests", href: "/dashboard/department-head/allocations", icon: GitMerge, desc: "Approve allocation requests within your dept" },
  { label: "Transfer Requests", href: "/dashboard/department-head/transfers", icon: ArrowLeftRight, desc: "Approve intra-department transfer requests" },
  { label: "Book Resources", href: "/dashboard/department-head/bookings", icon: Calendar, desc: "Book shared resources on behalf of the dept" },
];

export default function DepartmentHeadDashboard() {
  const { data: session } = useSession();
  const {
    dashboardData,
    isLoading,
    fetchDashboardData,
    approveRequest,
    rejectRequest,
  } = useDepartmentHeadStore();

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  if (isLoading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="default" />
      </div>
    );
  }

  const kpis = dashboardData?.kpis || {
    deptAssets: 0,
    allocatedMembers: 0,
    pendingRequests: 0,
    activeBookings: 0,
  };

  const KPI_CARDS = [
    { label: "Dept Assets", value: String(kpis.deptAssets), change: "All tracked in home dept", icon: Package, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Allocated to Members", value: String(kpis.allocatedMembers), change: "Held by employees", icon: Users, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Pending Requests", value: String(kpis.pendingRequests), change: "Needs review", icon: GitMerge, color: "from-violet-500 to-purple-600", bg: "bg-violet-500/10 border-violet-500/20" },
    { label: "Active Bookings", value: String(kpis.activeBookings), change: "Upcoming bookings", icon: Calendar, color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10 border-amber-500/20" },
  ];

  const pendingRequests = dashboardData?.pendingRequests || [];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Department Overview</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Welcome, {session?.user?.name} · Department Head · Engineering
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`rounded-2xl border p-5 ${kpi.bg}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{kpi.value}</p>
                  <p className="text-gray-500 text-xs mt-1">{kpi.change}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-gray-200 font-semibold mb-4">Department Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-emerald-500/50 hover:bg-gray-800/80 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/25 transition-colors">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-100 font-medium text-sm">{link.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{link.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick action helper panel */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-emerald-400" />
              <h3 className="text-gray-200 font-semibold text-sm">Active Resources & Bookings</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              As a Department Head, you are responsible for approving physical transfers of devices (e.g. laptops, monitors, mobile devices) within your department. You can also view department assets, verify they are in clean condition, and make conflict-free bookings on behalf of your team members.
            </p>
          </div>
          <div className="mt-6 flex gap-4">
            <Link
              href="/dashboard/department-head/assets"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all"
            >
              Manage Assets
            </Link>
            <Link
              href="/dashboard/department-head/bookings"
              className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all border border-gray-700"
            >
              Book Shared spaces
            </Link>
          </div>
        </div>

        {/* Pending approvals */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-gray-200 font-semibold text-sm">Pending Approval Requests</h3>
          </div>
          <div className="space-y-3">
            {pendingRequests.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No pending approvals</p>
            ) : (
              pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-gray-200 text-sm font-medium truncate">{req.toEmployeeName || "Department Pool"}</p>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">
                      {req.type === "Allocation" ? "Allocate" : `Transfer from ${req.fromEmployeeName}`} · <span className="text-emerald-400">{req.assetName} ({req.assetTag})</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${req.type === "Allocation" ? "bg-blue-500/15 text-blue-400" : "bg-violet-500/15 text-violet-400"}`}>
                      {req.type}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/40 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                      <button
                        onClick={() => setRejectId(req.id)}
                        className="w-6 h-6 rounded-md bg-red-500/20 flex items-center justify-center hover:bg-red-500/40 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
          <p className="text-sm text-gray-600">Please provide a reason for rejecting this transfer/allocation request:</p>
          <Input.TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="E.g., Device is currently needed for a critical task / Incorrect recipient."
          />
        </div>
      </Modal>
    </div>
  );
}
