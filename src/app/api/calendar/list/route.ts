import { requireDashboardAccess } from "@/lib/server/dashboard-auth";
import { getGoogleConnection } from "@/lib/services/google-calendar-auth-service";
import { getGoogleCalendars } from "@/lib/services/google-calendar-service";

export async function GET(request: Request) {
  const accessError = requireDashboardAccess(request);

  if (accessError) {
    return accessError;
  }

  try {
    const connection = await getGoogleConnection();

    if (!connection) {
      return Response.json({ calendars: [], agentCalendar: null });
    }

    const calendars = await getGoogleCalendars();
    const agentCalendarName = process.env.GOOGLE_AGENT_CALENDAR_NAME ?? null;
    const agentCalendar =
      calendars.find((calendar) => calendar.summary === agentCalendarName) ??
      null;

    return Response.json({
      calendars: calendars.map((calendar) => ({
        id: calendar.id,
        summary: calendar.summary,
        primary: calendar.primary ?? false,
      })),
      agentCalendar: agentCalendar
        ? { id: agentCalendar.id, summary: agentCalendar.summary }
        : null,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Google Kalender konnten nicht geladen werden.",
      },
      { status: 500 },
    );
  }
}
