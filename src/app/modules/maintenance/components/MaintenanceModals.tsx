"use client";

import { Modal, Form, Input, Select, Radio, message } from "antd";
import { useEffect } from "react";
import { useAssetStore } from "@/app/modules/assets/hooks/useAssets";
import { CONDITION_OPTIONS } from "@/app/modules/assets/constants/asset.constants";

// 1. Assign Technician Modal
interface AssignProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (technicianName: string) => Promise<boolean>;
}

export function AssignTechnicianModal({ open, onClose, onSubmit }: AssignProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const handleFinish = async (values: { technicianName: string }) => {
    const success = await onSubmit(values.technicianName);
    if (success) {
      message.success("Technician assigned successfully");
      form.resetFields();
      onClose();
    } else {
      message.error("Failed to assign technician");
    }
  };

  return (
    <Modal
      open={open}
      title="Assign Technician"
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Assign"
      width={400}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
        <Form.Item
          name="technicianName"
          label="Technician Name"
          rules={[{ required: true, message: "Please input technician name" }]}
        >
          <Input placeholder="Enter technician's name..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// 2. Resolve Ticket Modal
interface ResolveProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    resolutionNotes?: string;
    assetCondition?: string;
    nextAssetStatus?: string;
  }) => Promise<boolean>;
}

export function ResolveMaintenanceModal({ open, onClose, onSubmit }: ResolveProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        nextAssetStatus: "available",
      });
    }
  }, [open, form]);

  const handleFinish = async (values: any) => {
    const success = await onSubmit({
      resolutionNotes: values.resolutionNotes,
      assetCondition: values.assetCondition,
      nextAssetStatus: values.nextAssetStatus,
    });
    if (success) {
      message.success("Maintenance resolved successfully");
      form.resetFields();
      onClose();
    } else {
      message.error("Failed to resolve maintenance");
    }
  };

  return (
    <Modal
      open={open}
      title="Resolve Maintenance"
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Complete Resolution"
      width={450}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
        <Form.Item
          name="resolutionNotes"
          label="Resolution Notes"
          rules={[{ required: true, message: "Please input resolution details" }]}
        >
          <Input.TextArea placeholder="Describe the repair actions, replaced parts, etc..." rows={3} />
        </Form.Item>

        <Form.Item
          name="assetCondition"
          label="Asset Condition After Repair"
          rules={[{ required: true, message: "Please select asset condition" }]}
        >
          <Select placeholder="Select condition" options={CONDITION_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="nextAssetStatus"
          label="Next Asset Status"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio value="available">Available (Revert back to active pool)</Radio>
            <Radio value="retired">Retired (Remove from active pool)</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
}

// 3. Raise Ticket Modal (For Asset Manager or Employee)
interface RaiseProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    assetId: string;
    issueDescription: string;
    priority: string;
  }) => Promise<boolean>;
}

export function RaiseMaintenanceModal({ open, onClose, onSubmit }: RaiseProps) {
  const [form] = Form.useForm();
  const { assets, fetchAssets } = useAssetStore();

  useEffect(() => {
    if (open) {
      form.resetFields();
      fetchAssets();
    }
  }, [open, form, fetchAssets]);

  const handleFinish = async (values: any) => {
    const success = await onSubmit({
      assetId: values.assetId,
      issueDescription: values.issueDescription,
      priority: values.priority,
    });
    if (success) {
      message.success("Maintenance request raised successfully");
      form.resetFields();
      onClose();
    } else {
      message.error("Failed to raise request");
    }
  };

  // We can request maintenance for any asset that is not retired/disposed
  const activeAssets = assets.filter((a) => a.status !== "retired" && a.status !== "disposed");

  return (
    <Modal
      open={open}
      title="Raise Maintenance Ticket"
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Submit Request"
      width={480}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
        <Form.Item
          name="assetId"
          label="Select Asset"
          rules={[{ required: true, message: "Please select an asset" }]}
        >
          <Select
            placeholder="Select asset to repair"
            showSearch
            optionFilterProp="label"
            options={activeAssets.map((a) => ({
              label: `${a.name} (${a.assetTag}) — ${a.status.toUpperCase()}`,
              value: a.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Priority Level"
          rules={[{ required: true, message: "Please select priority" }]}
          initialValue="medium"
        >
          <Select
            options={[
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
              { label: "Critical", value: "critical" },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="issueDescription"
          label="Issue Description"
          rules={[{ required: true, message: "Please describe the problem" }]}
        >
          <Input.TextArea placeholder="Describe the symptoms, physical damages, errors, etc..." rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
