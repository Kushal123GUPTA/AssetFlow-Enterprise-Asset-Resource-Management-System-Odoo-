"use client";

import Image from "next/image";

type AuthLogoProps = {
  className?: string;
  showWordmark?: boolean;
};

export default function AuthLogo({
  className = "",
  showWordmark = true,
}: AuthLogoProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <Image
        src="/brand/icon.png"
        alt="AssetFlow"
        width={56}
        height={56}
        className="rounded-2xl shadow-md shadow-orange-500/20"
        priority
      />
      {showWordmark && (
        <div className="text-center">
          <p className="text-2xl font-black text-gray-100 tracking-tight leading-none">
            AssetFlow
          </p>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1.5">
            Asset & Resource Management
          </p>
        </div>
      )}
    </div>
  );
}
