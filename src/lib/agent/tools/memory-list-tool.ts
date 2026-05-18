import { listMemories } from "@/lib/services/memory-service";
import { toolError, toolSuccess } from "@/lib/agent/tools/tool-result";
import type { AgentToolResult } from "@/types/agent";
import type { AgentMemory } from "@/types/memory";

export async function memoryListTool(
  limit?: number,
): Promise<AgentToolResult<AgentMemory[]>> {
  try {
    return toolSuccess(await listMemories(limit));
  } catch (error) {
    return toolError(error);
  }
}
