import { createTaskAdmin, getTasksAdmin } from "@/lib/services/task-admin-service";
import { getEventsAdmin } from "@/lib/services/calendar-admin-service";
import {
  createGoogleEvent,
  getGoogleEventsWithWarnings,
} from "@/lib/services/google-calendar-service";
import {
  createMemory,
  getRelevantMemories,
  listMemories,
} from "@/lib/services/memory-service";
import type { AgentToolRiskLevel } from "@/lib/agent/runtime/agent-policy";
import type { AgentRuntimeContext } from "@/lib/agent/runtime/agent-context";
import type { AgentMemoryType } from "@/types/memory";

type JsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

const memoryTypes = new Set<AgentMemoryType>([
  "fact",
  "instruction",
  "personal_context",
  "preference",
  "project",
  "study",
]);

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

function assertOptionalNumber(
  input: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = input[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error("INVALID_INPUT");
  }

  return value;
}

function normalizeMemoryType(type: string | null): AgentMemoryType {
  if (type && memoryTypes.has(type as AgentMemoryType)) {
    return type as AgentMemoryType;
  }

  return "preference";
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

export function getToolRegistry(context: AgentRuntimeContext) {
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
        return context.currentDate;
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
            description:
              "Konkrete ISO Startzeit auf Basis des aktuellen Datums im System Prompt. Optional, Standard ist jetzt.",
          },
          to: {
            type: "string",
            description:
              "Konkrete ISO Endzeit auf Basis des aktuellen Datums im System Prompt. Optional, Standard ist in 30 Tagen.",
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
            description:
              "Konkrete ISO Startzeit oder Datum auf Basis des aktuellen Datums im System Prompt.",
          },
          endDate: {
            type: "string",
            description:
              "Optionale konkrete ISO Endzeit oder exklusives Ganztags-Enddatum.",
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
    {
      name: "memory.search",
      description:
        "Sucht stabile persönliche Informationen, Vorlieben und Kontext. Nicht fuer Termine oder Aufgaben verwenden.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Kurzer Suchtext fuer relevante Memories.",
          },
          type: {
            type: "string",
            description:
              "Optional: preference, fact, project, study, instruction oder personal_context.",
          },
          limit: {
            type: "number",
            description: "Optional, maximal 8.",
          },
        },
        additionalProperties: false,
      },
      riskLevel: "low",
      requiresConfirmation: false,
      handler: async (input) => {
        const object = assertObject(input);
        const query = assertOptionalString(object, "query");
        const type = assertOptionalString(object, "type");
        const limit = assertOptionalNumber(object, "limit");

        return getRelevantMemories({ limit, query, type });
      },
    },
    {
      name: "memory.remember",
      description:
        "Speichert eine stabile persönliche Information nur auf ausdruecklichen Nutzerwunsch. Keine Termine, Aufgaben oder Secrets speichern.",
      inputSchema: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "Die dauerhaft zu merkende Information.",
            maxLength: 500,
          },
          type: {
            type: "string",
            description:
              "preference, fact, project, study, instruction oder personal_context.",
          },
          confidence: {
            type: "number",
            description: "Optionale Sicherheit zwischen 0 und 1.",
          },
        },
        required: ["content"],
        additionalProperties: false,
      },
      riskLevel: "medium",
      requiresConfirmation: false,
      handler: async (input) => {
        const object = assertObject(input);
        const content = assertString(object, "content");
        const type = assertOptionalString(object, "type");
        const confidence = assertOptionalNumber(object, "confidence");

        return createMemory({
          content,
          confidence,
          type: normalizeMemoryType(type),
        });
      },
    },
    {
      name: "memory.list",
      description:
        "Listet gespeicherte Memories nur auf explizite Nutzerfrage.",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Optional, maximal 50.",
          },
        },
        additionalProperties: false,
      },
      riskLevel: "low",
      requiresConfirmation: false,
      handler: async (input) => {
        const object = assertObject(input);
        const limit = assertOptionalNumber(object, "limit");

        return listMemories(limit);
      },
    },
  ];

  return new Map(tools.map((tool) => [tool.name, tool]));
}
