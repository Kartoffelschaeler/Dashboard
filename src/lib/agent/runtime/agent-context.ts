import { agentPolicy } from "@/lib/agent/runtime/agent-policy";

export type CurrentDateContext = {
  nowIso: string;
  dateIso: string;
  time: string;
  timezone: string;
  weekdayGerman: string;
  humanReadableGerman: string;
};

function getBerlinParts(date: Date) {
  const parts = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: agentPolicy.timezone,
    weekday: "long",
    year: "numeric",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function createCurrentDateContext(date = new Date()): CurrentDateContext {
  const parts = getBerlinParts(date);
  const dateIso = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour}:${parts.minute}`;

  return {
    nowIso: date.toISOString(),
    dateIso,
    time,
    timezone: agentPolicy.timezone,
    weekdayGerman: parts.weekday,
    humanReadableGerman: new Intl.DateTimeFormat("de-DE", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: agentPolicy.timezone,
    }).format(date),
  };
}

export type AgentRuntimeContext = {
  conversationId: string | null;
  currentDate: CurrentDateContext;
  enabledTools: string[];
  timezone: string;
};

export function createAgentRuntimeContext(
  conversationId: string | null,
  enabledTools: string[],
): AgentRuntimeContext {
  return {
    conversationId,
    currentDate: createCurrentDateContext(),
    enabledTools,
    timezone: agentPolicy.timezone,
  };
}
