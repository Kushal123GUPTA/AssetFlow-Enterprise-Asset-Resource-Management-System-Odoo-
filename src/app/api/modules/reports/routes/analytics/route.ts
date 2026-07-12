import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getAdminAnalytics } from "@/app/api/modules/reports/repositories/AnalyticsRepository";

// GET /api/reports/analytics
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const data = await getAdminAnalytics(session.user.organizationId);
  return NextResponse.json({ data });
}
