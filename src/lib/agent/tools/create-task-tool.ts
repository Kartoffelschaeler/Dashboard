import { createTask } from "@/lib/services/task-service";
import { toolError, toolSuccess } from "@/lib/agent/tools/tool-result";
import type { AgentToolResult } from "@/types/agent";
import type { Task } from "@/types/task";

export async function createTaskTool(
  text: string,
): Promise<AgentToolResult<Task>> {
  try {
    return toolSuccess(await createTask(text));
  } catch (error) {
    return toolError(error);
  }
}
