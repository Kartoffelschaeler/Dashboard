import { getSupabase } from "@/lib/supabase";
import type {
  CalendarEvent,
  CreateCalendarEventInput,
} from "@/lib/calendar-types";

const calendarEventFields =
  "id,title,description,start_date,end_date,all_day,created_at";

export async function getCalendarEvents(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<CalendarEvent[]> {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Supabase ist noch nicht verbunden.");
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
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<CalendarEvent> {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Supabase ist noch nicht verbunden.");
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
    throw new Error(error.message);
  }

  return data;
}

export async function removeCalendarEvent(id: string): Promise<void> {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Supabase ist noch nicht verbunden.");
  }

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
