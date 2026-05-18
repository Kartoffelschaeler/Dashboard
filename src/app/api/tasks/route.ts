import { requireDashboardAccess } from "@/lib/server/dashboard-auth";
import {
  createTaskAdmin,
  getTasksAdmin,
} from "@/lib/services/task-admin-service";
import { ServiceError } from "@/lib/services/service-error";

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

export async function GET(request: Request) {
  const accessError = requireDashboardAccess(request);

  if (accessError) {
    return accessError;
  }

  try {
    return Response.json({ tasks: await getTasksAdmin() });
  } catch (error) {
    logTaskError("GET", error);
    return taskErrorResponse(error, "Einträge konnten nicht geladen werden.");
  }
}

export async function POST(request: Request) {
  const accessError = requireDashboardAccess(request);

  if (accessError) {
    return accessError;
  }

  try {
    const body = (await request.json()) as { text?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text || text.length > 160) {
      return Response.json({ error: "Ungültiger Eintrag." }, { status: 400 });
    }

    return Response.json({ task: await createTaskAdmin(text) }, { status: 201 });
  } catch (error) {
    logTaskError("POST", error);
    return taskErrorResponse(error, "Eintrag konnte nicht erstellt werden.");
  }
}
