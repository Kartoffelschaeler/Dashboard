import { getTasksAdmin } from "@/lib/services/task-admin-service";
import { toolError, toolSuccess } from "@/lib/agent/tools/tool-result";
import type { AgentToolResult } from "@/types/agent";
import type { Task } from "@/types/task";

export async function getOpenTasksTool(): Promise<AgentToolResult<Task[]>> {
  try {
    const tasks = await getTasksAdmin();

    return toolSuccess(tasks.filter((task) => !task.completed));
  } catch (error) {
    return toolError(error);
  }
}
