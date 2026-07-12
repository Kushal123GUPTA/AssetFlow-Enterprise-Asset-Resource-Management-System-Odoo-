"use client";

import { Modal, Form, Input, Select, DatePicker, Button, message } from "antd";
import { useEffect, useState } from "react";
import type { EmployeeOption, DepartmentOption } from "../../allocation/types/allocation.types";
import dayjs from "dayjs";

interface CreateProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    scopeDepartmentId?: string;
    scopeLocation?: string;
    startDate: string;
    endDate: string;
    auditorIds?: string[];
  }) => Promise<boolean>;
  employees: EmployeeOption[];
  departments: DepartmentOption[];
}

export function CreateAuditCycleModal({ open, onClose, onSubmit, employees, departments }: CreateProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const handleFinish = async (values: any) => {
    setSubmitting(true);
    const startDate = values.dateRange ? values.dateRange[0].format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
    const endDate = values.dateRange ? values.dateRange[1].format("YYYY-MM-DD") : dayjs().add(7, "day").format("YYYY-MM-DD");

    const success = await onSubmit({
      name: values.name,
      scopeDepartmentId: values.scopeDepartmentId || undefined,
      scopeLocation: values.scopeLocation || undefined,
      startDate,
      endDate,
      auditorIds: values.auditorIds || [],
    });
    setSubmitting(false);

    if (success) {
      message.success("Audit campaign created successfully");
      form.resetFields();
      onClose();
    } else {
      message.error("Failed to create audit campaign");
    }
  };

  return (
    <Modal
      open={open}
      title="Create Audit Campaign"
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText="Create Campaign"
      width={500}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
        <Form.Item
          name="name"
          label="Campaign Name"
          rules={[{ required: true, message: "Please input campaign name" }]}
        >
          <Input placeholder="e.g. Q3 IT Hardware Audit 2026" />
        </Form.Item>

        <Form.Item name="scopeDepartmentId" label="Scope: Department (Optional)">
          <Select
            placeholder="Select a department to audit"
            allowClear
            showSearch
            optionFilterProp="label"
            options={departments.map((d) => ({ label: d.name, value: d.id }))}
          />
        </Form.Item>

        <Form.Item name="scopeLocation" label="Scope: Location / Room (Optional)">
          <Input placeholder="e.g. Floor 2 / HQ Lab" />
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="Audit Duration"
          rules={[{ required: true, message: "Please select audit duration" }]}
        >
          <DatePicker.RangePicker className="!w-full" disabledDate={(current) => current && current < dayjs().startOf("day")} />
        </Form.Item>

        <Form.Item name="auditorIds" label="Assign Auditors">
          <Select
            mode="multiple"
            placeholder="Select one or more auditors"
            allowClear
            showSearch
            optionFilterProp="label"
            options={employees.map((e) => ({ label: `${e.name} (${e.email})`, value: e.id }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// Verification Modal for individual Audit Items
interface VerifyProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (status: string, notes?: string) => Promise<boolean>;
  assetName: string;
  assetTag: string;
}

export function VerifyAssetModal({ open, onClose, onSubmit, assetName, assetTag }: VerifyProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const handleFinish = async (values: any) => {
    setSubmitting(true);
    const success = await onSubmit(values.status, values.notes);
    setSubmitting(false);

    if (success) {
      form.resetFields();
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      title={`Verify Asset: ${assetName} (${assetTag})`}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText="Submit Status"
      width={400}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
        <Form.Item
          name="status"
          label="Audit Status"
          rules={[{ required: true, message: "Please select verification status" }]}
          initialValue="verified"
        >
          <Select
            options={[
              { label: "Verified (Available / Good)", value: "verified" },
              { label: "Missing (Not found in location)", value: "missing" },
              { label: "Damaged (Requires repair)", value: "damaged" },
            ]}
          />
        </Form.Item>

        <Form.Item name="notes" label="Audit Verification Notes">
          <Input.TextArea placeholder="Enter serial numbers, physical condition, labels verified..." rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
