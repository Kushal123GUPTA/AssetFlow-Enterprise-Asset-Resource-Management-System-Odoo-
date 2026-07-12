import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const ROLE_HOME: Record<string, string> = {
  admin: "/dashboard/admin",
  asset_manager: "/dashboard/asset-manager",
  department_head: "/dashboard/department-head",
  employee: "/dashboard/employee",
};

function authSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    "fallback_secret_for_development"
  );
}

function roleAllowed(pathname: string, role: string): boolean {
  if (pathname.startsWith("/dashboard/notifications")) return true;
  if (pathname === "/dashboard") return true;

  if (pathname.startsWith("/dashboard/admin")) return role === "admin";
  if (pathname.startsWith("/dashboard/asset-manager")) {
    return role === "asset_manager" || role === "admin";
  }
  if (pathname.startsWith("/dashboard/department-head")) {
    return role === "department_head" || role === "admin";
  }
  if (pathname.startsWith("/dashboard/employee")) {
    return Boolean(role);
  }
  return true;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const token = await getToken({ req, secret: authSecret() });

  if (!token) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const role = String(token.role ?? "");
  if (!roleAllowed(pathname, role)) {
    const home = ROLE_HOME[role] ?? "/dashboard/employee";
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
