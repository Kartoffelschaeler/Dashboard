import { NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  saveGoogleConnection,
} from "@/lib/services/google-calendar-auth-service";

const oauthStateCookie = "google_oauth_state";

function redirectWithStatus(requestUrl: string, status: string) {
  const url = new URL("/", new URL(requestUrl).origin);
  url.searchParams.set("googleCalendar", status);

  const response = NextResponse.redirect(url);
  response.cookies.delete(oauthStateCookie);

  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");
  const expectedState = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${oauthStateCookie}=`))
    ?.slice(oauthStateCookie.length + 1);

  if (error) {
    return redirectWithStatus(request.url, "cancelled");
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithStatus(request.url, "state_error");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await saveGoogleConnection(tokens);

    return redirectWithStatus(request.url, "connected");
  } catch {
    return redirectWithStatus(request.url, "error");
  }
}
