"use client";

import { useEffect, useState } from "react";
import {
  Table, Button, Modal, Form, Input, Select, DatePicker, Tag, Space, Popconfirm, message, Tooltip, Badge,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, FileSearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import Card from "@/app/shared/components/Card";
import PageHeader, { PageShell } from "@/app/shared/components/PageHeader";

interface AuditCycle {
  id: string;
  name: string;
  scopeDepartmentId: string | null;
  scopeDepartmentName: string | null;
  scopeLocation: string | null;
  startDate: string;
  endDate: string;
  status: "planned" | "in_progress" | "closed";
  createdAt: string;
}

interface Department { id: string; name: string; }

const STATUS_COLOR = { planned: "blue", in_progress: "orange", closed: "green" } as const;
const STATUS_LABEL = { planned: "Planned", in_progress: "In Progress", closed: "Closed" };

const API = {
  list: () => fetch("/api/modules/audit/routes/cycles").then((r) => r.json()),
  create: (b: object) =>
    fetch("/api/modules/audit/routes/cycles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json()),
  update: (id: string, b: object) =>
    fetch(`/api/modules/audit/routes/cycles/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json()),
  remove: (id: string) =>
    fetch(`/api/modules/audit/routes/cycles/${id}`, { method: "DELETE" }).then((r) => r.json()),
  departments: () => fetch("/api/modules/organization/routes/departments").then((r) => r.json()),
};

export default function AuditCyclesPage() {
  const [data, setData] = useState<AuditCycle[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AuditCycle | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    const [aRes, dRes] = await Promise.all([API.list(), API.departments()]);
    setData(aRes.data ?? []);
    setDepartments(dRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (row: AuditCycle) => {
    if (row.status === "closed") { message.warning("Cannot edit a closed audit cycle"); return; }
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      dateRange: [dayjs(row.startDate), dayjs(row.endDate)],
      scopeDepartmentId: row.scopeDepartmentId,
      scopeLocation: row.scopeLocation,
      status: row.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const { dateRange, ...rest } = values;
    const payload = {
      ...rest,
      startDate: dateRange[0].format("YYYY-MM-DD"),
      endDate: dateRange[1].format("YYYY-MM-DD"),
    };
    const res = editing ? await API.update(editing.id, payload) : await API.create(payload);
    if (res.error) { message.error(res.error); return; }
    message.success(editing ? "Audit cycle updated" : "Audit cycle created");
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const res = await API.remove(id);
    if (res.error) { message.error(res.error); return; }
    message.success("Audit cycle deleted");
    load();
  };

  const columns: ColumnsType<AuditCycle> = [
    { title: "Name", dataIndex: "name", key: "name", sorter: (a, b) => a.name.localeCompare(b.name), className: "font-semibold text-[#111827]" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: keyof typeof STATUS_COLOR) => <Tag color={STATUS_COLOR[s]} className="font-medium">{STATUS_LABEL[s]}</Tag>,
      filters: Object.entries(STATUS_LABEL).map(([v, t]) => ({ text: t, value: v })),
      onFilter: (v, r) => r.status === v,
    },
    {
      title: "Period",
      key: "period",
      render: (_, r) => <span className="text-[#111827]">{dayjs(r.startDate).format("DD MMM YYYY")} → {dayjs(r.endDate).format("DD MMM YYYY")}</span>,
    },
    {
      title: "Scope Department",
      key: "dept",
      render: (_, r) => r.scopeDepartmentName ? <span className="text-[#111827]">{r.scopeDepartmentName}</span> : <span className="text-[#6b7280] italic">All</span>,
    },
    {
      title: "Scope Location",
      key: "location",
      render: (_, r) => r.scopeLocation ? <span className="text-[#111827]">{r.scopeLocation}</span> : <span className="text-[#6b7280] italic">—</span>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <Space>
          <Tooltip title={r.status === "closed" ? "Closed — read only" : "Edit"}>
            <Button type="text" icon={<EditOutlined className={r.status === "closed" ? "text-[#1f2937]" : "text-[#6b7280] hover:text-[#ff6b00]"} />} onClick={() => openEdit(r)} disabled={r.status === "closed"} />
          </Tooltip>
          <Popconfirm title="Delete audit cycle?" onConfirm={() => handleDelete(r.id)} okText="Yes" cancelText="No">
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} disabled={r.status === "in_progress"} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Compliance"
        title={
          <span className="inline-flex items-center gap-2">
            <FileSearchOutlined className="text-primary" /> Audit Cycles
          </span>
        }
        description="Plan and manage asset audit cycles across the organization"
        actions={
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate} className="border-none bg-primary shadow-md hover:bg-primary-hover">
            New Audit Cycle
          </Button>
        }
      />

      <Card className="space-y-6">
        {/* Status summary */}
        <div className="flex gap-4 flex-wrap">
          {(["planned", "in_progress", "closed"] as const).map((s) => {
            const cnt = data.filter((d) => d.status === s).length;
            return (
              <div key={s} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-950 border border-gray-800">
                <Badge color={STATUS_COLOR[s]} />
                <span className="text-gray-500 text-sm font-medium">{STATUS_LABEL[s]}</span>
                <span className="font-bold text-gray-100 ml-1">{cnt}</span>
              </div>
            );
          })}
        </div>

        <Table
          rowKey="id"
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered={false}
          className="overflow-hidden rounded-xl border border-gray-800"
        />
      </Card>

      <Modal
        title={
          <div className="text-lg font-bold text-[#111827]">
            {editing ? "Edit Audit Cycle" : "New Audit Cycle"}
          </div>
        }
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editing ? "Save" : "Create"}
        okButtonProps={{ className: "bg-[#ff6b00] hover:bg-[#e05e00] border-none" }}
        destroyOnHidden
        centered
        width={560}
      >
        <Form form={form} layout="vertical" className="mt-6">
          <Form.Item name="name" label={<span className="font-medium text-[#111827]">Cycle Name</span>} rules={[{ required: true, message: "Required" }]}>
            <Input size="large" placeholder="e.g. Q3 2026 Full Audit" className="rounded-lg" />
          </Form.Item>
          <Form.Item name="dateRange" label={<span className="font-medium text-[#111827]">Period (Start → End)</span>} rules={[{ required: true, message: "Required" }]}>
            <DatePicker.RangePicker size="large" className="w-full rounded-lg" format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="scopeDepartmentId" label={<span className="font-medium text-[#111827]">Scope: Department</span>}>
            <Select size="large" allowClear placeholder="All departments" className="w-full rounded-lg" style={{ width: "100%" }}>
              {departments.map((d) => (
                <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="scopeLocation" label={<span className="font-medium text-[#111827]">Scope: Location</span>}>
            <Input size="large" placeholder="e.g. Headquarters Floor 3" className="w-full rounded-lg" style={{ width: "100%" }} />
          </Form.Item>
          {editing && (
            <Form.Item name="status" label={<span className="font-medium text-[#111827]">Status</span>}>
              <Select size="large" className="w-full rounded-lg" style={{ width: "100%" }}>
                <Select.Option value="planned">Planned</Select.Option>
                <Select.Option value="in_progress">In Progress</Select.Option>
                <Select.Option value="closed">Closed</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </PageShell>
  );
}
