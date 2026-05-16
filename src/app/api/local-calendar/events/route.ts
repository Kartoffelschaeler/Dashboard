import { requireDashboardAccess } from "@/lib/server/dashboard-auth";
import {
  createEventAdmin,
  getEventsAdmin,
} from "@/lib/services/calendar-admin-service";

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
    return Response.json({
      events: await getEventsAdmin(rangeStart, rangeEnd),
    });
  } catch {
    return Response.json(
      { error: "Termine konnten nicht geladen werden." },
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

    if (!title || Number.isNaN(new Date(startDate).getTime())) {
      return Response.json({ error: "Ungültiger Termin." }, { status: 400 });
    }

    return Response.json(
      {
        event: await createEventAdmin({
          title,
          description:
            typeof body.description === "string" ? body.description : null,
          startDate,
          endDate: typeof body.endDate === "string" ? body.endDate : null,
          allDay: typeof body.allDay === "boolean" ? body.allDay : false,
        }),
      },
      { status: 201 },
    );
  } catch {
    return Response.json(
      { error: "Termin konnte nicht erstellt werden." },
      { status: 500 },
    );
  }
}
