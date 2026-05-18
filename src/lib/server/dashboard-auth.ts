import { createHmac, timingSafeEqual } from "crypto";

export const dashboardUnlockCookie = "dashboard_unlocked";
export const dashboardSessionMaxAge = 60 * 60 * 12;

export function isLocalAuthDisabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.LOCAL_AUTH_DISABLED?.trim().toLowerCase() === "true"
  );
}

function getCookieValue(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? "";

  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function signSession(expiresAt: number, secret: string) {
  return createHmac("sha256", secret).update(String(expiresAt)).digest("hex");
}

function valuesMatch(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return timingSafeEqual(firstBuffer, secondBuffer);
}

export function createDashboardSessionValue() {
  const dashboardPassword = process.env.DASHBOARD_PASSWORD;

  if (!dashboardPassword) {
    return null;
  }

  const expiresAt = Date.now() + dashboardSessionMaxAge * 1000;
  const signature = signSession(expiresAt, dashboardPassword);

  return `${expiresAt}.${signature}`;
}

export function verifyDashboardSessionValue(value: string | undefined) {
  const dashboardPassword = process.env.DASHBOARD_PASSWORD;

  if (!dashboardPassword || !value) {
    return false;
  }

  const [expiresAtValue, signature] = value.split(".");
  const expiresAt = Number(expiresAtValue);

  if (!expiresAt || !signature || expiresAt <= Date.now()) {
    return false;
  }

  return valuesMatch(signature, signSession(expiresAt, dashboardPassword));
}

export function hasDashboardAccess(request: Request) {
  if (isLocalAuthDisabled()) {
    return true;
  }

  return verifyDashboardSessionValue(
    getCookieValue(request, dashboardUnlockCookie),
  );
}

export function requireDashboardAccess(request: Request) {
  if (!hasDashboardAccess(request)) {
    return Response.json({ error: "Dashboard ist gesperrt." }, { status: 401 });
  }

  return null;
}
