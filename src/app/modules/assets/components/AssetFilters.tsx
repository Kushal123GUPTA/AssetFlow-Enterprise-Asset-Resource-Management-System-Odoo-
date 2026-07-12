"use client";

import { Input, Select } from "antd";
import { Search } from "lucide-react";
import type { AssetFilters, CategoryOption, DepartmentOption } from "../types";
import { ASSET_STATUS_OPTIONS } from "../constants/asset.constants";

interface Props {
  filters: AssetFilters;
  categories: CategoryOption[];
  departments: DepartmentOption[];
  onChange: (filters: AssetFilters) => void;
}

export default function AssetFilterBar({ filters, categories, departments, onChange }: Props) {
  const update = (patch: Partial<AssetFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search by name, tag, serial..."
        prefix={<Search className="w-4 h-4 text-gray-400" />}
        value={filters.search ?? ""}
        onChange={(e) => update({ search: e.target.value })}
        allowClear
        className="!w-64"
      />
      <Select
        placeholder="Status"
        value={filters.status || undefined}
        onChange={(val) => update({ status: val || '' })}
        allowClear
        className="!w-44"
        options={ASSET_STATUS_OPTIONS.map((s) => ({ label: s.label, value: s.value }))}
      />
      <Select
        placeholder="Category"
        value={filters.categoryId || undefined}
        onChange={(val) => update({ categoryId: val || '' })}
        allowClear
        showSearch
        optionFilterProp="label"
        className="!w-44"
        options={categories.map((c) => ({ label: c.name, value: c.id }))}
      />
      <Select
        placeholder="Department"
        value={filters.departmentId || undefined}
        onChange={(val) => update({ departmentId: val || '' })}
        allowClear
        showSearch
        optionFilterProp="label"
        className="!w-44"
        options={departments.map((d) => ({ label: d.name, value: d.id }))}
      />
    </div>
  );
}
