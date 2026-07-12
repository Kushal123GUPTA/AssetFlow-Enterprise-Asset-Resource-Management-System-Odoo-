import { NextRequest } from "next/server";
import {
  getCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from "@/app/api/modules/organization/controllers/OrganizationController";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getCategoryHandler(req, id);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateCategoryHandler(req, id);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteCategoryHandler(req, id);
}
