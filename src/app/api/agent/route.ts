import { requireDashboardAccess } from "@/lib/server/dashboard-auth";
import { agentPolicy } from "@/lib/agent/runtime/agent-policy";
import { runAgent } from "@/lib/agent/runtime/agent-runtime";
import type { ChatMessage } from "@/types/chat";

export async function POST(request: Request) {
  const accessError = requireDashboardAccess(request);

  if (accessError) {
    return accessError;
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

    return Response.json({
      ...result,
      executedTools: result.toolCalls.map((toolCall) => ({
        toolName: toolCall.name,
        success: toolCall.status === "success",
        status: toolCall.status,
      })),
    });
  } catch (error) {
    let message = "Agent konnte gerade nicht antworten.";

    if (error instanceof Error) {
      if (error.message === "OLLAMA_UNREACHABLE") {
        message = "Lokaler Agent nicht erreichbar. Prüfe, ob Ollama läuft.";
      }

      if (error.message === "OLLAMA_MODEL_NOT_FOUND") {
        message =
          "Modell nicht gefunden. Bitte ollama pull qwen2.5:7b ausführen.";
      }
    }

    return Response.json({ error: message }, { status: 500 });
  }
}
