import { getServerSupabase } from "@/lib/supabase";
import { createServiceError } from "@/lib/services/service-error";
import type {
  CalendarEvent,
  CreateCalendarEventInput,
} from "@/types/calendar";

const calendarEventFields =
  "id,title,description,start_date,end_date,all_day,created_at";

function getAdminClient() {
  const supabase = getServerSupabase();

  if (!supabase) {
    throw createServiceError("Datenbank ist serverseitig nicht konfiguriert.");
  }

  return supabase;
}

export async function getEventsAdmin(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<CalendarEvent[]> {
  const { data, error } = await getAdminClient()
    .from("calendar_events")
    .select(calendarEventFields)
    .lte("start_date", rangeEnd.toISOString())
    .or(
      `end_date.gte.${rangeStart.toISOString()},and(end_date.is.null,start_date.gte.${rangeStart.toISOString()})`,
    )
    .order("start_date", { ascending: true });

  if (error) {
    throw createServiceError(error.message);
  }

  return data ?? [];
}

export async function createEventAdmin(
  input: CreateCalendarEventInput,
): Promise<CalendarEvent> {
  const { data, error } = await getAdminClient()
    .from("calendar_events")
    .insert({
      title: input.title,
      description: input.description?.trim() || null,
      start_date: input.startDate,
      end_date: input.endDate || null,
      all_day: input.allDay ?? false,
    })
    .select(calendarEventFields)
    .single();

  if (error) {
    throw createServiceError(error.message);
  }

  return data;
}

export async function updateEventAdmin(
  id: string,
  input: Partial<CreateCalendarEventInput>,
): Promise<CalendarEvent> {
  const payload: {
    title?: string;
    description?: string | null;
    start_date?: string;
    end_date?: string | null;
    all_day?: boolean;
  } = {};

  if (input.title !== undefined) {
    payload.title = input.title;
  }

  if (input.description !== undefined) {
    payload.description = input.description?.trim() || null;
  }

  if (input.startDate !== undefined) {
    payload.start_date = input.startDate;
  }

  if (input.endDate !== undefined) {
    payload.end_date = input.endDate || null;
  }

  if (input.allDay !== undefined) {
    payload.all_day = input.allDay;
  }

  const { data, error } = await getAdminClient()
    .from("calendar_events")
    .update(payload)
    .eq("id", id)
    .select(calendarEventFields)
    .single();

  if (error) {
    throw createServiceError(error.message);
  }

  return data;
}

export async function deleteEventAdmin(id: string): Promise<void> {
  const { error } = await getAdminClient()
    .from("calendar_events")
    .delete()
    .eq("id", id);

  if (error) {
    throw createServiceError(error.message);
  }
}
