import { requireDashboardAccess } from "@/lib/server/dashboard-auth";
import { getGoogleConnection } from "@/lib/services/google-calendar-auth-service";
import {
  findAgentCalendar,
  getGoogleCalendars,
} from "@/lib/services/google-calendar-service";

export async function GET(request: Request) {
  const accessError = requireDashboardAccess(request);

  if (accessError) {
    return accessError;
  }

  try {
    const connection = await getGoogleConnection();

    if (!connection) {
      return Response.json({
        connected: false,
        calendars: [],
        agentCalendarName: process.env.GOOGLE_AGENT_CALENDAR_NAME ?? null,
        agentCalendar: null,
        warnings: [],
      });
    }

    const calendars = await getGoogleCalendars();
    const agentCalendarName = process.env.GOOGLE_AGENT_CALENDAR_NAME?.trim() ?? null;
    const { calendar: agentCalendar, warning } = findAgentCalendar(calendars);

    return Response.json({
      connected: true,
      calendars: calendars.map((calendar) => ({
        id: calendar.id,
        summary: calendar.summary,
        primary: calendar.primary ?? false,
      })),
      agentCalendarName,
      agentCalendar: agentCalendar
        ? { id: agentCalendar.id, summary: agentCalendar.summary }
        : null,
      warnings: warning ? [warning] : [],
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Google Kalenderstatus konnte nicht geladen werden.",
      },
      { status: 500 },
    );
  }
}
