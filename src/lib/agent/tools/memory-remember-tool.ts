import { createMemory } from "@/lib/services/memory-service";
import { toolError, toolSuccess } from "@/lib/agent/tools/tool-result";
import type { AgentToolResult } from "@/types/agent";
import type { AgentMemory, CreateAgentMemoryInput } from "@/types/memory";

export async function memoryRememberTool(
  input: CreateAgentMemoryInput,
): Promise<AgentToolResult<AgentMemory>> {
  try {
    return toolSuccess(await createMemory(input));
  } catch (error) {
    return toolError(error);
  }
}
