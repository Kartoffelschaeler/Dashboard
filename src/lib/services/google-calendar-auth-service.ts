import { getServerSupabase } from "@/lib/supabase";
import { createServiceError } from "@/lib/services/service-error";
import type { CalendarConnection } from "@/types/google-calendar";

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
const googleTokenUrl = "https://oauth2.googleapis.com/token";
const provider = "google" as const;
const scopes = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw createServiceError("Google OAuth ist noch nicht konfiguriert.");
  }

  return { clientId, clientSecret, redirectUri };
}

function getExpiresAt(expiresIn?: number) {
  if (!expiresIn) {
    return null;
  }

  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

export function createGoogleAuthUrl(state?: string) {
  const { clientId, redirectUri } = getGoogleOAuthConfig();
  const url = new URL(googleAuthUrl);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  if (state) {
    url.searchParams.set("state", state);
  }

  return url.toString();
}

export async function exchangeCodeForTokens(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  const response = await fetch(googleTokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw createServiceError("Google Tokens konnten nicht geladen werden.");
  }

  return (await response.json()) as GoogleTokenResponse;
}

export async function saveGoogleConnection(tokens: GoogleTokenResponse) {
  const supabase = getServerSupabase();

  if (!supabase) {
    throw createServiceError("Supabase Service Role ist noch nicht verbunden.");
  }

  const existingConnection = await getGoogleConnection();
  const payload = {
    provider,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? existingConnection?.refresh_token ?? null,
    expires_at: getExpiresAt(tokens.expires_in),
    updated_at: new Date().toISOString(),
  };

  const query = existingConnection
    ? supabase
      .from("calendar_connections")
      .update(payload)
      .eq("id", existingConnection.id)
      .select("id,provider,access_token,refresh_token,expires_at,created_at,updated_at")
      .single()
    : supabase
      .from("calendar_connections")
      .insert(payload)
      .select("id,provider,access_token,refresh_token,expires_at,created_at,updated_at")
      .single();

  const { data, error } = await query;

  if (error) {
    throw createServiceError(error.message);
  }

  return data;
}

export async function getGoogleConnection(): Promise<CalendarConnection | null> {
  const supabase = getServerSupabase();

  if (!supabase) {
    throw createServiceError("Supabase Service Role ist noch nicht verbunden.");
  }

  const { data, error } = await supabase
    .from("calendar_connections")
    .select("id,provider,access_token,refresh_token,expires_at,created_at,updated_at")
    .eq("provider", provider)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw createServiceError(error.message);
  }

  return data;
}

export async function refreshAccessTokenIfNeeded() {
  const connection = await getGoogleConnection();

  if (!connection) {
    return null;
  }

  const expiresAt = connection.expires_at
    ? new Date(connection.expires_at).getTime()
    : 0;

  if (expiresAt > Date.now() + 60_000) {
    return connection;
  }

  if (!connection.refresh_token) {
    return connection;
  }

  const { clientId, clientSecret } = getGoogleOAuthConfig();
  const response = await fetch(googleTokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
    }),
  });

  if (!response.ok) {
    throw createServiceError("Google Token konnte nicht erneuert werden.");
  }

  const tokens = (await response.json()) as GoogleTokenResponse;

  return saveGoogleConnection({
    ...tokens,
    refresh_token: connection.refresh_token,
  });
}
