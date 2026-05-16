import { requireDashboardAccess } from "@/lib/server/dashboard-auth";
import {
  createTaskAdmin,
  getTasksAdmin,
} from "@/lib/services/task-admin-service";

export async function GET(request: Request) {
  const accessError = requireDashboardAccess(request);

  if (accessError) {
    return accessError;
  }

  try {
    return Response.json({ tasks: await getTasksAdmin() });
  } catch {
    return Response.json(
      { error: "Einträge konnten nicht geladen werden." },
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
    const body = (await request.json()) as { text?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text || text.length > 160) {
      return Response.json({ error: "Ungültiger Eintrag." }, { status: 400 });
    }

    return Response.json({ task: await createTaskAdmin(text) }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Eintrag konnte nicht erstellt werden." },
      { status: 500 },
    );
  }
}
