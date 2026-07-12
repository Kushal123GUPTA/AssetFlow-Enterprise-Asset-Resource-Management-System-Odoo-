"use client";

import Sidebar from "./Sidebar";
import { BellOutlined, QuestionCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { Input, Badge, Avatar } from "antd";
import { useSession } from "next-auth/react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-app-bg flex font-sans">
      {/* Fixed Left Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        
        {/* Top Header/Navbar (SubMan-style) */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm shadow-gray-500/5">
          {/* Search box (rounded pill, light gray background) */}
          <div className="w-96">
            <Input 
              prefix={<SearchOutlined className="text-gray-400 mr-1.5" />} 
              placeholder="Search or type a command..." 
              className="rounded-full bg-gray-50/80 border-transparent hover:bg-gray-100/80 focus:bg-white hover:border-gray-200 focus:border-primary/50 focus:shadow-md transition-all py-2 px-4 text-sm"
            />
          </div>
          
          {/* Top-Right Header Icons */}
          <div className="flex items-center gap-6">
            <button className="text-gray-400 hover:text-primary transition-all p-2 rounded-xl hover:bg-gray-50 flex items-center justify-center">
              <QuestionCircleOutlined className="text-xl" />
            </button>
            
            <button className="text-gray-400 hover:text-primary transition-all p-2 rounded-xl hover:bg-gray-50 flex items-center justify-center">
              <Badge count={3} size="small" offset={[2, -2]}>
                <BellOutlined className="text-xl text-gray-400 hover:text-primary transition-colors" />
              </Badge>
            </button>

            {/* Profile pill indicator */}
            <div className="flex items-center gap-2 border-l border-gray-200 pl-6">
              <Avatar 
                src={session?.user?.image} 
                className="bg-primary text-white font-bold cursor-pointer hover:opacity-90 transition-opacity"
              >
                {session?.user?.name?.charAt(0) || "A"}
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-8 overflow-x-hidden">
          <div className="max-w-[1400px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
