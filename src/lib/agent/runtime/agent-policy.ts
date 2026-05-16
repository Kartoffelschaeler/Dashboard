export const agentPolicy = {
  maxSteps: 3,
  maxToolCallsPerRequest: 5,
  maxInputLength: 1600,
  maxHistoryMessages: 8,
  timezone: "Europe/Berlin",
  defaultModel: "gpt-4o-mini",
} as const;

export type AgentToolRiskLevel = "low" | "medium";

export type AgentToolErrorCode =
  | "CALENDAR_NOT_CONNECTED"
  | "AGENT_CALENDAR_NOT_FOUND"
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "TOOL_FAILED";
