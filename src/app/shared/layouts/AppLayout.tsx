"use client";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <Sidebar />
      <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
