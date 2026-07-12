import { NextRequest } from "next/server";
import {
  listDepartmentsHandler,
  createDepartmentHandler,
} from "@/app/api/modules/organization/controllers/OrganizationController";

export async function GET() {
  return listDepartmentsHandler();
}

export async function POST(req: NextRequest) {
  return createDepartmentHandler(req);
}
