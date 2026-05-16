export type CalendarConnection = {
  id: string;
  provider: "google";
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GoogleCalendar = {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole?: string;
};

export type GoogleEventDate = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

export type GoogleCalendarEvent = {
  id: string;
  calendarId: string;
  calendarSummary?: string;
  summary: string;
  description?: string | null;
  start: GoogleEventDate;
  end: GoogleEventDate;
  htmlLink?: string;
};

export type GoogleCalendarWarning = {
  calendarId: string;
  calendarSummary?: string;
  message: string;
};

export type CreateGoogleEventInput = {
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  allDay?: boolean;
};
