"use client";

import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  panelTitle?: string;
  panelSubtitle?: string;
};

export default function AuthSplitShell({
  children,
  panelTitle = "Asset Management Information System",
  panelSubtitle = "Streamline tracking, optimize maintenance, and unlock resource efficiency across your enterprise.",
}: Props) {
  return (
    <div className="h-screen overflow-hidden flex items-center justify-center bg-[#e8eaed] px-3 sm:px-6">
      <div className="w-full max-w-5xl h-[min(36rem,calc(100vh-1.5rem))] overflow-hidden rounded-2xl sm:rounded-[1.75rem] bg-white shadow-[0_25px_60px_-20px_rgba(15,23,42,0.35)] grid grid-cols-1 lg:grid-cols-2">
        {/* Left hero */}
        <div className="relative hidden lg:flex flex-col justify-center p-8 xl:p-10 overflow-hidden bg-slate-950">
          <Image
            src="/brand/auth-hero.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-50"
            sizes="(min-width: 1024px) 50vw, 0px"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/75 to-slate-900/60" />
          <div className="relative z-10 max-w-md space-y-3">
            <h1 className="text-2xl xl:text-3xl font-extrabold text-white leading-tight tracking-tight">
              {panelTitle}
            </h1>
            <p className="text-sm text-slate-200/90 leading-relaxed font-medium">
              {panelSubtitle}
            </p>
          </div>
        </div>

        {/* Right form pane — no outer page scroll; content fits the card */}
        <div className="flex flex-col justify-center px-5 py-5 sm:px-8 lg:px-10 bg-white overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
