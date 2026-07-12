"use client";

import { useEffect, useState } from "react";
import {
  Table, Button, Modal, Form, Input, Select, Tag, Space, Popconfirm, message, Tooltip, Avatar,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, KeyOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import Card from "@/app/shared/components/Card";
import PageHeader, { PageShell } from "@/app/shared/components/PageHeader";

type Role = "admin" | "asset_manager" | "department_head" | "employee";
type Status = "active" | "inactive";

interface Employee {
  id: string;
  name: string;
  email: string;
  departmentId: string | null;
  role: Role;
  status: Status;
  createdAt: string;
}

interface Department { id: string; name: string; }

const ROLE_COLOR: Record<Role, string> = {
  admin: "purple",
  asset_manager: "blue",
  department_head: "cyan",
  employee: "default",
};

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  asset_manager: "Asset Manager",
  department_head: "Dept Head",
  employee: "Employee",
};

const API = {
  list: () => fetch("/api/modules/organization/routes/employees").then((r) => r.json()),
  create: (b: object) =>
    fetch("/api/modules/organization/routes/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json()),
  update: (id: string, b: object) =>
    fetch(`/api/modules/organization/routes/employees/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json()),
  updateRole: (id: string, role: Role) =>
    fetch(`/api/modules/organization/routes/employees/${id}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) }).then((r) => r.json()),
  remove: (id: string) =>
    fetch(`/api/modules/organization/routes/employees/${id}`, { method: "DELETE" }).then((r) => r.json()),
  departments: () => fetch("/api/modules/organization/routes/departments").then((r) => r.json()),
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const [eRes, dRes] = await Promise.all([API.list(), API.departments()]);
    setEmployees(eRes.data ?? []);
    setDepartments(dRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (row: Employee) => {
    setEditing(row);
    form.setFieldsValue({ name: row.name, departmentId: row.departmentId, status: row.status });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const res = editing ? await API.update(editing.id, values) : await API.create(values);
    if (res.error) { message.error(res.error); return; }
    message.success(editing ? "Employee updated" : "Employee created");
    setModalOpen(false);
    load();
  };

  const handleRoleChange = async (id: string, role: Role) => {
    setRoleLoading(id);
    const res = await API.updateRole(id, role);
    setRoleLoading(null);
    if (res.error) { message.error(res.error); return; }
    message.success("Role updated");
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, role } : e)));
  };

  const handleDelete = async (id: string) => {
    const res = await API.remove(id);
    if (res.error) { message.error(res.error); return; }
    message.success("Employee removed");
    load();
  };

  const columns: ColumnsType<Employee> = [
    {
      title: "Employee",
      key: "employee",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <Avatar size="default" icon={<UserOutlined />} className="bg-[#ff6b00]/20 text-[#ff6b00]" />
          <div>
            <div className="font-semibold text-[#111827] text-sm">{r.name}</div>
            <div className="text-[#6b7280] text-xs">{r.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Department",
      key: "dept",
      render: (_, r) =>
        r.departmentId
          ? <span className="text-[#111827] font-medium">{departments.find((d) => d.id === r.departmentId)?.name ?? "—"}</span>
          : <span className="text-[#6b7280] italic">Unassigned</span>,
    },
    {
      title: "Role",
      key: "role",
      width: 220,
      render: (_, r) => (
        <Select
          value={r.role}
          size="middle"
          loading={roleLoading === r.id}
          onChange={(val) => handleRoleChange(r.id, val as Role)}
          className="w-44"
        >
          {(Object.entries(ROLE_LABEL) as [Role, string][]).map(([v, label]) => (
            <Select.Option key={v} value={v}>
              <Tag color={ROLE_COLOR[v]} className="mr-1">{label}</Tag>
            </Select.Option>
          ))}
        </Select>
      ),
      filters: (Object.entries(ROLE_LABEL) as [Role, string][]).map(([v, t]) => ({ text: t, value: v })),
      onFilter: (v, r) => r.role === v,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => <Tag color={s === "active" ? "green" : "default"}>{s.toUpperCase()}</Tag>,
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
          <Popconfirm title="Remove this employee?" onConfirm={() => handleDelete(r.id)} okText="Yes" cancelText="No">
            <Tooltip title="Remove">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Organization"
        title={
          <span className="inline-flex items-center gap-2">
            <KeyOutlined className="text-primary" /> Employees &amp; Role Assignment
          </span>
        }
        description="Manage the employee directory and assign roles securely."
        actions={
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate} className="border-none bg-primary shadow-md hover:bg-primary-hover">
            Add Employee
          </Button>
        }
      />

      <Card className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Input.Search
            placeholder="Search by name or email…"
            allowClear
            size="large"
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />

          {/* Role breakdown */}
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(ROLE_LABEL) as [Role, string][]).map(([role, label]) => {
              const cnt = employees.filter((e) => e.role === role).length;
              return (
                <div key={role} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-800 bg-gray-950">
                  <Tag color={ROLE_COLOR[role]} className="m-0 border-none font-medium">{label}</Tag>
                  <span className="font-bold text-gray-100">{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <Table
          rowKey="id"
          dataSource={filtered}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          bordered={false}
          className="overflow-hidden rounded-xl border border-gray-800"
        />
      </Card>

      <Modal
        title={
          <div className="text-lg font-bold text-[#111827]">
            {editing ? "Edit Employee Details" : "Add New Employee"}
          </div>
        }
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editing ? "Save Changes" : "Create Employee"}
        okButtonProps={{ className: "bg-[#ff6b00] hover:bg-[#e05e00] border-none" }}
        destroyOnClose
        centered
        width={500}
      >
        <Form form={form} layout="vertical" className="mt-6">
          <Form.Item name="name" label={<span className="font-medium text-[#111827]">Full Name</span>} rules={[{ required: true, message: "Required" }]}>
            <Input size="large" prefix={<UserOutlined className="text-[#6b7280]" />} placeholder="John Doe" className="rounded-lg" />
          </Form.Item>
          {!editing && (
            <>
              <Form.Item name="email" label={<span className="font-medium text-[#111827]">Email Address</span>} rules={[{ required: true, type: "email", message: "Valid email required" }]}>
                <Input size="large" placeholder="john@company.com" className="rounded-lg" />
              </Form.Item>
              <Form.Item name="password" label={<span className="font-medium text-[#111827]">Temporary Password</span>} rules={[{ required: true, min: 8, message: "Min 8 characters" }]}>
                <Input.Password size="large" placeholder="Enter secure password" className="rounded-lg" />
              </Form.Item>
              <Form.Item name="role" label={<span className="font-medium text-[#111827]">Access Role</span>} initialValue="employee">
                <Select size="large" className="w-full rounded-lg" style={{ width: "100%" }}>
                  {(Object.entries(ROLE_LABEL) as [Role, string][]).map(([v, l]) => (
                    <Select.Option key={v} value={v}>{l}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}
          <Form.Item name="departmentId" label={<span className="font-medium text-[#111827]">Department</span>}>
            <Select size="large" allowClear placeholder="Assign to department" className="w-full rounded-lg" style={{ width: "100%" }}>
              {departments.map((d) => (
                <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          {editing && (
            <Form.Item name="status" label={<span className="font-medium text-[#111827]">Account Status</span>}>
              <Select size="large" className="w-full rounded-lg" style={{ width: "100%" }}>
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </PageShell>
  );
}
