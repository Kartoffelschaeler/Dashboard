import type { CalendarEventSource } from "@/types/calendar";

const localCalendarColor = "#8aa07a";
const agentCalendarColor = "#b98269";
const googleCalendarColors = [
  "#c79274",
  "#b7a16f",
  "#8fae96",
  "#7fa7ad",
  "#9d93bb",
  "#c1869a",
  "#a9a66f",
  "#d0a06f",
];

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function getCalendarColor(
  calendarId?: string,
  calendarName?: string,
  source: CalendarEventSource = "local",
  isAgentCalendar = false,
) {
  if (source === "local") {
    return localCalendarColor;
  }

  if (isAgentCalendar) {
    return agentCalendarColor;
  }

  const colorKey = calendarId ?? calendarName ?? "google";

  return googleCalendarColors[hashString(colorKey) % googleCalendarColors.length];
}
