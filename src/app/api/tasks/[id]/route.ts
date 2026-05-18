import { requireDashboardAccess } from "@/lib/server/dashboard-auth";
import {
  deleteTaskAdmin,
  updateTaskAdmin,
} from "@/lib/services/task-admin-service";
import { ServiceError } from "@/lib/services/service-error";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function logTaskError(action: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const code = error instanceof ServiceError ? error.code : "unknown";

  console.error(`Task API ${action} failed: ${code} ${message}`);
}

function taskErrorResponse(error: unknown, fallback: string) {
  if (error instanceof ServiceError && error.code === "missing_configuration") {
    return Response.json(
      { error: "Serverseitige Supabase-Konfiguration fehlt." },
      { status: 500 },
    );
  }

  return Response.json({ error: fallback }, { status: 500 });
}

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
  } catch (error) {
    logTaskError("PATCH", error);
    return taskErrorResponse(error, "Eintrag konnte nicht aktualisiert werden.");
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
  } catch (error) {
    logTaskError("DELETE", error);
    return taskErrorResponse(error, "Eintrag konnte nicht gelöscht werden.");
  }
}
