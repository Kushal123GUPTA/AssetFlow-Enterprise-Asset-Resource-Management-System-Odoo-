"use client";

import { Modal, Form, Input, Select, DatePicker, Switch, InputNumber, Upload, message } from "antd";
import { useEffect, useState } from "react";
import { Upload as UploadIcon, ImagePlus, X } from "lucide-react";
import type { Asset, AssetFormData, CategoryOption, DepartmentOption } from "../types";
import { CONDITION_OPTIONS } from "../constants/asset.constants";
import dayjs from "dayjs";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AssetFormData) => Promise<boolean>;
  categories: CategoryOption[];
  departments: DepartmentOption[];
  editAsset?: Asset | null;
}

export default function AssetFormModal({ open, onClose, onSubmit, categories, departments, editAsset }: Props) {
  const [form] = Form.useForm();
  const isEdit = !!editAsset;
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open && editAsset) {
      form.setFieldsValue({
        name: editAsset.name,
        categoryId: editAsset.categoryId,
        serialNumber: editAsset.serialNumber ?? "",
        acquisitionDate: editAsset.acquisitionDate ? dayjs(editAsset.acquisitionDate) : null,
        acquisitionCost: editAsset.acquisitionCost ? parseFloat(editAsset.acquisitionCost) : null,
        condition: editAsset.condition ?? undefined,
        location: editAsset.location ?? "",
        departmentId: editAsset.departmentId ?? undefined,
        isBookable: editAsset.isBookable,
        photoUrl: editAsset.photoUrl ?? "",
      });
      setPhotoPreview(editAsset.photoUrl ?? null);
    } else if (open) {
      form.resetFields();
      setPhotoPreview(null);
    }
  }, [open, editAsset, form]);

  const handleFinish = async (values: any) => {
    const data: AssetFormData = {
      name: values.name,
      categoryId: values.categoryId,
      serialNumber: values.serialNumber || undefined,
      acquisitionDate: values.acquisitionDate ? values.acquisitionDate.format("YYYY-MM-DD") : undefined,
      acquisitionCost: values.acquisitionCost ? String(values.acquisitionCost) : undefined,
      condition: values.condition || undefined,
      location: values.location || undefined,
      departmentId: values.departmentId || undefined,
      isBookable: values.isBookable ?? false,
      photoUrl: values.photoUrl || undefined,
    };

    const success = await onSubmit(data);
    if (success) {
      message.success(isEdit ? "Asset updated successfully" : "Asset registered successfully");
      form.resetFields();
      setPhotoPreview(null);
      onClose();
    }
  };

  // Convert uploaded file to base64 data URL for preview + storage
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhotoPreview(dataUrl);
      form.setFieldValue("photoUrl", dataUrl);
    };
    reader.readAsDataURL(file);
    return false; // prevent default upload behavior
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Edit Asset" : "Register New Asset"}
      onCancel={() => { form.resetFields(); setPhotoPreview(null); onClose(); }}
      onOk={() => form.submit()}
      okText={isEdit ? "Update" : "Register Asset"}
      width={680}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
        {/* Photo Upload Section */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-400 mb-2">Asset Photo</p>
          <div className="flex items-start gap-4">
            {/* Preview */}
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900 flex items-center justify-center overflow-hidden relative group">
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Asset" className="w-full h-full object-cover rounded-2xl" />
                  <button
                    type="button"
                    onClick={() => { setPhotoPreview(null); form.setFieldValue("photoUrl", ""); }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <ImagePlus className="w-8 h-8 text-gray-600" />
              )}
            </div>
            {/* Upload controls */}
            <div className="flex-1 space-y-2">
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleFileUpload}
                maxCount={1}
              >
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-700 bg-gray-900 hover:bg-gray-800 text-sm text-gray-300 transition-colors"
                >
                  <UploadIcon className="w-4 h-4" />
                  Upload Photo
                </button>
              </Upload>
              <p className="text-xs text-gray-500">Or paste an image URL below</p>
              <Form.Item name="photoUrl" noStyle>
                <Input
                  placeholder="https://example.com/photo.jpg"
                  onChange={(e) => {
                    const url = e.target.value;
                    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
                      setPhotoPreview(url);
                    }
                  }}
                  className="!text-sm"
                />
              </Form.Item>
            </div>
          </div>
        </div>

        {/* Main fields grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item name="name" label="Asset Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="e.g. Dell XPS 15 Laptop" className="w-full rounded-lg" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="categoryId" label="Category" rules={[{ required: true, message: "Category is required" }]}>
            <Select
              placeholder="Select category"
              showSearch
              optionFilterProp="label"
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              className="w-full rounded-lg"
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item name="serialNumber" label="Serial Number">
            <Input placeholder="e.g. SN-123456" className="w-full rounded-lg" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="condition" label="Condition">
            <Select placeholder="Select condition" options={CONDITION_OPTIONS} allowClear className="w-full rounded-lg" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="acquisitionDate" label="Acquisition Date">
            <DatePicker className="w-full rounded-lg" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="acquisitionCost" label="Acquisition Cost">
            <InputNumber placeholder="0.00" min={0} precision={2} className="w-full rounded-lg" prefix="₹" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="location" label="Location">
            <Input placeholder="e.g. Building A, Floor 3" className="w-full rounded-lg" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="departmentId" label="Department">
            <Select
              placeholder="Select department"
              showSearch
              optionFilterProp="label"
              options={departments.map((d) => ({ label: d.name, value: d.id }))}
              allowClear
              className="w-full rounded-lg"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </div>

        {/* Bottom row */}
        <Form.Item name="isBookable" label="Shared / Bookable Resource" valuePropName="checked">
          <Switch checkedChildren="Yes" unCheckedChildren="No" />
        </Form.Item>

        {/* QR Code Info */}
        <div className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-3">
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-400">📱 QR Code:</span>{" "}
            {isEdit
              ? "The QR code was auto-generated when this asset was registered. View it in the asset details."
              : "A unique QR code will be auto-generated from the asset tag after registration."
            }
          </p>
        </div>
      </Form>
    </Modal>
  );
}
