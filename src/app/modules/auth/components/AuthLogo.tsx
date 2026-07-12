"use client";

import Image from "next/image";

type AuthLogoProps = {
  className?: string;
  showWordmark?: boolean;
  /** Wireframe layout: icon + wordmark in a row, left-aligned */
  align?: "center" | "start";
};

export default function AuthLogo({
  className = "",
  showWordmark = true,
  align = "center",
}: AuthLogoProps) {
  const isStart = align === "start";

  return (
    <div
      className={`flex gap-3 ${isStart ? "flex-row items-center" : "flex-col items-center"} ${className}`}
    >
      <Image
        src="/brand/icon.png"
        alt="AssetFlow"
        width={isStart ? 44 : 56}
        height={isStart ? 44 : 56}
        className="rounded-xl shrink-0"
        priority
      />
      {showWordmark && (
        <div className={isStart ? "text-left" : "text-center"}>
          <p
            className={`font-black tracking-tight leading-none text-slate-900 ${
              isStart ? "text-xl" : "text-2xl"
            }`}
          >
            AssetFlow
          </p>
          <p
            className={`font-bold tracking-[0.18em] uppercase mt-1 text-slate-400 ${
              isStart ? "text-[9px]" : "text-[10px]"
            }`}
          >
            Asset & Resource Management
          </p>
        </div>
      )}
    </div>
  );
}
