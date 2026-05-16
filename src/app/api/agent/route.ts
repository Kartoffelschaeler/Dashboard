import { requireDashboardAccess } from "@/lib/server/dashboard-auth";
import { agentPolicy } from "@/lib/agent/runtime/agent-policy";
import { runAgent } from "@/lib/agent/runtime/agent-runtime";
import type { ChatMessage } from "@/types/chat";

export async function POST(request: Request) {
  const accessError = requireDashboardAccess(request);

  if (accessError) {
    return accessError;
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "Agent ist noch nicht konfiguriert." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      message?: unknown;
      messages?: unknown;
      conversationId?: unknown;
    };
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message || message.length > agentPolicy.maxInputLength) {
      return Response.json({ error: "Ungültige Nachricht." }, { status: 400 });
    }

    const messages = Array.isArray(body.messages)
      ? (body.messages as ChatMessage[])
      : [];
    const conversationId =
      typeof body.conversationId === "string" ? body.conversationId : null;
    const result = await runAgent({ message, messages, conversationId });

    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "OPENAI_API_KEY_MISSING"
        ? "Agent ist noch nicht konfiguriert."
        : "Agent konnte gerade nicht antworten.";

    return Response.json({ error: message }, { status: 500 });
  }
}
