import { createServiceError } from "@/lib/services/service-error";
import type {
  CalendarEvent,
  CreateCalendarEventInput,
} from "@/types/calendar";

async function readJson<TData>(response: Response): Promise<TData> {
  const data = (await response.json()) as TData & { error?: string };

  if (!response.ok) {
    throw createServiceError(data.error ?? "Aktion fehlgeschlagen.");
  }

  return data;
}

export async function getEvents(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    from: rangeStart.toISOString(),
    to: rangeEnd.toISOString(),
  });
  const data = await readJson<{ events: CalendarEvent[] }>(
    await fetch(`/api/local-calendar/events?${params}`),
  );

  return data.events;
}

export async function createEvent(
  input: CreateCalendarEventInput,
): Promise<CalendarEvent> {
  const data = await readJson<{ event: CalendarEvent }>(
    await fetch("/api/local-calendar/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
      title: input.title,
      description: input.description?.trim() || null,
        startDate: input.startDate,
        endDate: input.endDate || null,
        allDay: input.allDay ?? false,
      }),
    }),
  );

  return data.event;
}

export async function deleteEvent(id: string): Promise<void> {
  await readJson<{ deleted: true }>(
    await fetch(`/api/local-calendar/events/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  );
}

export const getCalendarEvents = getEvents;
export const createCalendarEvent = createEvent;
export const removeCalendarEvent = deleteEvent;
