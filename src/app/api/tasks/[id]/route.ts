import { requireDashboardAccess } from "@/lib/server/dashboard-auth";
import {
  deleteTaskAdmin,
  updateTaskAdmin,
} from "@/lib/services/task-admin-service";

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
    const body = (await request.json()) as { completed?: unknown };

    if (typeof body.completed !== "boolean") {
      return Response.json({ error: "Ungültige Änderung." }, { status: 400 });
    }

    return Response.json({
      task: await updateTaskAdmin(id, body.completed),
    });
  } catch {
    return Response.json(
      { error: "Eintrag konnte nicht aktualisiert werden." },
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
    await deleteTaskAdmin(id);

    return Response.json({ deleted: true });
  } catch {
    return Response.json(
      { error: "Eintrag konnte nicht gelöscht werden." },
      { status: 500 },
    );
  }
}
