import { NextRequest } from "next/server";
import { updateEmployeeRoleHandler } from "@/app/api/modules/organization/controllers/OrganizationController";

// PATCH /api/organization/employees/[id]/role
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateEmployeeRoleHandler(req, id);
}
