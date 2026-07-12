"use client";

import { useEffect, useState } from "react";
import { 
  Building2, Tag, ClipboardList, Users, BarChart3, Package, 
  ArrowRight, AlertTriangle, ArrowLeftRight, CalendarCheck, RotateCcw, Plus
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Spin, message } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/modules/dashboard/routes/admin");
        if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
        const json = await res.json();
        setMetrics(json.data);
      } catch (error) {
        console.error(error);
        message.error("Could not load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const kpis = [
    { label: "Available", value: metrics?.availableCount || 0, icon: Package, color: "text-[#10b981]" },
    { label: "Allocated", value: metrics?.allocatedCount || 0, icon: Users, color: "text-[#3b82f6]" },
    { label: "Maintenance", value: metrics?.maintenanceCount || 0, icon: AlertTriangle, color: "text-[#f59e0b]" },
    { label: "Active Bookings", value: metrics?.activeBookingsCount || 0, icon: CalendarCheck, color: "text-[#8b5cf6]" },
    { label: "Pending Transfers", value: metrics?.pendingTransfersCount || 0, icon: ArrowLeftRight, color: "text-[#ec4899]" },
    { label: "Upcoming Returns", value: metrics?.upcomingReturnsCount || 0, icon: RotateCcw, color: "text-[#06b6d4]" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-2">
      {/* Header */}
      <div className="bg-[#ffffff] p-8 rounded-2xl border border-[#e5e7eb] shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">
            Welcome back, <span className="text-[#ff6b00]">{session?.user?.name?.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-[#6b7280] mt-2 text-base">
            Administrator · Organization Overview
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <button className="h-11 px-4 bg-[#ffffff] hover:bg-[#f8f9fa] border border-[#e5e7eb] text-[#111827] rounded-xl font-bold transition-all flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" />
            Book Resource
          </button>
          <button className="h-11 px-4 bg-[#ffffff] hover:bg-[#f8f9fa] border border-[#e5e7eb] text-[#111827] rounded-xl font-bold transition-all flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Raise Request
          </button>
          <button className="h-11 px-6 bg-[#ff6b00] hover:bg-[#e05e00] text-white border-none rounded-xl font-bold shadow-lg shadow-[#ff6b00]/20 flex items-center gap-2 transition-all hover:scale-[1.02]">
            <Plus className="w-4 h-4" />
            Register Asset
          </button>
        </div>
      </div>

      {metrics?.overdueReturnsCount > 0 && (
        <div className="bg-[#fef2f2] border border-[#fca5a5] p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#fee2e2] flex items-center justify-center shrink-0">
             <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
          </div>
          <div>
            <h3 className="text-[#991b1b] font-bold text-lg">{metrics.overdueReturnsCount} assets overdue for return</h3>
            <p className="text-[#b91c1c] text-sm">Flagged for immediate followup with respective employees.</p>
          </div>
        </div>
      )}

      {/* Today's Overview (KPI Cards) */}
      <div>
        <h2 className="text-[#111827] text-xl font-bold mb-6">Today&apos;s Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className={`rounded-xl border p-5 bg-[#ffffff] shadow-sm hover:shadow-md transition-shadow`}>
                <p className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider mb-2">{kpi.label}</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-black text-[#111827]">{kpi.value}</p>
                  <Icon className={`w-6 h-6 ${kpi.color} opacity-80`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#ffffff] p-8 rounded-2xl border border-[#e5e7eb] shadow-sm">
        <h2 className="text-[#111827] text-xl font-bold mb-6">Recent Activity</h2>
        
        {metrics?.recentActivity?.length > 0 ? (
          <div className="space-y-4">
            {metrics.recentActivity.map((log: any) => (
              <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-[#f8f9fa] border border-transparent hover:border-[#e5e7eb] transition-all">
                 <div className="w-10 h-10 rounded-full bg-[#f3f4f6] flex items-center justify-center shrink-0 mt-1">
                   {log.action.includes("allocated") ? <Users className="w-4 h-4 text-[#3b82f6]" /> :
                    log.action.includes("transfer") ? <ArrowLeftRight className="w-4 h-4 text-[#ec4899]" /> :
                    log.action.includes("maintenance") ? <AlertTriangle className="w-4 h-4 text-[#f59e0b]" /> :
                    <Package className="w-4 h-4 text-[#6b7280]" />}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-[#111827] font-medium text-base">
                      {log.details?.assetName ? <span className="font-bold">{log.details.assetName}</span> : "Asset"} - {log.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-[#6b7280] text-sm mt-1 line-clamp-1">
                      {log.details?.reason || log.details?.notes || `Entity: ${log.entityType}`}
                    </p>
                 </div>
                 <div className="text-right shrink-0">
                    <p className="text-[#6b7280] text-sm">{dayjs(log.createdAt).fromNow()}</p>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-[#6b7280]">
            No recent activity recorded today.
          </div>
        )}
      </div>

    </div>
  );
}
