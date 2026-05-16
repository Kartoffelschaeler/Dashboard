import { createTaskAdmin, getTasksAdmin } from "@/lib/services/task-admin-service";
import { getEventsAdmin } from "@/lib/services/calendar-admin-service";
import {
  createGoogleEvent,
  getGoogleEventsWithWarnings,
} from "@/lib/services/google-calendar-service";
import { agentPolicy, type AgentToolRiskLevel } from "@/lib/agent/runtime/agent-policy";

type JsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

export type AgentToolDefinition<TInput = unknown> = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  riskLevel: AgentToolRiskLevel;
  requiresConfirmation: boolean;
  handler: (input: TInput) => Promise<unknown>;
};

function assertObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("INVALID_INPUT");
  }

  return input as Record<string, unknown>;
}

function assertOptionalString(
  input: Record<string, unknown>,
  key: string,
): string | null {
  const value = input[key];

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("INVALID_INPUT");
  }

  return value;
}

function assertString(input: Record<string, unknown>, key: string) {
  const value = input[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error("INVALID_INPUT");
  }

  return value.trim();
}

function assertOptionalBoolean(input: Record<string, unknown>, key: string) {
  const value = input[key];

  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value !== "boolean") {
    throw new Error("INVALID_INPUT");
  }

  return value;
}

function parseDateRange(input: unknown) {
  const object = assertObject(input);
  const now = new Date();
  const defaultEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const fromValue = assertOptionalString(object, "from");
  const toValue = assertOptionalString(object, "to");
  const from = fromValue ? new Date(fromValue) : now;
  const to = toValue ? new Date(toValue) : defaultEnd;

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error("INVALID_INPUT");
  }

  return { from, to };
}

export function getToolRegistry() {
  const tools: AgentToolDefinition[] = [
    {
      name: "system.getCurrentDate",
      description: "Liefert aktuelles Datum, Uhrzeit und Zeitzone.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      riskLevel: "low",
      requiresConfirmation: false,
      handler: async () => {
        const now = new Date();

        return {
          timezone: agentPolicy.timezone,
          iso: now.toISOString(),
          date: new Intl.DateTimeFormat("de-DE", {
            dateStyle: "full",
            timeZone: agentPolicy.timezone,
          }).format(now),
          time: new Intl.DateTimeFormat("de-DE", {
            timeStyle: "short",
            timeZone: agentPolicy.timezone,
          }).format(now),
        };
      },
    },
    {
      name: "tasks.getOpenTasks",
      description: "Liest offene Aufgaben aus der Zentrale.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      riskLevel: "low",
      requiresConfirmation: false,
      handler: async () => {
        const tasks = await getTasksAdmin();

        return tasks.filter((task) => !task.completed);
      },
    },
    {
      name: "tasks.createTask",
      description: "Erstellt eine neue Aufgabe in der Zentrale.",
      inputSchema: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Kurzer Aufgabentext.",
            maxLength: 160,
          },
        },
        required: ["text"],
        additionalProperties: false,
      },
      riskLevel: "medium",
      requiresConfirmation: false,
      handler: async (input) => {
        const object = assertObject(input);
        const text = assertString(object, "text");

        if (text.length > 160) {
          throw new Error("INVALID_INPUT");
        }

        return createTaskAdmin(text);
      },
    },
    {
      name: "calendar.getUpcomingEvents",
      description:
        "Liest lokale Termine und Google-Termine aus allen verbundenen Kalendern für einen Zeitraum.",
      inputSchema: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: "ISO Startzeit. Optional, Standard ist jetzt.",
          },
          to: {
            type: "string",
            description: "ISO Endzeit. Optional, Standard ist in 30 Tagen.",
          },
        },
        additionalProperties: false,
      },
      riskLevel: "low",
      requiresConfirmation: false,
      handler: async (input) => {
        const { from, to } = parseDateRange(input);
        const [localEvents, googleResult] = await Promise.all([
          getEventsAdmin(from, to),
          getGoogleEventsWithWarnings(from, to).catch(() => ({
            events: [],
            warnings: [{ message: "Google Kalender konnten nicht geladen werden." }],
          })),
        ]);

        return {
          localEvents,
          googleEvents: googleResult.events,
          warnings: googleResult.warnings,
        };
      },
    },
    {
      name: "calendar.createEvent",
      description:
        "Erstellt einen neuen Termin ausschließlich im Google Agent-Kalender.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Termintitel." },
          description: { type: "string", description: "Optionale Beschreibung." },
          startDate: {
            type: "string",
            description: "ISO Startzeit oder Datum.",
          },
          endDate: {
            type: "string",
            description: "Optionale ISO Endzeit oder exklusives Ganztags-Enddatum.",
          },
          allDay: {
            type: "boolean",
            description: "Ob der Termin ganztägig ist.",
          },
        },
        required: ["title", "startDate"],
        additionalProperties: false,
      },
      riskLevel: "medium",
      requiresConfirmation: false,
      handler: async (input) => {
        const object = assertObject(input);
        const title = assertString(object, "title");
        const startDate = assertString(object, "startDate");
        const endDate = assertOptionalString(object, "endDate");
        const description = assertOptionalString(object, "description");
        const allDay = assertOptionalBoolean(object, "allDay");

        return createGoogleEvent({
          title,
          description,
          startDate,
          endDate,
          allDay,
        });
      },
    },
  ];

  return new Map(tools.map((tool) => [tool.name, tool]));
}
