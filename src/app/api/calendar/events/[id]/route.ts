import { requireDashboardAccess } from "@/lib/server/dashboard-auth";
import {
  deleteGoogleEvent,
  updateGoogleEvent,
} from "@/lib/services/google-calendar-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const accessError = requireDashboardAccess(request);

  if (accessError) {
    return accessError;
  }

  try {
    const { id } = await context.params;
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

    const event = await updateGoogleEvent(id, {
      title,
      description:
        typeof body.description === "string" ? body.description : null,
      startDate,
      endDate: typeof body.endDate === "string" ? body.endDate : null,
      allDay: typeof body.allDay === "boolean" ? body.allDay : false,
    });

    return Response.json({ event });
  } catch {
    return Response.json(
      { error: "Google Termin konnte nicht aktualisiert werden." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const accessError = requireDashboardAccess(request);

  if (accessError) {
    return accessError;
  }

  try {
    const { id } = await context.params;
    await deleteGoogleEvent(id);

    return Response.json({ deleted: true });
  } catch {
    return Response.json(
      { error: "Google Termin konnte nicht gelöscht werden." },
      { status: 500 },
    );
  }
}
