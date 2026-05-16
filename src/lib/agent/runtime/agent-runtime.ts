import { buildSystemPrompt } from "@/lib/agent/runtime/build-system-prompt";
import { agentPolicy } from "@/lib/agent/runtime/agent-policy";
import { executeToolCall, type ExecutedToolCall } from "@/lib/agent/runtime/tool-executor";
import { getToolRegistry } from "@/lib/agent/runtime/tool-registry";
import type { ChatMessage } from "@/types/chat";

type OpenAiMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_call_id?: string;
  tool_calls?: OpenAiToolCall[];
};

type OpenAiToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

type OpenAiChoice = {
  message: OpenAiMessage;
};

type OpenAiChatResponse = {
  choices?: OpenAiChoice[];
};

type RunAgentInput = {
  message: string;
  messages?: ChatMessage[];
  conversationId?: string | null;
};

export type RunAgentResult = {
  assistantMessage: string;
  toolCalls: ExecutedToolCall[];
  warnings: string[];
};

function normalizeHistory(messages: ChatMessage[] = []): OpenAiMessage[] {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-agentPolicy.maxHistoryMessages)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, agentPolicy.maxInputLength),
    }));
}

function parseToolArguments(value: string) {
  try {
    return value ? (JSON.parse(value) as unknown) : {};
  } catch {
    return {};
  }
}

function toOpenAiToolName(name: string) {
  return name.replaceAll(".", "__");
}

function fromOpenAiToolName(name: string) {
  return name.replaceAll("__", ".");
}

async function callOpenAi(messages: OpenAiMessage[]) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }

  const registry = getToolRegistry();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.AGENT_MODEL || agentPolicy.defaultModel,
        messages,
        temperature: 0.2,
        tools: [...registry.values()].map((tool) => ({
          type: "function",
          function: {
            name: toOpenAiToolName(tool.name),
            description: `${tool.name}: ${tool.description}`,
            parameters: tool.inputSchema,
          },
        })),
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      throw new Error("OPENAI_REQUEST_FAILED");
    }

    return (await response.json()) as OpenAiChatResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function runAgent(input: RunAgentInput): Promise<RunAgentResult> {
  const toolCalls: ExecutedToolCall[] = [];
  const warnings: string[] = [];
  const registry = getToolRegistry();
  const messages: OpenAiMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    ...normalizeHistory(input.messages),
    {
      role: "user",
      content: input.message.slice(0, agentPolicy.maxInputLength),
    },
  ];

  for (let step = 0; step < agentPolicy.maxSteps; step += 1) {
    const data = await callOpenAi(messages);
    const assistantMessage = data.choices?.[0]?.message;

    if (!assistantMessage) {
      throw new Error("OPENAI_EMPTY_RESPONSE");
    }

    messages.push(assistantMessage);

    if (!assistantMessage.tool_calls?.length) {
      return {
        assistantMessage: assistantMessage.content ?? "",
        toolCalls,
        warnings,
      };
    }

    const calls = assistantMessage.tool_calls.slice(
      0,
      agentPolicy.maxToolCallsPerRequest - toolCalls.length,
    );

    for (const call of calls) {
      const tool = registry.get(fromOpenAiToolName(call.function.name));
      const args = parseToolArguments(call.function.arguments);
      const result = await executeToolCall(
        tool,
        args,
        input.conversationId ?? null,
      );

      if (result.summary) {
        toolCalls.push(result.summary);
      }

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result.output),
      });
    }

    if (toolCalls.length >= agentPolicy.maxToolCallsPerRequest) {
      warnings.push("Maximale Tool-Anzahl erreicht.");
      break;
    }
  }

  return {
    assistantMessage:
      "Ich habe den Schritt begrenzt, damit nichts unbeaufsichtigt weiterläuft. Bitte formuliere kurz neu, was ich als Nächstes tun soll.",
    toolCalls,
    warnings,
  };
}
