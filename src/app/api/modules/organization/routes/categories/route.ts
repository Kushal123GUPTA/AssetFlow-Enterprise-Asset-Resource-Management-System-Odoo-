import { NextRequest } from "next/server";
import {
  listCategoriesHandler,
  createCategoryHandler,
} from "@/app/api/modules/organization/controllers/OrganizationController";

export async function GET() {
  return listCategoriesHandler();
}

export async function POST(req: NextRequest) {
  return createCategoryHandler(req);
}
