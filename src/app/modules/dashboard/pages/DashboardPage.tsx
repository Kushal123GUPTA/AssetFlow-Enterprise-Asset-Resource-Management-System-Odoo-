"use client";

import { Card, Button, Select, Tag } from "antd";
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  RightOutlined, 
  GoogleOutlined, 
  WindowsOutlined, 
  SlackOutlined, 
  AppleOutlined,
  DashboardOutlined,
  LaptopOutlined,
  AppstoreAddOutlined
} from "@ant-design/icons";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Jonathan Cook";

  // Mock data for Areas to Address
  const areasToAddres = [
    {
      id: 1,
      icon: <GoogleOutlined className="text-blue-500" />,
      text: "24 users not using G-Suite",
    },
    {
      id: 2,
      icon: <WindowsOutlined className="text-blue-600" />,
      text: "15 devices without OS updates",
    },
    {
      id: 3,
      icon: <SlackOutlined className="text-purple-500" />,
      text: "5 licenses pending allocation",
    },
    {
      id: 4,
      icon: <AppleOutlined className="text-gray-800" />,
      text: "12 MacBooks need Jamf enrollment",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Welcome {userName}
          </h1>
          <p className="text-gray-400 text-sm font-semibold tracking-wide mt-1 uppercase">
            Company Statistics • Monday, 17 March 2025
          </p>
        </div>
        <Select 
          defaultValue="this-month" 
          style={{ width: 140 }}
          className="custom-select rounded-xl"
          options={[
            { value: 'this-month', label: 'This Month' },
            { value: 'last-month', label: 'Last Month' },
            { value: 'all-time', label: 'All Time' },
          ]}
        />
      </div>

      {/* Row 1: Expenses, Profiles, Ave Points */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Monthly Expenses */}
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden p-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-400 tracking-wide uppercase">Monthly expenses for Assets</span>
            <Button type="text" shape="circle" icon={<RightOutlined className="text-gray-400 text-xs" />} />
          </div>
          <div className="flex items-baseline gap-3 mt-4">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">$ 3,400</h2>
            <Tag color="orange" className="border-none bg-primary-light text-primary font-bold rounded-full py-0.5 px-2">
              <ArrowDownOutlined className="text-xs mr-0.5" /> 10.65%
            </Tag>
          </div>
          
          {/* Step Line Chart (SVG) */}
          <div className="h-32 mt-6 relative">
            <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient-orange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6b00" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ff6b00" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="10" x2="100" y2="10" stroke="#f3f4f6" strokeWidth="0.5" />
              <line x1="0" y1="25" x2="100" y2="25" stroke="#f3f4f6" strokeWidth="0.5" />
              <line x1="0" y1="40" x2="100" y2="40" stroke="#f3f4f6" strokeWidth="0.5" />
              
              {/* Fill Area */}
              <path 
                d="M 0 35 L 10 35 L 10 38 L 25 38 L 25 25 L 40 25 L 40 18 L 55 18 L 55 22 L 70 22 L 70 30 L 85 30 L 85 32 L 100 32 L 100 50 L 0 50 Z" 
                fill="url(#gradient-orange)" 
              />
              {/* Step Path */}
              <path 
                d="M 0 35 H 10 V 38 H 25 V 25 H 40 V 18 H 55 V 22 H 70 V 30 H 85 V 32 H 100" 
                fill="none" 
                stroke="#ff6b00" 
                strokeWidth="1.5" 
                strokeLinecap="round"
                strokeLinejoin="miter"
              />
              {/* Highlight Dot */}
              <circle cx="55" cy="18" r="1.5" fill="#ff6b00" />
            </svg>
          </div>
        </Card>

        {/* Card 2: User Profiles & Mini Cards */}
        <Card className="border-none shadow-sm rounded-2xl bg-white p-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-400 tracking-wide uppercase">Allocated Profiles</span>
            <Button type="text" shape="circle" icon={<RightOutlined className="text-gray-400 text-xs" />} />
          </div>
          <div className="mt-4">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">1.8K</h2>
            <p className="text-gray-400 text-xs font-semibold mt-1">12 new profiles added this week</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100/50">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <LaptopOutlined className="text-base" />
                <span className="text-xs font-bold uppercase tracking-wider">Devices</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900">2.8K</h3>
              <span className="text-[10px] font-bold text-green-600">11 New Devices</span>
            </div>

            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100/50">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <AppstoreAddOutlined className="text-base" />
                <span className="text-xs font-bold uppercase tracking-wider">Softwares</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900">84</h3>
              <span className="text-[10px] font-bold text-green-600">4 New Apps</span>
            </div>
          </div>
        </Card>

        {/* Card 3: Ave Points / Asset Health */}
        <Card className="border-none shadow-sm rounded-2xl bg-white p-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-400 tracking-wide uppercase">Asset Health Score</span>
          </div>
          <div className="flex flex-col items-center justify-center pt-2">
            {/* Radial Gauge Chart (SVG) */}
            <div className="relative w-40 h-28 flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full transform -rotate-180" viewBox="0 0 100 50">
                {/* Background arc */}
                <path 
                  d="M 15 45 A 35 35 0 0 1 85 45" 
                  fill="none" 
                  stroke="#f3f4f6" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  strokeDasharray="4,3"
                />
                {/* Foreground arc (79%) */}
                <path 
                  d="M 15 45 A 35 35 0 0 1 85 45" 
                  fill="none" 
                  stroke="url(#gauge-gradient)" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  strokeDasharray="4,3"
                  strokeDashoffset="24" // Matches 79%
                />
                <defs>
                  <linearGradient id="gauge-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ff9a00" />
                    <stop offset="100%" stopColor="#ff5200" />
                  </linearGradient>
                </defs>
                
                {/* Gauge Needle */}
                <g transform="translate(50,45) rotate(52)">
                  <line x1="0" y1="0" x2="0" y2="-32" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="0" cy="0" r="3" fill="#6b7280" />
                </g>
              </svg>
              <div className="absolute bottom-0 flex flex-col items-center">
                <span className="text-3xl font-black text-gray-900 leading-none">79%</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Excellent</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 font-semibold mt-4">Your Score: <span className="text-gray-900 font-bold">130/152</span></p>
          </div>
        </Card>
      </div>

      {/* Row 2: Asset Utilization & Areas to Address */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 4: Asset Utilization */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-transparent p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-sm font-bold text-gray-400 tracking-wide uppercase">Asset Utilization</span>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-3xl font-black text-gray-900">8.4 Hrs</h3>
                <span className="text-xs font-bold text-orange-600 flex items-center">
                  <ArrowUpOutlined className="text-xs mr-0.5" /> 10.65%
                </span>
              </div>
            </div>
            
            {/* Inner actions */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <Button size="small" type="primary" className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-3 border-none font-bold text-xs h-7">Devices</Button>
              <Button size="small" className="rounded-lg px-3 text-gray-500 font-bold text-xs h-7">Softwares</Button>
            </div>
          </div>

          {/* Bar Chart (Custom Tailwind Grid) */}
          <div className="mt-8 flex-1 flex items-end justify-between h-48 px-2 relative">
            {/* Guide line */}
            <div className="absolute left-0 right-0 top-[40%] border-t border-dashed border-gray-200 z-0">
              <span className="absolute -top-2.5 left-2 bg-gray-900 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-md shadow-sm">16hrs</span>
            </div>

            {[
              { label: "Sept 01", height: "45%" },
              { label: "Sept 02", height: "55%" },
              { label: "Sept 03", height: "50%" },
              { label: "Sept 04", height: "60%" },
              { label: "Sept 05", height: "78%", active: true },
              { label: "Sept 06", height: "40%" },
              { label: "Sept 07", height: "48%" },
              { label: "Sept 08", height: "82%" },
              { label: "Sept 09", height: "65%" },
            ].map((bar, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3 w-[8%] z-10">
                <div 
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    bar.active 
                      ? "bg-primary shadow-md shadow-primary/20" 
                      : "bg-orange-100 hover:bg-orange-200"
                  }`}
                  style={{ height: bar.height }}
                />
                <span className={`text-[10px] font-bold tracking-tight ${bar.active ? "text-primary font-black" : "text-gray-400"}`}>
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Areas to Address */}
        <Card className="border-none shadow-sm rounded-2xl bg-white p-2">
          <span className="text-sm font-bold text-gray-400 tracking-wide uppercase block mb-4">Areas To Address</span>
          <div className="space-y-4">
            {areasToAddres.map(item => (
              <div 
                key={item.id} 
                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all duration-200 border border-gray-50/50 hover:border-gray-100"
              >
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shadow-sm">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.text}</p>
                  <span className="text-[10px] font-bold text-primary hover:text-primary-hover cursor-pointer uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    Resolve <RightOutlined className="text-[8px]" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
