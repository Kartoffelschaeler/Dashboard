import { buildSystemPrompt } from "@/lib/agent/runtime/build-system-prompt";
import { agentPolicy } from "@/lib/agent/runtime/agent-policy";
import {
  executeToolCall,
  type ExecutedToolCall,
} from "@/lib/agent/runtime/tool-executor";
import { getToolRegistry } from "@/lib/agent/runtime/tool-registry";
import {
  chatWithOllama,
  type OllamaChatMessage,
} from "@/lib/services/ollama-service";
import type { ChatMessage } from "@/types/chat";

type RunAgentInput = {
  message: string;
  messages?: ChatMessage[];
  conversationId?: string | null;
};

type AgentModelResponse =
  | {
    type: "final";
    message: string;
  }
  | {
    type: "tool_call";
    tool: string;
    arguments?: unknown;
  };

export type RunAgentResult = {
  assistantMessage: string;
  toolCalls: ExecutedToolCall[];
  warnings: string[];
};

function normalizeHistory(messages: ChatMessage[] = []): OllamaChatMessage[] {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-agentPolicy.maxHistoryMessages)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, agentPolicy.maxInputLength),
    }));
}

function extractJsonObject(content: string) {
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return candidate.slice(start, end + 1);
}

function parseModelResponse(content: string): AgentModelResponse | null {
  const json = extractJsonObject(content);

  if (!json) {
    return null;
  }

  try {
    const parsed = JSON.parse(json) as Partial<AgentModelResponse>;

    if (parsed.type === "final" && typeof parsed.message === "string") {
      return { type: "final", message: parsed.message };
    }

    if (parsed.type === "tool_call" && typeof parsed.tool === "string") {
      return {
        type: "tool_call",
        tool: parsed.tool,
        arguments: parsed.arguments ?? {},
      };
    }
  } catch {
    return null;
  }

  return null;
}

function buildToolListForPrompt() {
  return [...getToolRegistry().values()]
    .map(
      (tool) =>
        `- ${tool.name}: ${tool.description} Schema: ${JSON.stringify(
          tool.inputSchema,
        )}`,
    )
    .join("\n");
}

async function askModel(messages: OllamaChatMessage[]) {
  const { content } = await chatWithOllama(messages);
  const parsed = parseModelResponse(content);

  if (!parsed) {
    return null;
  }

  return parsed;
}

export async function runAgent(input: RunAgentInput): Promise<RunAgentResult> {
  const toolCalls: ExecutedToolCall[] = [];
  const warnings: string[] = [];
  const registry = getToolRegistry();
  const messages: OllamaChatMessage[] = [
    {
      role: "system",
      content: `${buildSystemPrompt()}\n\nVerfügbare Tools:\n${buildToolListForPrompt()}`,
    },
    ...normalizeHistory(input.messages),
    {
      role: "user",
      content: input.message.slice(0, agentPolicy.maxInputLength),
    },
  ];

  for (let step = 0; step < agentPolicy.maxSteps; step += 1) {
    const response = await askModel(messages);

    if (!response) {
      warnings.push("Ungültiges Modellformat.");
      messages.push({
        role: "user",
        content:
          'Antworte erneut ausschließlich als JSON: {"type":"final","message":"..."} oder {"type":"tool_call","tool":"...","arguments":{}}',
      });
      continue;
    }

    if (response.type === "final") {
      return {
        assistantMessage: response.message,
        toolCalls,
        warnings,
      };
    }

    if (toolCalls.length >= agentPolicy.maxToolCallsPerRequest) {
      warnings.push("Maximale Tool-Anzahl erreicht.");
      break;
    }

    const tool = registry.get(response.tool);
    const result = await executeToolCall(
      tool,
      response.arguments ?? {},
      input.conversationId ?? null,
    );

    if (result.summary) {
      toolCalls.push(result.summary);
    } else {
      warnings.push("Nicht erlaubtes Tool angefragt.");
    }

    messages.push({
      role: "assistant",
      content: JSON.stringify(response),
    });
    messages.push({
      role: "user",
      content: `Tool-Ergebnis für ${response.tool}: ${JSON.stringify(
        result.output,
      )}. Antworte jetzt mit final oder nutze genau ein weiteres Tool, falls nötig.`,
    });
  }

  return {
    assistantMessage:
      "Ich konnte daraus gerade keine stabile lokale Agent-Antwort erzeugen. Bitte formuliere die Anfrage etwas konkreter.",
    toolCalls,
    warnings,
  };
}
