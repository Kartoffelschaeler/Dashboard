import { updateGoogleEvent } from "@/lib/services/google-calendar-service";
import { toolError, toolSuccess } from "@/lib/agent/tools/tool-result";
import type { AgentToolResult } from "@/types/agent";
import type {
  CreateGoogleEventInput,
  GoogleCalendarEvent,
} from "@/types/google-calendar";

export async function updateCalendarEventTool(
  eventId: string,
  input: CreateGoogleEventInput,
): Promise<AgentToolResult<GoogleCalendarEvent>> {
  try {
    return toolSuccess(await updateGoogleEvent(eventId, input));
  } catch (error) {
    return toolError(error);
  }
}
