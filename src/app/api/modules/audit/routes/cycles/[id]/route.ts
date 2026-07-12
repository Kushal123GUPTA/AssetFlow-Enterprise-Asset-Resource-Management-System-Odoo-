import { NextRequest } from "next/server";
import {
  getAuditCycleHandler,
  updateAuditCycleHandler,
  deleteAuditCycleHandler,
} from "@/app/api/modules/audit/controllers/AuditController";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getAuditCycleHandler(req, id);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateAuditCycleHandler(req, id);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteAuditCycleHandler(req, id);
}
