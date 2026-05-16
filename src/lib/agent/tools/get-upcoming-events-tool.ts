import { getEvents } from "@/lib/services/calendar-service";
import { toolError, toolSuccess } from "@/lib/agent/tools/tool-result";
import type { AgentToolResult } from "@/types/agent";
import type { CalendarEvent } from "@/types/calendar";

export async function getUpcomingEventsTool(
  from: Date,
  to: Date,
): Promise<AgentToolResult<CalendarEvent[]>> {
  try {
    return toolSuccess(await getEvents(from, to));
  } catch (error) {
    return toolError(error);
  }
}
