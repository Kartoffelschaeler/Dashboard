import type { CalendarEventSource } from "@/types/calendar";

const localCalendarColor = "#7f9f80";
const agentCalendarColor = "#c1869a";
const googleCalendarColors = [
  "#d8955f",
  "#7f9db8",
  "#b58ac9",
  "#c8a24f",
  "#a8755f",
  "#6f9f9a",
  "#b46f85",
  "#8a9a63",
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
