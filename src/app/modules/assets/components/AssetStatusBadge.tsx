"use client";

import type { AssetStatus } from "../types";
import { ASSET_STATUS_COLORS, ASSET_STATUS_OPTIONS } from "../constants/asset.constants";

interface Props {
  status: AssetStatus;
}

export default function AssetStatusBadge({ status }: Props) {
  const config = ASSET_STATUS_COLORS[status];
  const label = ASSET_STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  );
}
