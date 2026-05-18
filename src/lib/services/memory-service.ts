import { getServerSupabase } from "@/lib/supabase";
import { createServiceError } from "@/lib/services/service-error";
import type {
  AgentMemory,
  AgentMemoryType,
  CreateAgentMemoryInput,
} from "@/types/memory";

const memoryFields =
  "id,content,type,confidence,source,created_at,updated_at,last_used_at,archived";
const memoryTypes = new Set<AgentMemoryType>([
  "fact",
  "instruction",
  "personal_context",
  "preference",
  "project",
  "study",
]);

function getAdminClient() {
  const supabase = getServerSupabase();

  if (!supabase) {
    throw createServiceError("Memory ist serverseitig nicht konfiguriert.");
  }

  return supabase;
}

function normalizeMemoryType(type?: string | null): AgentMemoryType {
  if (type && memoryTypes.has(type as AgentMemoryType)) {
    return type as AgentMemoryType;
  }

  return "preference";
}

function rejectSensitiveMemory(content: string) {
  const lowered = content.toLowerCase();
  const sensitiveMarkers = [
    "api key",
    "apikey",
    "client_secret",
    "geheimnis",
    "passwort",
    "password",
    "private key",
    "secret",
    "service role",
    "token",
  ];

  if (sensitiveMarkers.some((marker) => lowered.includes(marker))) {
    throw createServiceError("MEMORY_CONTAINS_SECRET");
  }
}

function scoreMemory(memory: AgentMemory, query: string) {
  if (!query) {
    return 0;
  }

  const content = memory.content.toLowerCase();
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);

  return terms.reduce(
    (score, term) => score + (content.includes(term) ? 1 : 0),
    0,
  );
}

export async function getRelevantMemories(input: {
  limit?: number;
  query?: string | null;
  type?: string | null;
} = {}) {
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 8);
  const query = input.query?.trim() ?? "";
  const type = input.type ? normalizeMemoryType(input.type) : null;
  let request = getAdminClient()
    .from("agent_memories")
    .select(memoryFields)
    .eq("archived", false)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (type) {
    request = request.eq("type", type);
  }

  const { data, error } = await request;

  if (error) {
    throw createServiceError(error.message);
  }

  const memories = data ?? [];
  const ranked = query
    ? memories
      .map((memory) => ({ memory, score: scoreMemory(memory, query) }))
      .filter((item) => item.score > 0)
      .sort((first, second) => second.score - first.score)
      .map((item) => item.memory)
    : memories;
  const selected = ranked.slice(0, limit);

  if (selected.length > 0) {
    await getAdminClient()
      .from("agent_memories")
      .update({ last_used_at: new Date().toISOString() })
      .in(
        "id",
        selected.map((memory) => memory.id),
      );
  }

  return selected;
}

export async function createMemory(input: CreateAgentMemoryInput) {
  const content = input.content.trim();

  if (!content || content.length > 500) {
    throw createServiceError("INVALID_INPUT");
  }

  rejectSensitiveMemory(content);

  const { data, error } = await getAdminClient()
    .from("agent_memories")
    .insert({
      content,
      type: normalizeMemoryType(input.type),
      confidence: input.confidence ?? 0.8,
      source: input.source ?? "user",
    })
    .select(memoryFields)
    .single();

  if (error) {
    throw createServiceError(error.message);
  }

  return data;
}

export async function updateMemory(
  id: string,
  input: Partial<CreateAgentMemoryInput>,
) {
  const payload: {
    confidence?: number;
    content?: string;
    type?: AgentMemoryType;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (input.content !== undefined) {
    const content = input.content.trim();
    rejectSensitiveMemory(content);
    payload.content = content;
  }

  if (input.type !== undefined) {
    payload.type = normalizeMemoryType(input.type);
  }

  if (input.confidence !== undefined) {
    payload.confidence = input.confidence;
  }

  const { data, error } = await getAdminClient()
    .from("agent_memories")
    .update(payload)
    .eq("id", id)
    .select(memoryFields)
    .single();

  if (error) {
    throw createServiceError(error.message);
  }

  return data;
}

export async function archiveMemory(id: string) {
  const { error } = await getAdminClient()
    .from("agent_memories")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw createServiceError(error.message);
  }
}

export async function listMemories(limit = 20) {
  const { data, error } = await getAdminClient()
    .from("agent_memories")
    .select(memoryFields)
    .eq("archived", false)
    .order("updated_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50));

  if (error) {
    throw createServiceError(error.message);
  }

  return data ?? [];
}
