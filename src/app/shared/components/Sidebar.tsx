"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_ROUTES, RouteItem } from "../constants/routes";
import { LogoutOutlined, PlusOutlined } from "@ant-design/icons";
import { signOut, useSession } from "next-auth/react";
import { Avatar, Button } from "antd";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Group routes
  const groups: Record<string, RouteItem[]> = {
    GENERAL: [],
    UTILITIES: [],
    "SUPPORT & REPORTING": [],
  };

  SIDEBAR_ROUTES.forEach(route => {
    if (groups[route.group]) {
      groups[route.group].push(route);
    }
  });

  const renderMenuItem = (item: RouteItem) => {
    const isActive = item.path ? pathname.startsWith(item.path) : false;

    return (
      <Link href={item.path || "#"} key={item.key} className="block">
        <div 
          className={`flex items-center gap-3 px-4 py-2.5 my-1 rounded-xl cursor-pointer transition-all duration-200
            ${isActive 
              ? 'bg-primary-light text-primary font-bold shadow-sm' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
            }
          `}
        >
          <span className={`text-lg ${isActive ? 'text-primary' : 'text-gray-400'}`}>
            {item.icon}
          </span>
          <span className="text-sm tracking-wide">{item.label}</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-20">
      {/* Brand Logo Section */}
      <div className="h-20 flex items-center px-6 mt-2">
        <div className="flex items-center gap-3">
          {/* Stylized Orange Logo (SubMan-style) */}
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-md shadow-primary/20 transform rotate-6">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-gray-900 tracking-tight leading-none">AssetFlow</span>
            <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1">Enterprise</span>
          </div>
        </div>
      </div>

      {/* Prominent Action Button (+ Add Asset) */}
      <div className="px-4 mb-4">
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          className="w-full h-11 bg-primary hover:bg-primary-hover border-none rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
        >
          Add Asset
        </Button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-scrollbar">
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName} className="space-y-1">
            <span className="px-4 text-[10px] font-bold text-gray-400 tracking-wider uppercase block mb-2">
              {groupName}
            </span>
            {items.map(item => renderMenuItem(item))}
          </div>
        ))}
      </div>

      {/* User Profile Section (SubMan-style bottom footer) */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white transition-all duration-200 shadow-sm border border-transparent hover:border-gray-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar 
              size={36} 
              className="bg-primary-light text-primary font-bold flex-shrink-0 shadow-inner"
            >
              {session?.user?.name?.charAt(0) || "U"}
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-gray-800 truncate leading-tight">
                {session?.user?.name || "Jonathan Cook"}
              </span>
              <span className="text-[10px] font-medium text-gray-400 truncate mt-0.5">
                {session?.user?.email || "jonathan@example.com"}
              </span>
            </div>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 flex-shrink-0"
            title="Log Out"
          >
            <LogoutOutlined />
          </button>
        </div>
      </div>
    </div>
  );
}
