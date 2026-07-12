import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import * as svc from "../services/AuditService";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function listAuditCyclesHandler() {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const data = await svc.listAuditCycles(session.user.organizationId);
  return NextResponse.json({ data });
}

export async function createAuditCycleHandler(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const data = await svc.addAuditCycle(session.user.organizationId, body, session.user.id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function getAuditCycleHandler(_req: NextRequest, id: string) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const data = await svc.getAuditCycle(id, session.user.organizationId);
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
}

export async function updateAuditCycleHandler(req: NextRequest, id: string) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const data = await svc.editAuditCycle(id, session.user.organizationId, body, session.user.id);
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function deleteAuditCycleHandler(_req: NextRequest, id: string) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    await svc.removeAuditCycle(id, session.user.organizationId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
