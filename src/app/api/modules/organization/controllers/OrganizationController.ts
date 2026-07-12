import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import * as svc from "../services/OrganizationService";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

function notFound(msg: string) {
  return NextResponse.json({ error: msg }, { status: 404 });
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") return null;
  return session;
}

// ── Departments ──────────────────────────────────────────────────────────────

export async function listDepartmentsHandler() {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const data = await svc.listDepartments(session.user.organizationId);
  return NextResponse.json({ data });
}

export async function createDepartmentHandler(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const data = await svc.addDepartment(session.user.organizationId, body, session.user.id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return badRequest(e.message);
  }
}

export async function getDepartmentHandler(_req: NextRequest, id: string) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const data = await svc.getDepartment(id, session.user.organizationId);
    return NextResponse.json({ data });
  } catch (e: any) {
    return notFound(e.message);
  }
}

export async function updateDepartmentHandler(req: NextRequest, id: string) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const data = await svc.editDepartment(id, session.user.organizationId, body, session.user.id);
    return NextResponse.json({ data });
  } catch (e: any) {
    return badRequest(e.message);
  }
}

export async function deleteDepartmentHandler(_req: NextRequest, id: string) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    await svc.removeDepartment(id, session.user.organizationId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return notFound(e.message);
  }
}

// ── Categories ───────────────────────────────────────────────────────────────

export async function listCategoriesHandler() {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const data = await svc.listCategories(session.user.organizationId);
  return NextResponse.json({ data });
}

export async function createCategoryHandler(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const data = await svc.addCategory(session.user.organizationId, body, session.user.id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return badRequest(e.message);
  }
}

export async function getCategoryHandler(_req: NextRequest, id: string) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const data = await svc.getCategory(id, session.user.organizationId);
    return NextResponse.json({ data });
  } catch (e: any) {
    return notFound(e.message);
  }
}

export async function updateCategoryHandler(req: NextRequest, id: string) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const data = await svc.editCategory(id, session.user.organizationId, body, session.user.id);
    return NextResponse.json({ data });
  } catch (e: any) {
    return badRequest(e.message);
  }
}

export async function deleteCategoryHandler(_req: NextRequest, id: string) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    await svc.removeCategory(id, session.user.organizationId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return notFound(e.message);
  }
}

// ── Employees ────────────────────────────────────────────────────────────────

export async function listEmployeesHandler() {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  const data = await svc.listEmployees(session.user.organizationId);
  return NextResponse.json({ data });
}

export async function createEmployeeHandler(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const data = await svc.addEmployee(session.user.organizationId, body, session.user.id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return badRequest(e.message);
  }
}

export async function getEmployeeHandler(_req: NextRequest, id: string) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const data = await svc.getEmployee(id, session.user.organizationId);
    return NextResponse.json({ data });
  } catch (e: any) {
    return notFound(e.message);
  }
}

export async function updateEmployeeHandler(req: NextRequest, id: string) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const data = await svc.editEmployee(id, session.user.organizationId, body, session.user.id);
    return NextResponse.json({ data });
  } catch (e: any) {
    return badRequest(e.message);
  }
}

export async function updateEmployeeRoleHandler(req: NextRequest, id: string) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const data = await svc.changeEmployeeRole(id, session.user.organizationId, body, session.user.id);
    return NextResponse.json({ data });
  } catch (e: any) {
    return badRequest(e.message);
  }
}

export async function deleteEmployeeHandler(_req: NextRequest, id: string) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    await svc.removeEmployee(id, session.user.organizationId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return notFound(e.message);
  }
}
