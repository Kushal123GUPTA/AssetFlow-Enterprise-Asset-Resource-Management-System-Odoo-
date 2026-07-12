"use client";

import { useEffect, useState } from "react";
import {
  Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message, Tooltip, Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import Card from "@/app/shared/components/Card";
import PageHeader, { PageShell } from "@/app/shared/components/PageHeader";

interface Category {
  id: string;
  name: string;
  parentCategoryId: string | null;
  customFieldsSchema: Record<string, unknown>;
  createdAt: string;
}

const API = {
  list: () => fetch("/api/modules/organization/routes/categories").then((r) => r.json()),
  create: (b: object) =>
    fetch("/api/modules/organization/routes/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json()),
  update: (id: string, b: object) =>
    fetch(`/api/modules/organization/routes/categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json()),
  remove: (id: string) =>
    fetch(`/api/modules/organization/routes/categories/${id}`, { method: "DELETE" }).then((r) => r.json()),
};

export default function CategoriesPage() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    const res = await API.list();
    setData(res.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (row: Category) => {
    setEditing(row);
    form.setFieldsValue({ name: row.name, parentCategoryId: row.parentCategoryId });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const res = editing ? await API.update(editing.id, values) : await API.create(values);
    if (res.error) { message.error(res.error); return; }
    message.success(editing ? "Category updated" : "Category created");
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const res = await API.remove(id);
    if (res.error) { message.error(res.error); return; }
    message.success("Category deleted");
    load();
  };

  const columns: ColumnsType<Category> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, r) => (
        <span className={r.parentCategoryId ? "pl-6 text-[#6b7280]" : "font-semibold text-[#111827]"}>
          {r.parentCategoryId ? `↳ ${name}` : name}
        </span>
      ),
    },
    {
      title: "Parent Category",
      key: "parent",
      render: (_, r) =>
        r.parentCategoryId
          ? <Tag className="border-[#e5e7eb] bg-[#f8f9fa] text-[#111827]">{data.find((c) => c.id === r.parentCategoryId)?.name ?? "—"}</Tag>
          : <Tag color="green" className="font-medium">Root Category</Tag>,
    },
    {
      title: "Custom Fields",
      key: "fields",
      render: (_, r) => {
        const keys = Object.keys(r.customFieldsSchema ?? {});
        return keys.length > 0
          ? keys.map((k) => <Tag key={k} color="blue">{k}</Tag>)
          : <span className="text-[#6b7280] italic">None</span>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined className="text-[#6b7280] hover:text-[#ff6b00]" />} onClick={() => openEdit(r)} />
          </Tooltip>
          <Popconfirm title="Delete this category?" onConfirm={() => handleDelete(r.id)} okText="Yes" cancelText="No">
            <Tooltip title="Delete">
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
            <AppstoreOutlined className="text-primary" /> Asset Categories
          </span>
        }
        description="Define the category hierarchy for all your assets."
        actions={
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate} className="border-none bg-primary shadow-md hover:bg-primary-hover">
            New Category
          </Button>
        }
      />

      <Card>
        <Table
          rowKey="id"
          dataSource={data}
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
            {editing ? "Edit Asset Category" : "New Asset Category"}
          </div>
        }
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editing ? "Save" : "Create"}
        okButtonProps={{ className: "bg-[#ff6b00] hover:bg-[#e05e00] border-none" }}
        destroyOnHidden
        centered
        width={450}
      >
        <Form form={form} layout="vertical" className="mt-6">
          <Form.Item name="name" label={<span className="font-medium text-[#111827]">Category Name</span>} rules={[{ required: true, message: "Required" }]}>
            <Input size="large" placeholder="e.g. Laptops" className="rounded-lg" />
          </Form.Item>
          <Form.Item name="parentCategoryId" label={<span className="font-medium text-[#111827]">Parent Category</span>}>
            <Select size="large" allowClear placeholder="None (root category)" className="w-full rounded-lg" style={{ width: "100%" }}>
              {data.filter((c) => !editing || c.id !== editing.id).map((c) => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
}
