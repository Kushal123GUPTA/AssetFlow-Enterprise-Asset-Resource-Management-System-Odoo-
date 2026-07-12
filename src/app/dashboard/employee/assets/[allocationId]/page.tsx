"use client";

import { use } from "react";
import MyAssetDetailsPage from "@/app/modules/allocation/pages/MyAssetDetailsPage";

export default function Page({
  params,
}: {
  params: Promise<{ allocationId: string }>;
}) {
  const { allocationId } = use(params);
  return <MyAssetDetailsPage allocationId={allocationId} />;
}
