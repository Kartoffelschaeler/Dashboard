export type AgentConfig = {
  enabled: boolean;
  model: string | null;
  hasServerApiKey: boolean;
};

export function getAgentConfig(): AgentConfig {
  return {
    enabled: process.env.AGENT_ENABLED === "true",
    model: process.env.AGENT_MODEL ?? null,
    hasServerApiKey: Boolean(process.env.OPENAI_API_KEY),
  };
}
