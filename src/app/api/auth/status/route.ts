import {
  hasDashboardAccess,
  isLocalAuthDisabled,
} from "@/lib/server/dashboard-auth";

export async function GET(request: Request) {
  return Response.json({
    unlocked: hasDashboardAccess(request),
    localAuthDisabled: isLocalAuthDisabled(),
  });
}
