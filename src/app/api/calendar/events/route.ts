import { requireDashboardAccess } from "@/lib/server/dashboard-auth";
import { getGoogleConnection } from "@/lib/services/google-calendar-auth-service";
import {
  createGoogleEvent,
  getGoogleEventsWithWarnings,
} from "@/lib/services/google-calendar-service";

export async function GET(request: Request) {
  const accessError = requireDashboardAccess(request);

  if (accessError) {
    return accessError;
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const rangeStart = from ? new Date(from) : new Date();
  const rangeEnd = to
    ? new Date(to)
    : new Date(rangeStart.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
    return Response.json({ error: "Ungültiger Zeitraum." }, { status: 400 });
  }

  try {
    const connection = await getGoogleConnection();

    if (!connection) {
      return Response.json({ events: [], warnings: [] });
    }

    const { events, warnings } = await getGoogleEventsWithWarnings(
      rangeStart,
      rangeEnd,
    );

    return Response.json({ events, warnings });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Google Termine konnten nicht geladen werden.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const accessError = requireDashboardAccess(request);

  if (accessError) {
    return accessError;
  }

  try {
    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      startDate?: unknown;
      endDate?: unknown;
      allDay?: unknown;
    };
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const startDate =
      typeof body.startDate === "string" ? body.startDate : "";

    if (!title || !startDate) {
      return Response.json({ error: "Ungültiger Termin." }, { status: 400 });
    }

    const event = await createGoogleEvent({
      title,
      description:
        typeof body.description === "string" ? body.description : null,
      startDate,
      endDate: typeof body.endDate === "string" ? body.endDate : null,
      allDay: typeof body.allDay === "boolean" ? body.allDay : false,
    });

    return Response.json({ event }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Google Termin konnte nicht erstellt werden." },
      { status: 500 },
    );
  }
}
