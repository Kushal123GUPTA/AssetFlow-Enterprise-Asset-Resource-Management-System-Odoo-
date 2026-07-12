"use client";

import { useEffect, useState } from "react";
import {
  Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message, Tooltip, Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

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
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="bg-[#ffffff] p-6 rounded-2xl border border-[#e5e7eb] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] flex items-center gap-2">
            <AppstoreOutlined className="text-[#ff6b00]" /> Asset Categories
          </h1>
          <p className="text-[#6b7280] text-sm mt-1">Define the category hierarchy for all your assets.</p>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate} className="bg-[#ff6b00] hover:bg-[#e05e00] border-none shadow-md">
          New Category
        </Button>
      </div>

      <div className="bg-[#ffffff] rounded-2xl border border-[#e5e7eb] shadow-sm p-6">
        <Table
          rowKey="id"
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          bordered={false}
          className="border border-[#e5e7eb] rounded-xl overflow-hidden"
        />
      </div>

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
        destroyOnClose
        centered
        width={450}
      >
        <Form form={form} layout="vertical" className="mt-6">
          <Form.Item name="name" label={<span className="font-medium text-[#111827]">Category Name</span>} rules={[{ required: true, message: "Required" }]}>
            <Input size="large" placeholder="e.g. Laptops" className="rounded-lg" />
          </Form.Item>
          <Form.Item name="parentCategoryId" label={<span className="font-medium text-[#111827]">Parent Category</span>}>
            <Select size="large" allowClear placeholder="None (root category)" className="rounded-lg">
              {data.filter((c) => !editing || c.id !== editing.id).map((c) => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
