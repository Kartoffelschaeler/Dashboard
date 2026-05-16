import { agentPolicy } from "@/lib/agent/runtime/agent-policy";

export type OllamaChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaChatResponse = {
  message?: {
    content?: string;
  };
};

function getOllamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(
    /\/$/,
    "",
  );
}

function getOllamaModel() {
  return process.env.AGENT_MODEL || agentPolicy.defaultModel;
}

function mapOllamaError(status: number, body: string) {
  if (status === 404 || body.toLowerCase().includes("not found")) {
    return "OLLAMA_MODEL_NOT_FOUND";
  }

  return "OLLAMA_REQUEST_FAILED";
}

export async function chatWithOllama(messages: OllamaChatMessage[]) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: getOllamaModel(),
        messages,
        stream: false,
        format: "json",
        options: {
          temperature: 0.2,
        },
      }),
    });
    const text = await response.text();

    if (!response.ok) {
      throw new Error(mapOllamaError(response.status, text));
    }

    const data = JSON.parse(text) as OllamaChatResponse;
    const content = data.message?.content;

    if (!content) {
      throw new Error("OLLAMA_EMPTY_RESPONSE");
    }

    return { content };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("OLLAMA_UNREACHABLE");
      }

      if (error.message.startsWith("OLLAMA_")) {
        throw error;
      }
    }

    throw new Error("OLLAMA_UNREACHABLE");
  } finally {
    clearTimeout(timeoutId);
  }
}
