import type { AgentToolResult } from "@/types/agent";

export function toolSuccess<TData>(data: TData): AgentToolResult<TData> {
  return { ok: true, data };
}

export function toolError<TData = never>(error: unknown): AgentToolResult<TData> {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Aktion fehlgeschlagen.",
  };
}
