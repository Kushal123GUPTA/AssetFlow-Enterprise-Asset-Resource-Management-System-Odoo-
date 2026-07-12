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
import Card from "@/app/shared/components/Card";
import PageHeader, { PageShell } from "@/app/shared/components/PageHeader";
import ReportExportActions from "@/app/modules/reports/components/ReportExportActions";

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
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Insights"
        title="Organization-wide Analytics"
        description="Utilization, maintenance frequency, and asset lifecycles"
        actions={
          <ReportExportActions
            utilization={utilization}
            maintenance={maintenance}
            assets={assets}
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="flex h-[400px] flex-col">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-100">
            <BarChartOutlined className="text-primary" />
            Utilization by Department
          </h2>
          <div className="min-h-0 w-full flex-1">
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
        </Card>

        <Card className="flex h-[400px] flex-col">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-100">
            <LineChartOutlined className="text-primary" />
            Maintenance Frequency
          </h2>
          <div className="min-h-0 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={maintenance} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="requests" name="Requests" stroke="#ff6b00" strokeWidth={3} dot={{ r: 4, fill: '#ff6b00' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-100">
            <TrophyOutlined className="text-primary" />
            Most-used Assets
          </h2>
          {assets.mostUsed.length > 0 ? (
             <div className="space-y-3">
               {assets.mostUsed.map((asset: any) => (
                 <div key={asset.id} className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-950 p-4">
                   <div>
                     <p className="font-bold text-gray-100">{asset.name}</p>
                     <p className="mt-0.5 font-mono text-xs text-gray-500">{asset.tag}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-lg font-bold text-primary">{asset.usage}</p>
                     <p className="text-xs text-gray-500">Uses</p>
                   </div>
                 </div>
               ))}
             </div>
          ) : (
            <div className="py-8 text-center text-gray-500">No asset usage data found</div>
          )}
        </Card>

        <Card>
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-100">
            <AlertOutlined className="text-amber-600" />
            Idle Assets (60+ Days)
          </h2>
          {assets.idleAssets.length > 0 ? (
             <div className="space-y-3">
               {assets.idleAssets.map((asset: any) => (
                 <div key={asset.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4">
                   <div>
                     <p className="font-bold text-amber-950">{asset.name}</p>
                     <p className="mt-0.5 font-mono text-xs text-amber-800/80">{asset.tag}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-lg font-bold text-amber-900">{asset.daysIdle} days</p>
                     <p className="text-xs text-amber-800/80">Unused</p>
                   </div>
                 </div>
               ))}
             </div>
          ) : (
            <div className="py-8 text-center text-gray-500">No idle assets found! Great utilization!</div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
