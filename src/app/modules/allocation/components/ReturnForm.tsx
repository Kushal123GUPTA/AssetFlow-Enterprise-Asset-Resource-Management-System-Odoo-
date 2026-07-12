"use client";

import { Modal, Form, Select, DatePicker, Input, message } from "antd";
import { useEffect } from "react";
import type { Allocation } from "../types/allocation.types";
import { CONDITION_OPTIONS } from "@/app/modules/assets/constants/asset.constants";
import dayjs from "dayjs";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    allocationId: string;
    actualReturnDate: string;
    condition: string;
    checkInNotes?: string;
  }) => Promise<boolean>;
  allocation: Allocation | null;
}

export default function ReturnFormModal({ open, onClose, onSubmit, allocation }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        actualReturnDate: dayjs(),
      });
    }
  }, [open, form]);

  if (!allocation) return null;

  const handleFinish = async (values: any) => {
    const data = {
      allocationId: allocation.id,
      actualReturnDate: values.actualReturnDate.format("YYYY-MM-DD"),
      condition: values.condition,
      checkInNotes: values.checkInNotes || undefined,
    };

    const success = await onSubmit(data);
    if (success) {
      message.success("Asset returned successfully");
      form.resetFields();
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      title={
        <div>
          <p className="text-base font-bold text-gray-200">Process Asset Return</p>
          <p className="text-xs text-gray-500 mt-0.5">Asset: {allocation.assetName} ({allocation.assetTag})</p>
        </div>
      }
      onCancel={() => { form.resetFields(); onClose(); }}
      onOk={() => form.submit()}
      okText="Return Asset"
      width={480}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
        <Form.Item name="actualReturnDate" label="Return Date" rules={[{ required: true, message: "Please select return date" }]}>
          <DatePicker className="!w-full" />
        </Form.Item>

        <Form.Item name="condition" label="Return Condition" rules={[{ required: true, message: "Please select condition" }]}>
          <Select placeholder="Select condition" options={CONDITION_OPTIONS} />
        </Form.Item>

        <Form.Item name="checkInNotes" label="Check-In Notes">
          <Input.TextArea placeholder="Add condition details, missing accessories, or check-in notes..." rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
