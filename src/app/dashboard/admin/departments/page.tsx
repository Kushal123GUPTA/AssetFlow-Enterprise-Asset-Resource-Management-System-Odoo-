"use client";

import { useEffect, useState } from "react";
import {
  Table, Button, Modal, Form, Input, Select, Tag, Space, Popconfirm, message, Tooltip,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

interface Department {
  id: string;
  name: string;
  parentDepartmentId: string | null;
  headEmployeeId: string | null;
  headEmployeeName: string | null;
  status: "active" | "inactive";
  createdAt: string;
}

interface Employee { id: string; name: string; }

const API = {
  list: () => fetch("/api/modules/organization/routes/departments").then((r) => r.json()),
  create: (b: object) =>
    fetch("/api/modules/organization/routes/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json()),
  update: (id: string, b: object) =>
    fetch(`/api/modules/organization/routes/departments/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json()),
  remove: (id: string) =>
    fetch(`/api/modules/organization/routes/departments/${id}`, { method: "DELETE" }).then((r) => r.json()),
  employees: () => fetch("/api/modules/organization/routes/employees").then((r) => r.json()),
};

export default function DepartmentsPage() {
  const [data, setData] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    const [dRes, eRes] = await Promise.all([API.list(), API.employees()]);
    setData(dRes.data ?? []);
    setEmployees(eRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (row: Department) => {
    setEditing(row);
    form.setFieldsValue({ name: row.name, parentDepartmentId: row.parentDepartmentId, headEmployeeId: row.headEmployeeId, status: row.status });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const res = editing ? await API.update(editing.id, values) : await API.create(values);
    if (res.error) { message.error(res.error); return; }
    message.success(editing ? "Department updated" : "Department created");
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const res = await API.remove(id);
    if (res.error) { message.error(res.error); return; }
    message.success("Department deleted");
    load();
  };

  const columns: ColumnsType<Department> = [
    { title: "Name", dataIndex: "name", key: "name", sorter: (a, b) => a.name.localeCompare(b.name), className: "font-semibold text-[#111827]" },
    {
      title: "Head",
      key: "head",
      render: (_, r) => r.headEmployeeName ? <span className="text-[#ff6b00] font-medium">{r.headEmployeeName}</span> : <span className="text-[#6b7280] italic">—</span>,
    },
    {
      title: "Parent",
      key: "parent",
      render: (_, r) => r.parentDepartmentId
        ? <Tag className="border-[#e5e7eb] bg-[#f8f9fa] text-[#111827]">{data.find((d) => d.id === r.parentDepartmentId)?.name ?? "—"}</Tag>
        : <span className="text-[#6b7280]">—</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => <Tag color={s === "active" ? "green" : "default"} className="font-medium">{s.toUpperCase()}</Tag>,
      filters: [{ text: "Active", value: "active" }, { text: "Inactive", value: "inactive" }],
      onFilter: (v, r) => r.status === v,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined className="text-[#6b7280] hover:text-[#ff6b00]" />} onClick={() => openEdit(r)} />
          </Tooltip>
          <Popconfirm title="Delete this department?" onConfirm={() => handleDelete(r.id)} okText="Yes" cancelText="No">
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="bg-[#ffffff] p-6 rounded-2xl border border-[#e5e7eb] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] flex items-center gap-2">
            <TeamOutlined className="text-[#ff6b00]" /> Departments
          </h1>
          <p className="text-[#6b7280] text-sm mt-1">Manage all departments in your organization and their hierarchy.</p>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate} className="bg-[#ff6b00] hover:bg-[#e05e00] border-none shadow-md">
          New Department
        </Button>
      </div>

      <div className="bg-[#ffffff] rounded-2xl border border-[#e5e7eb] shadow-sm p-6">
        <Table
          rowKey="id"
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          bordered={false}
          className="border border-[#e5e7eb] rounded-xl overflow-hidden"
        />
      </div>

      <Modal
        title={
          <div className="text-lg font-bold text-[#111827]">
            {editing ? "Edit Department" : "New Department"}
          </div>
        }
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editing ? "Save" : "Create"}
        okButtonProps={{ className: "bg-[#ff6b00] hover:bg-[#e05e00] border-none" }}
        destroyOnClose
        centered
        width={450}
      >
        <Form form={form} layout="vertical" className="mt-6">
          <Form.Item name="name" label={<span className="font-medium text-[#111827]">Department Name</span>} rules={[{ required: true, message: "Required" }]}>
            <Input size="large" placeholder="e.g. Engineering" className="rounded-lg" />
          </Form.Item>
          <Form.Item name="parentDepartmentId" label={<span className="font-medium text-[#111827]">Parent Department</span>}>
            <Select size="large" allowClear placeholder="None (top-level)" className="rounded-lg">
              {data.filter((d) => !editing || d.id !== editing.id).map((d) => (
                <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="headEmployeeId" label={<span className="font-medium text-[#111827]">Department Head</span>}>
            <Select size="large" allowClear placeholder="Select employee" showSearch optionFilterProp="children" className="rounded-lg">
              {employees.map((e) => (
                <Select.Option key={e.id} value={e.id}>{e.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          {editing && (
            <Form.Item name="status" label={<span className="font-medium text-[#111827]">Status</span>}>
              <Select size="large" className="rounded-lg">
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
