"use client";

import { useEffect, useState } from "react";
import { Spin, message } from "antd";
import { BarChartOutlined, LineChartOutlined, AlertOutlined, TrophyOutlined } from "@ant-design/icons";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from "recharts";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function AnalyticsPage() {
  const [utilization, setUtilization] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [assets, setAssets] = useState({ mostUsed: [], idleAssets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [utilRes, maintRes, assetsRes] = await Promise.all([
          fetch("/api/modules/reports/routes/analytics/utilization").then(r => r.json()),
          fetch("/api/modules/reports/routes/analytics/maintenance").then(r => r.json()),
          fetch("/api/modules/reports/routes/analytics/assets").then(r => r.json())
        ]);
        
        setUtilization(utilRes.data || []);
        setMaintenance(maintRes.data || []);
        setAssets(assetsRes.data || { mostUsed: [], idleAssets: [] });
      } catch (error) {
        console.error(error);
        message.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="bg-[#ffffff] p-6 rounded-2xl border border-[#e5e7eb] shadow-sm">
        <h1 className="text-2xl font-bold text-[#111827] flex items-center gap-2">
          Organization-wide Analytics
        </h1>
        <p className="text-[#6b7280] text-sm mt-1">Utilization, Maintenance Frequency, and Asset Lifecycles</p>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Utilization Bar Chart */}
        <div className="bg-[#ffffff] p-6 rounded-2xl border border-[#e5e7eb] shadow-sm h-[400px] flex flex-col">
          <h2 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
            <BarChartOutlined className="text-[#ff6b00]" />
            Utilization by Department
          </h2>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilization} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="department" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8f9fa' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="percentage" name="Utilization %" fill="#ff6b00" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance Line Chart */}
        <div className="bg-[#ffffff] p-6 rounded-2xl border border-[#e5e7eb] shadow-sm h-[400px] flex flex-col">
          <h2 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
            <LineChartOutlined className="text-[#3b82f6]" />
            Maintenance Frequency
          </h2>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={maintenance} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="requests" name="Requests" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Most Used Assets */}
        <div className="bg-[#ffffff] p-6 rounded-2xl border border-[#e5e7eb] shadow-sm">
          <h2 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
            <TrophyOutlined className="text-[#10b981]" />
            Most-used Assets
          </h2>
          {assets.mostUsed.length > 0 ? (
             <div className="space-y-4">
               {assets.mostUsed.map((asset: any) => (
                 <div key={asset.id} className="flex items-center justify-between p-4 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa]">
                   <div>
                     <p className="text-[#111827] font-bold">{asset.name}</p>
                     <p className="text-[#6b7280] text-xs font-mono mt-0.5">{asset.tag}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[#10b981] font-bold text-lg">{asset.usage}</p>
                     <p className="text-[#6b7280] text-xs">Uses (Bookings/Allocations)</p>
                   </div>
                 </div>
               ))}
             </div>
          ) : (
            <div className="text-center py-8 text-[#6b7280]">No asset usage data found</div>
          )}
        </div>

        {/* Idle Assets */}
        <div className="bg-[#ffffff] p-6 rounded-2xl border border-[#e5e7eb] shadow-sm">
          <h2 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
            <AlertOutlined className="text-[#ef4444]" />
            Idle Assets (60+ Days)
          </h2>
          {assets.idleAssets.length > 0 ? (
             <div className="space-y-4">
               {assets.idleAssets.map((asset: any) => (
                 <div key={asset.id} className="flex items-center justify-between p-4 rounded-xl border border-[#fca5a5] bg-[#fef2f2]">
                   <div>
                     <p className="text-[#991b1b] font-bold">{asset.name}</p>
                     <p className="text-[#b91c1c] text-xs font-mono mt-0.5">{asset.tag}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[#991b1b] font-bold text-lg">{asset.daysIdle} days</p>
                     <p className="text-[#b91c1c] text-xs">Unused</p>
                   </div>
                 </div>
               ))}
             </div>
          ) : (
            <div className="text-center py-8 text-[#6b7280]">No idle assets found! Great utilization!</div>
          )}
        </div>

      </div>

    </div>
  );
}
