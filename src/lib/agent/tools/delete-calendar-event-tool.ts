import { deleteGoogleEvent } from "@/lib/services/google-calendar-service";
import { toolError, toolSuccess } from "@/lib/agent/tools/tool-result";
import type { AgentToolResult } from "@/types/agent";

export async function deleteCalendarEventTool(
  eventId: string,
): Promise<AgentToolResult<{ deleted: true }>> {
  try {
    await deleteGoogleEvent(eventId);

    return toolSuccess({ deleted: true });
  } catch (error) {
    return toolError(error);
  }
}
