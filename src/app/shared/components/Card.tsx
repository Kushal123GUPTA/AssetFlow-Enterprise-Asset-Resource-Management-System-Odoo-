import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: boolean;
};

export default function Card({
  children,
  className = "",
  padding = true,
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-800 bg-gray-900 shadow-sm ${
        padding ? "p-5 sm:p-6" : ""
      } ${className}`.trim()}
    >
      {children}
    </div>
  );
}
