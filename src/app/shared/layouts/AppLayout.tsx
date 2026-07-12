"use client";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopNavbar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
