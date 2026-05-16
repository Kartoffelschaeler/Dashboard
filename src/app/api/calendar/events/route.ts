import { requireDashboardAccess } from "@/lib/server/dashboard-auth";
import { getGoogleConnection } from "@/lib/services/google-calendar-auth-service";
import { getGoogleEvents } from "@/lib/services/google-calendar-service";

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
      return Response.json({ events: [] });
    }

    const events = await getGoogleEvents(rangeStart, rangeEnd);

    return Response.json({ events });
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
