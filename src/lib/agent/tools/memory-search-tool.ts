import { getRelevantMemories } from "@/lib/services/memory-service";
import { toolError, toolSuccess } from "@/lib/agent/tools/tool-result";
import type { AgentToolResult } from "@/types/agent";
import type { AgentMemory } from "@/types/memory";

export async function memorySearchTool(input: {
  limit?: number;
  query?: string | null;
  type?: string | null;
}): Promise<AgentToolResult<AgentMemory[]>> {
  try {
    return toolSuccess(await getRelevantMemories(input));
  } catch (error) {
    return toolError(error);
  }
}
