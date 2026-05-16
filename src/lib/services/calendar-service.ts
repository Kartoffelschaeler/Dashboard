import { getSupabase } from "@/lib/supabase";
import { createServiceError } from "@/lib/services/service-error";
import type {
  CalendarEvent,
  CreateCalendarEventInput,
} from "@/types/calendar";

const calendarEventFields =
  "id,title,description,start_date,end_date,all_day,created_at";

export async function getEvents(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<CalendarEvent[]> {
  const supabase = getSupabase();

  if (!supabase) {
    throw createServiceError("Supabase ist noch nicht verbunden.");
  }

  const { data, error } = await supabase
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

export async function createEvent(
  input: CreateCalendarEventInput,
): Promise<CalendarEvent> {
  const supabase = getSupabase();

  if (!supabase) {
    throw createServiceError("Supabase ist noch nicht verbunden.");
  }

  const { data, error } = await supabase
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

export async function deleteEvent(id: string): Promise<void> {
  const supabase = getSupabase();

  if (!supabase) {
    throw createServiceError("Supabase ist noch nicht verbunden.");
  }

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id);

  if (error) {
    throw createServiceError(error.message);
  }
}

export const getCalendarEvents = getEvents;
export const createCalendarEvent = createEvent;
export const removeCalendarEvent = deleteEvent;
