import { NextRequest } from "next/server";
import {
  listAuditCyclesHandler,
  createAuditCycleHandler,
} from "@/app/api/modules/audit/controllers/AuditController";

export async function GET() {
  return listAuditCyclesHandler();
}

export async function POST(req: NextRequest) {
  return createAuditCycleHandler(req);
}
