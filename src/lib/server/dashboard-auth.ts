export const dashboardUnlockCookie = "dashboard_unlocked";

export function hasDashboardAccess(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";

  return cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part === `${dashboardUnlockCookie}=true`);
}

export function requireDashboardAccess(request: Request) {
  if (!hasDashboardAccess(request)) {
    return Response.json({ error: "Dashboard ist gesperrt." }, { status: 401 });
  }

  return null;
}
