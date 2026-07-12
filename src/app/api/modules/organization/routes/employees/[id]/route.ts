import { NextRequest } from "next/server";
import {
  getEmployeeHandler,
  updateEmployeeHandler,
  deleteEmployeeHandler,
} from "@/app/api/modules/organization/controllers/OrganizationController";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getEmployeeHandler(req, id);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateEmployeeHandler(req, id);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteEmployeeHandler(req, id);
}
