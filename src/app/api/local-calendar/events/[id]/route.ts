import { requireDashboardAccess } from "@/lib/server/dashboard-auth";
import {
  deleteEventAdmin,
  updateEventAdmin,
} from "@/lib/services/calendar-admin-service";
import type { CreateCalendarEventInput } from "@/types/calendar";

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
    const body = (await request.json()) as Partial<CreateCalendarEventInput>;

    return Response.json({
      event: await updateEventAdmin(id, body),
    });
  } catch {
    return Response.json(
      { error: "Termin konnte nicht aktualisiert werden." },
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
    await deleteEventAdmin(id);

    return Response.json({ deleted: true });
  } catch {
    return Response.json(
      { error: "Termin konnte nicht gelöscht werden." },
      { status: 500 },
    );
  }
}
