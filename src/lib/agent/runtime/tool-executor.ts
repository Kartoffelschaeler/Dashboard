import { getServerSupabase } from "@/lib/supabase";
import type { AgentToolDefinition } from "@/lib/agent/runtime/tool-registry";

export type ExecutedToolCall = {
  name: string;
  status: "success" | "error";
  riskLevel: string;
};

function summarizeInput(input: unknown) {
  if (!input || typeof input !== "object") {
    return "";
  }

  const object = input as Record<string, unknown>;

  return Object.keys(object).slice(0, 5).join(",");
}

function normalizeToolError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "INVALID_INPUT") {
    return "INVALID_INPUT";
  }

  if (message.includes("Agent-Kalender")) {
    return "AGENT_CALENDAR_NOT_FOUND";
  }

  if (message.includes("Google Kalender ist nicht verbunden")) {
    return "CALENDAR_NOT_CONNECTED";
  }

  return "TOOL_FAILED";
}

async function logToolCall(
  conversationId: string | null,
  tool: AgentToolDefinition,
  input: unknown,
  status: "success" | "error",
) {
  const supabase = getServerSupabase();

  if (!supabase) {
    return;
  }

  await supabase.from("agent_action_logs").insert({
    conversation_id: conversationId,
    tool_name: tool.name,
    tool_input_summary: summarizeInput(input),
    status,
    risk_level: tool.riskLevel,
  });
}

export async function executeToolCall(
  tool: AgentToolDefinition | undefined,
  input: unknown,
  conversationId: string | null,
) {
  if (!tool) {
    return {
      output: { ok: false, error: "TOOL_NOT_ALLOWED" },
      summary: null,
    };
  }

  try {
    const data = await tool.handler(input);
    await logToolCall(conversationId, tool, input, "success").catch(() => {});

    return {
      output: { ok: true, data },
      summary: {
        name: tool.name,
        status: "success" as const,
        riskLevel: tool.riskLevel,
      },
    };
  } catch (error) {
    await logToolCall(conversationId, tool, input, "error").catch(() => {});

    return {
      output: {
        ok: false,
        error: normalizeToolError(error),
      },
      summary: {
        name: tool.name,
        status: "error" as const,
        riskLevel: tool.riskLevel,
      },
    };
  }
}
