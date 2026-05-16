import { createEventAdmin } from "@/lib/services/calendar-admin-service";
import { toolError, toolSuccess } from "@/lib/agent/tools/tool-result";
import type { AgentToolResult } from "@/types/agent";
import type {
  CalendarEvent,
  CreateCalendarEventInput,
} from "@/types/calendar";

export async function createEventTool(
  input: CreateCalendarEventInput,
): Promise<AgentToolResult<CalendarEvent>> {
  try {
    return toolSuccess(await createEventAdmin(input));
  } catch (error) {
    return toolError(error);
  }
}
