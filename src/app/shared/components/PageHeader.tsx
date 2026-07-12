import type { ReactNode } from "react";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
  className?: string;
};

export function PageShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-6xl space-y-6 pb-2 ${className}`.trim()}>
      {children}
    </div>
  );
}

export default function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6 ${className}`.trim()}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
