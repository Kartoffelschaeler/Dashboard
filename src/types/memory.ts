export type AgentMemoryType =
  | "fact"
  | "instruction"
  | "personal_context"
  | "preference"
  | "project"
  | "study";

export type AgentMemory = {
  id: string;
  content: string;
  type: AgentMemoryType;
  confidence: number;
  source: string;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
  archived: boolean;
};

export type CreateAgentMemoryInput = {
  content: string;
  type?: AgentMemoryType;
  confidence?: number;
  source?: string;
};
