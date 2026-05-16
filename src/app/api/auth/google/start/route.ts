import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { hasDashboardAccess } from "@/lib/server/dashboard-auth";
import { createGoogleAuthUrl } from "@/lib/services/google-calendar-auth-service";

const oauthStateCookie = "google_oauth_state";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  if (!hasDashboardAccess(request)) {
    return NextResponse.redirect(new URL("/", origin));
  }

  try {
    const state = randomUUID();
    const response = NextResponse.redirect(createGoogleAuthUrl(state));

    response.cookies.set(oauthStateCookie, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/?googleCalendar=configuration_error", origin),
    );
  }
}
