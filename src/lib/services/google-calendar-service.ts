import { refreshAccessTokenIfNeeded } from "@/lib/services/google-calendar-auth-service";
import { createServiceError } from "@/lib/services/service-error";
import type {
  CreateGoogleEventInput,
  GoogleCalendar,
  GoogleCalendarEvent,
  GoogleCalendarWarning,
} from "@/types/google-calendar";

type GoogleCalendarListResponse = {
  items?: GoogleCalendar[];
};

type GoogleEventsResponse = {
  items?: Array<{
    id: string;
    summary?: string;
    description?: string;
    start?: { date?: string; dateTime?: string; timeZone?: string };
    end?: { date?: string; dateTime?: string; timeZone?: string };
    htmlLink?: string;
  }>;
};

const googleCalendarApiUrl = "https://www.googleapis.com/calendar/v3";

async function getAccessToken() {
  const connection = await refreshAccessTokenIfNeeded();

  if (!connection) {
    return null;
  }

  return connection.access_token;
}

async function googleFetch<TData>(path: string, init?: RequestInit) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw createServiceError("Google Kalender ist nicht verbunden.");
  }

  const response = await fetch(`${googleCalendarApiUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw createServiceError("Google Calendar Anfrage ist fehlgeschlagen.");
  }

  const text = await response.text();

  return (text ? JSON.parse(text) : {}) as TData;
}

export async function getGoogleCalendars() {
  const data = await googleFetch<GoogleCalendarListResponse>("/users/me/calendarList");

  return data.items ?? [];
}

export async function getAgentCalendar() {
  const calendarName = process.env.GOOGLE_AGENT_CALENDAR_NAME;

  if (!calendarName) {
    return null;
  }

  const calendars = await getGoogleCalendars();

  return calendars.find((calendar) => calendar.summary === calendarName) ?? null;
}

export async function getGoogleEvents(rangeStart: Date, rangeEnd: Date) {
  const result = await getGoogleEventsWithWarnings(rangeStart, rangeEnd);

  return result.events;
}

export async function getGoogleEventsWithWarnings(
  rangeStart: Date,
  rangeEnd: Date,
) {
  const calendars = await getGoogleCalendars();
  const eventGroups = await Promise.allSettled(
    calendars.map(async (calendar) => {
      const params = new URLSearchParams({
        singleEvents: "true",
        orderBy: "startTime",
        timeMin: rangeStart.toISOString(),
        timeMax: rangeEnd.toISOString(),
      });
      const data = await googleFetch<GoogleEventsResponse>(
        `/calendars/${encodeURIComponent(calendar.id)}/events?${params}`,
      );

      return (data.items ?? []).map<GoogleCalendarEvent>((event) => ({
        id: event.id,
        calendarId: calendar.id,
        calendarSummary: calendar.summary,
        summary: event.summary ?? "Ohne Titel",
        description: event.description ?? null,
        start: event.start ?? {},
        end: event.end ?? {},
        htmlLink: event.htmlLink,
      }));
    }),
  );
  const events: GoogleCalendarEvent[] = [];
  const warnings: GoogleCalendarWarning[] = [];

  eventGroups.forEach((result, index) => {
    if (result.status === "fulfilled") {
      events.push(...result.value);
      return;
    }

    const calendar = calendars[index];

    warnings.push({
      calendarId: calendar.id,
      calendarSummary: calendar.summary,
      message: "Kalender konnte nicht geladen werden.",
    });
    console.warn("Google calendar skipped while loading events.", {
      calendarId: calendar.id,
    });
  });

  return { events, warnings };
}

export async function createGoogleEvent(input: CreateGoogleEventInput) {
  const calendar = await getAgentCalendar();

  if (!calendar) {
    throw createServiceError("Agent-Kalender wurde nicht gefunden.");
  }

  const body = createGoogleEventBody(input);

  return googleFetch<GoogleCalendarEvent>(
    `/calendars/${encodeURIComponent(calendar.id)}/events`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function updateGoogleEvent(
  eventId: string,
  input: CreateGoogleEventInput,
) {
  const calendar = await getAgentCalendar();

  if (!calendar) {
    throw createServiceError("Agent-Kalender wurde nicht gefunden.");
  }

  return googleFetch<GoogleCalendarEvent>(
    `/calendars/${encodeURIComponent(calendar.id)}/events/${encodeURIComponent(
      eventId,
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify(createGoogleEventBody(input)),
    },
  );
}

export async function deleteGoogleEvent(eventId: string) {
  const calendar = await getAgentCalendar();

  if (!calendar) {
    throw createServiceError("Agent-Kalender wurde nicht gefunden.");
  }

  await googleFetch<Record<string, never>>(
    `/calendars/${encodeURIComponent(calendar.id)}/events/${encodeURIComponent(
      eventId,
    )}`,
    { method: "DELETE" },
  );
}

export function getExclusiveAllDayEndDate(
  startDate: string,
  endDate?: string | null,
) {
  const startDateOnly = startDate.slice(0, 10);
  const endDateOnly = endDate?.slice(0, 10);

  if (endDateOnly && endDateOnly > startDateOnly) {
    return endDateOnly;
  }

  const [year, month, day] = startDateOnly.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day));

  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  return nextDate.toISOString().slice(0, 10);
}

function createGoogleEventBody(input: CreateGoogleEventInput) {
  if (input.allDay) {
    return {
      summary: input.title,
      description: input.description ?? undefined,
      start: { date: input.startDate.slice(0, 10) },
      end: {
        date: getExclusiveAllDayEndDate(input.startDate, input.endDate),
      },
    };
  }

  return {
    summary: input.title,
    description: input.description ?? undefined,
    start: { dateTime: input.startDate },
    end: { dateTime: input.endDate ?? input.startDate },
  };
}
