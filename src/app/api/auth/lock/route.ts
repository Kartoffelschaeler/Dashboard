import { NextResponse } from "next/server";
import { dashboardUnlockCookie } from "@/lib/server/dashboard-auth";

export async function POST() {
  const response = NextResponse.json(true);

  response.cookies.delete(dashboardUnlockCookie);

  return response;
}
