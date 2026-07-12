"use client";

import { Tabs } from "antd";
import { Building2, Tag, Users } from "lucide-react";
import PageHeader, { PageShell } from "@/app/shared/components/PageHeader";
import DepartmentsPage from "../departments/page";
import CategoriesPage from "../categories/page";
import EmployeesPage from "../employees/page";

export default function OrganizationSetupPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Organization"
        title="Organization Setup"
        description="Departments, asset categories, and the employee directory — master data everything else depends on"
      />
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
        <Tabs
          defaultActiveKey="departments"
          destroyInactiveTabPane={false}
          items={[
            {
              key: "departments",
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Departments
                </span>
              ),
              children: (
                <div className="pt-2 [&_.max-w-7xl]:max-w-none [&_.max-w-7xl]:p-0">
                  <DepartmentsPage />
                </div>
              ),
            },
            {
              key: "categories",
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Categories
                </span>
              ),
              children: (
                <div className="pt-2 [&_.max-w-7xl]:max-w-none [&_.max-w-7xl]:p-0">
                  <CategoriesPage />
                </div>
              ),
            },
            {
              key: "employees",
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Employees
                </span>
              ),
              children: (
                <div className="pt-2 [&_.max-w-7xl]:max-w-none [&_.max-w-7xl]:p-0">
                  <EmployeesPage />
                </div>
              ),
            },
          ]}
        />
      </div>
    </PageShell>
  );
}
