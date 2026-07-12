"use client";

import { Modal, Form, Select, DatePicker, Radio, Input, Button, Alert, message } from "antd";
import { useEffect, useState } from "react";
import type { EmployeeOption, DepartmentOption } from "../types/allocation.types";
import { useAssetStore } from "@/app/modules/assets/hooks/useAssets";
import { useTransferStore } from "../hooks/useTransfers";
import { AlertCircle, ArrowLeftRight } from "lucide-react";
import dayjs from "dayjs";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    assetId: string;
    employeeId?: string;
    departmentId?: string;
    expectedReturnDate?: string;
    notes?: string;
  }) => Promise<boolean>;
  employees: EmployeeOption[];
  departments: DepartmentOption[];
}

export default function AllocationFormModal({ open, onClose, onSubmit, employees, departments }: Props) {
  const [form] = Form.useForm();
  const [targetType, setTargetType] = useState<"employee" | "department">("employee");
  const [custodian, setCustodian] = useState<any | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const { assets, fetchAssets } = useAssetStore();
  const { fetchCustodyStatus, createTransferRequest } = useTransferStore();

  useEffect(() => {
    if (open) {
      form.resetFields();
      setTargetType("employee");
      setCustodian(null);
      setSelectedAssetId(null);
      fetchAssets();
    }
  }, [open, form, fetchAssets]);

  // Allow choosing any non-retired/non-disposed asset for potential allocation or transfer
  const activeAssets = assets.filter(
    (a) => a.status !== "retired" && a.status !== "disposed"
  );

  const handleAssetChange = async (assetId: string) => {
    setSelectedAssetId(assetId);
    setCustodian(null);

    const asset = assets.find((a) => a.id === assetId);
    if (asset && asset.status !== "available") {
      // Fetch custody status of the active allocation
      const status = await fetchCustodyStatus(assetId);
      setCustodian(status);
    }
  };

  const handleFinish = async (values: any) => {
    const data = {
      assetId: values.assetId,
      employeeId: targetType === "employee" ? values.targetId : undefined,
      departmentId: targetType === "department" ? values.targetId : undefined,
      expectedReturnDate: values.expectedReturnDate ? values.expectedReturnDate.format("YYYY-MM-DD") : undefined,
      notes: values.notes || undefined,
    };

    const success = await onSubmit(data);
    if (success) {
      form.resetFields();
      onClose();
    }
  };

  const handleTransferRequest = async () => {
    const values = form.getFieldsValue();
    if (!selectedAssetId || !values.targetId) {
      message.error("Please fill in all target details first");
      return;
    }

    setSubmittingTransfer(true);
    const data = {
      assetId: selectedAssetId,
      toEmployeeId: targetType === "employee" ? values.targetId : undefined,
      toDepartmentId: targetType === "department" ? values.targetId : undefined,
    };

    const success = await createTransferRequest(data);
    setSubmittingTransfer(false);

    if (success) {
      message.success("Transfer request submitted successfully");
      form.resetFields();
      onClose();
    } else {
      message.error("Failed to submit transfer request");
    }
  };

  const isTaken = custodian !== null;

  return (
    <Modal
      open={open}
      title="Allocate Asset"
      onCancel={() => { form.resetFields(); onClose(); }}
      width={500}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={() => { form.resetFields(); onClose(); }}>
          Cancel
        </Button>,
        isTaken ? (
          <Button
            key="transfer"
            type="primary"
            icon={<ArrowLeftRight className="w-4 h-4 inline-block mr-1 align-text-bottom" />}
            onClick={handleTransferRequest}
            loading={submittingTransfer}
            className="bg-orange-500 hover:bg-orange-600 border-none"
          >
            Request Transfer
          </Button>
        ) : (
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            Allocate
          </Button>
        )
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
        <Form.Item name="assetId" label="Asset to Allocate" rules={[{ required: true, message: "Please select an asset" }]}>
          <Select
            placeholder="Select an asset"
            showSearch
            optionFilterProp="label"
            onChange={handleAssetChange}
            options={activeAssets.map((a) => ({
              label: `${a.name} (${a.assetTag}) — ${a.status.toUpperCase()}`,
              value: a.id,
            }))}
          />
        </Form.Item>

        {isTaken && (
          <div className="mb-4">
            <Alert
              message={
                <div>
                  <p className="font-semibold text-sm">Asset is currently taken</p>
                  <p className="text-xs mt-0.5">
                    Held by:{" "}
                    <span className="font-bold">
                      {custodian.employeeName ? `Employee: ${custodian.employeeName}` : `Department: ${custodian.departmentName}`}
                    </span>
                  </p>
                  {custodian.expectedReturnDate && (
                    <p className="text-xs">
                      Expected return: {dayjs(custodian.expectedReturnDate).format("YYYY-MM-DD")}
                    </p>
                  )}
                  <p className="text-xs text-orange-600 font-medium mt-1">
                    Direct allocation is blocked. Click &quot;Request Transfer&quot; below to submit a transfer workflow request instead.
                  </p>
                </div>
              }
              type="warning"
              showIcon
              icon={<AlertCircle className="w-5 h-5 text-amber-500" />}
            />
          </div>
        )}

        <Form.Item label="Allocate To" required>
          <Radio.Group value={targetType} onChange={(e) => { setTargetType(e.target.value); form.setFieldValue("targetId", undefined); }} className="mb-3">
            <Radio value="employee">Employee</Radio>
            <Radio value="department">Department</Radio>
          </Radio.Group>
        </Form.Item>

        {targetType === "employee" ? (
          <Form.Item name="targetId" label="Employee" rules={[{ required: true, message: "Please select an employee" }]}>
            <Select
              placeholder="Select employee"
              showSearch
              optionFilterProp="label"
              options={employees.map((e) => ({
                label: `${e.name} (${e.email})`,
                value: e.id,
              }))}
            />
          </Form.Item>
        ) : (
          <Form.Item name="targetId" label="Department" rules={[{ required: true, message: "Please select a department" }]}>
            <Select
              placeholder="Select department"
              showSearch
              optionFilterProp="label"
              options={departments.map((d) => ({
                label: d.name,
                value: d.id,
              }))}
            />
          </Form.Item>
        )}

        {!isTaken && (
          <Form.Item name="expectedReturnDate" label="Expected Return Date">
            <DatePicker className="!w-full" disabledDate={(current) => current && current < dayjs().startOf("day")} />
          </Form.Item>
        )}

        {!isTaken && (
          <Form.Item name="notes" label="Allocation Notes">
            <Input.TextArea placeholder="Add any details, notes or comments..." rows={3} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
