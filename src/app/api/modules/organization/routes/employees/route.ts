import { NextRequest } from "next/server";
import {
  listEmployeesHandler,
  createEmployeeHandler,
} from "@/app/api/modules/organization/controllers/OrganizationController";

export async function GET() {
  return listEmployeesHandler();
}

export async function POST(req: NextRequest) {
  return createEmployeeHandler(req);
}
