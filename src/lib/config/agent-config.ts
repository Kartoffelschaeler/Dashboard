export type AgentConfig = {
  model: string | null;
  baseUrl: string;
};

export function getAgentConfig(): AgentConfig {
  return {
    model: process.env.AGENT_MODEL ?? "qwen2.5:7b",
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  };
}
