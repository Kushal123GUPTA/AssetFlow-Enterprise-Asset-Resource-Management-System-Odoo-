import { NextRequest } from "next/server";
import {
  getDepartmentHandler,
  updateDepartmentHandler,
  deleteDepartmentHandler,
} from "@/app/api/modules/organization/controllers/OrganizationController";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getDepartmentHandler(req, id);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateDepartmentHandler(req, id);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteDepartmentHandler(req, id);
}
