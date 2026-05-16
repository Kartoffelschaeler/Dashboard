import { getGoogleEvents } from "@/lib/services/google-calendar-service";
import { toolError, toolSuccess } from "@/lib/agent/tools/tool-result";
import type { AgentToolResult } from "@/types/agent";
import type { GoogleCalendarEvent } from "@/types/google-calendar";

export async function getCalendarEventsTool(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<AgentToolResult<GoogleCalendarEvent[]>> {
  try {
    return toolSuccess(await getGoogleEvents(rangeStart, rangeEnd));
  } catch (error) {
    return toolError(error);
  }
}
