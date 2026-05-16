export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  created_at: string;
};

export type CalendarEventSource = "local" | "google";

export type CalendarDisplayEvent = CalendarEvent & {
  source: CalendarEventSource;
  externalEventId?: string;
  calendarId?: string;
  calendarName?: string;
  calendarColor?: string;
  isAgentCalendar?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

export type CreateCalendarEventInput = {
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  allDay?: boolean;
};

export type CalendarDay = {
  date: Date;
  key: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isCurrentWeek: boolean;
};
