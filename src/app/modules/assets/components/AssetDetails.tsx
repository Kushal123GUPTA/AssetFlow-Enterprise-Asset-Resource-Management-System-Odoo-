"use client";

import { Drawer, Tabs, Timeline, Tag, Descriptions, Spin, Empty } from "antd";
import { Package, QrCode, ImageIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Asset } from "../types";
import { useAssetStore } from "../hooks/useAssets";
import { useEffect } from "react";
import AssetStatusBadge from "./AssetStatusBadge";

interface Props {
  open: boolean;
  asset: Asset | null;
  onClose: () => void;
}

export default function AssetDetailsDrawer({ open, asset, onClose }: Props) {
  const { assetDetails, detailsLoading, fetchAssetDetails } = useAssetStore();

  useEffect(() => {
    if (open && asset) {
      fetchAssetDetails(asset.id);
    }
  }, [open, asset, fetchAssetDetails]);

  if (!asset) return null;

  const details = assetDetails;
  const enrichedAsset = details?.asset ?? asset;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-200">{asset.name}</p>
            <p className="text-xs font-mono text-primary">{asset.assetTag}</p>
          </div>
        </div>
      }
      width={560}
      destroyOnHidden
    >
      {detailsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spin />
        </div>
      ) : (
        <Tabs
          defaultActiveKey="info"
          items={[
            {
              key: "info",
              label: "Information",
              children: (
                <div className="space-y-5">
                  {/* Photo + QR Code Section */}
                  <div className="flex gap-4">
                    {/* Asset Photo */}
                    <div className="w-32 h-32 rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden flex items-center justify-center shrink-0">
                      {enrichedAsset.photoUrl ? (
                        <img src={enrichedAsset.photoUrl} alt={asset.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-gray-600">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-[10px]">No photo</span>
                        </div>
                      )}
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-gray-700 bg-gray-900">
                      {enrichedAsset.qrCode ? (
                        <>
                          <QRCodeSVG
                            value={enrichedAsset.qrCode}
                            size={96}
                            bgColor="transparent"
                            fgColor="#ff6b00"
                            level="M"
                          />
                          <div className="flex items-center gap-1.5">
                            <QrCode className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-mono text-gray-500">{asset.assetTag}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-gray-600 py-4 px-6">
                          <QrCode className="w-8 h-8" />
                          <span className="text-[10px]">No QR code</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details Table */}
                  <Descriptions column={1} bordered className="asset-desc">
                    <Descriptions.Item label="Asset Tag">
                      <span className="font-mono font-bold text-primary">{asset.assetTag}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Serial Number">{asset.serialNumber ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Category">{asset.categoryName ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Status"><AssetStatusBadge status={asset.status} /></Descriptions.Item>
                    <Descriptions.Item label="Condition">
                      {asset.condition ? (
                        <span className="capitalize">{asset.condition}</span>
                      ) : "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Location">{asset.location ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Department">{asset.departmentName ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Acquisition Date">{asset.acquisitionDate ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Acquisition Cost">
                      {asset.acquisitionCost ? `₹${parseFloat(asset.acquisitionCost).toLocaleString()}` : "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Bookable">
                      <Tag color={asset.isBookable ? "green" : "default"}>
                        {asset.isBookable ? "Yes — Shared Resource" : "No"}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="QR Code Value">
                      <span className="font-mono text-xs text-gray-500">{enrichedAsset.qrCode ?? "—"}</span>
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              ),
            },
            {
              key: "allocations",
              label: "Allocation History",
              children: details?.allocations?.length ? (
                <Timeline
                  items={details.allocations.map((a: any) => ({
                    color: a.status === "active" ? "green" : a.status === "overdue" ? "red" : "gray",
                    children: (
                      <div>
                        <p className="text-sm font-semibold text-gray-200">
                          {a.employeeName ?? a.departmentName ?? "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Allocated by {a.allocatedByName ?? "Unknown"} on {new Date(a.allocatedAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Tag color={a.status === "active" ? "green" : a.status === "overdue" ? "red" : "default"}>
                            {a.status}
                          </Tag>
                          {a.expectedReturnDate && (
                            <span className="text-xs text-gray-500">Due: {a.expectedReturnDate}</span>
                          )}
                        </div>
                      </div>
                    ),
                  }))}
                />
              ) : (
                <Empty description="No allocation history" />
              ),
            },
            {
              key: "status",
              label: "Status History",
              children: details?.statusHistory?.length ? (
                <Timeline
                  items={details.statusHistory.map((s: any) => ({
                    color: "blue",
                    children: (
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {s.fromStatus && (
                            <>
                              <AssetStatusBadge status={s.fromStatus} />
                              <span className="text-gray-500">→</span>
                            </>
                          )}
                          <AssetStatusBadge status={s.toStatus} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {s.changedByName ?? "System"} · {new Date(s.changedAt).toLocaleString()}
                        </p>
                        {s.reason && <p className="text-xs text-gray-400 mt-0.5">{s.reason}</p>}
                      </div>
                    ),
                  }))}
                />
              ) : (
                <Empty description="No status history" />
              ),
            },
            {
              key: "maintenance",
              label: "Maintenance",
              children: details?.maintenance?.length ? (
                <div className="space-y-3">
                  {details.maintenance.map((m: any) => (
                    <div key={m.id} className="p-3 rounded-xl border border-gray-700 bg-gray-900">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-200">{m.issueDescription}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(m.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Tag color={m.priority === "critical" ? "red" : m.priority === "high" ? "orange" : m.priority === "medium" ? "gold" : "green"}>
                          {m.priority}
                        </Tag>
                      </div>
                      <Tag className="mt-2" color={m.status === "resolved" ? "green" : m.status === "pending" ? "orange" : "blue"}>
                        {m.status}
                      </Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="No maintenance records" />
              ),
            },
          ]}
        />
      )}
    </Drawer>
  );
}
